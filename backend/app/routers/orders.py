"""Checkout: prices are recomputed server-side from the database, never trusted from the client."""
import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.security import get_current_user
from app.core.utils import to_dict
from app.models import CartLead, Coupon, Order, PaymentSettings, Product
from app.services.email import send_order_email
from app.services import meta

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


class Item(BaseModel):
    product_id: str | None = None
    slug: str | None = None
    quantity: int = 1
    color: str | None = None
    size: str | None = None


class OrderIn(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    shipping_address: str
    city: str | None = None
    payment_method: str = "cod"
    notes: str | None = None
    coupon_code: str | None = None
    items: list[Item]
    idempotency_key: str | None = None
    session_id: str | None = None
    attribution: dict | None = None


def apply_coupon(db, code, subtotal: float):
    if not code: return 0.0, None
    c = db.query(Coupon).filter(Coupon.code == code.strip().upper(), Coupon.active.is_(True)).first()
    if not c: return 0.0, "Invalid coupon"
    if c.expires_at and c.expires_at < datetime.now(timezone.utc): return 0.0, "Coupon expired"
    if c.usage_limit is not None and c.used_count >= c.usage_limit: return 0.0, "Coupon usage limit reached"
    if subtotal < float(c.min_order): return 0.0, f"Minimum order Rs {float(c.min_order):,.0f}"
    d = subtotal * float(c.discount_value) / 100 if c.discount_type == "percent" else float(c.discount_value)
    return round(min(d, subtotal), 2), None


def _email_bg(order_id, template):
    db = SessionLocal()
    try:
        o = db.get(Order, order_id)
        if o: send_order_email(db, o, template)
    finally:
        db.close()


@router.post("")
def create_order(body: OrderIn, request: Request, bg: BackgroundTasks, db: Session = Depends(get_db),
                 user=Depends(get_current_user)):
    if body.idempotency_key:
        ex = db.query(Order).filter(Order.idempotency_key == body.idempotency_key).first()
        if ex: return {"ok": True, "order": to_dict(ex), "duplicate": True}
    if not body.items: raise HTTPException(400, "Cart is empty")
    pay = db.query(PaymentSettings).first()
    items, subtotal = [], Decimal(0)
    for it in body.items:
        q = db.query(Product).filter(Product.active.is_(True))
        p = q.filter(Product.id == it.product_id).first() if it.product_id else q.filter(Product.slug == it.slug).first()
        if not p: raise HTTPException(400, f"Product not available: {it.slug or it.product_id}")
        qty = max(1, min(int(it.quantity), 20))
        if p.stock is not None and p.stock < qty: raise HTTPException(400, f"Not enough stock for {p.name}")
        price = p.sale_price or p.price
        subtotal += price * qty
        items.append({"product_id": str(p.id), "slug": p.slug, "name": p.name, "image_url": p.image_url,
                      "price": float(price), "quantity": qty, "color": it.color, "size": it.size})
        p.stock -= qty
    discount, err = apply_coupon(db, body.coupon_code, float(subtotal))
    if err: raise HTTPException(400, err)
    free_above = float(pay.free_delivery_above) if pay else 5000
    shipping = 0 if float(subtotal) - discount >= free_above else (float(pay.delivery_charge) if pay else 250)
    if body.payment_method == "cod" and pay: shipping += float(pay.cod_charge)
    total = float(subtotal) - discount + shipping
    a = body.attribution or {}
    now = datetime.now(timezone.utc)
    o = Order(order_number="TM" + now.strftime("%y%m%d") + secrets.token_hex(2).upper(),
              user_id=user.id if user else None, customer_name=body.customer_name.strip()[:120],
              customer_email=body.customer_email.lower(), customer_phone=body.customer_phone[:30],
              shipping_address=body.shipping_address[:500], city=body.city, payment_method=body.payment_method,
              notes=body.notes, items=items, subtotal=subtotal, discount=discount, shipping=shipping, total=total,
              coupon_code=body.coupon_code.upper() if body.coupon_code and discount else None,
              status="pending", status_history=[{"status": "pending", "at": now.isoformat()}],
              idempotency_key=body.idempotency_key, attribution=a,
              **{k: (str(a.get(k))[:300] if a.get(k) else None) for k in
                 ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "fbp", "fbc")})
    db.add(o)
    if o.coupon_code:
        c = db.query(Coupon).filter(Coupon.code == o.coupon_code).first()
        if c: c.used_count += 1
    if body.session_id:
        lead = db.query(CartLead).filter(CartLead.session_id == body.session_id).first()
        if lead: lead.stage, lead.order_number = "ordered", o.order_number
    db.commit()
    o.purchase_event_id = f"purchase_{o.id}"; db.commit()
    bg.add_task(_email_bg, o.id, "placed")
    bg.add_task(_purchase_bg, o.id, request.client.host if request.client else None, request.headers.get("user-agent"))
    return {"ok": True, "order": to_dict(o)}


def _purchase_bg(order_id, ip, ua):
    db = SessionLocal()
    try:
        o = db.get(Order, order_id)
        if o:
            meta.send_event(db, "Purchase", o.purchase_event_id, value=o.total, order=o, email=o.customer_email,
                            phone=o.customer_phone, fbp=o.fbp, fbc=o.fbc, ip=ip, ua=ua,
                            custom={"content_ids": [i["product_id"] for i in o.items], "content_type": "product"})
    finally:
        db.close()


@router.get("/{order_number}")
def track(order_number: str, email: str | None = None, phone: str | None = None, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.order_number == order_number.upper()).first()
    if not o or not ((email and email.lower() == o.customer_email) or (phone and phone[-7:] == (o.customer_phone or "")[-7:])):
        raise HTTPException(404, "Order not found")
    d = to_dict(o)
    for k in ("attribution", "fbclid", "fbp", "fbc", "idempotency_key", "user_id"): d.pop(k, None)
    return {"ok": True, "order": d}
