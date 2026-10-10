"""Admin API: generic CRUD for every table + orders, stats, emails, leads, uploads, settings."""
import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_admin
from app.core.utils import coerce, col_kind, slugify, to_dict
from app import models as M
from app.routers.orders import _email_bg

router = APIRouter(prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(require_admin)])

RESOURCES = {
    "products": M.Product, "collections": M.Collection, "categories": M.Category, "deals": M.Deal,
    "coupons": M.Coupon, "hero_slides": M.HeroSlide, "popups": M.Popup, "reviews": M.Review,
    "blog_posts": M.BlogPost, "faqs": M.Faq, "trust_sections": M.TrustSection, "cart_leads": M.CartLead,
}
READONLY = {"order_emails": M.OrderEmail, "analytics_events": M.AnalyticsEvent, "meta_event_log": M.MetaEventLog,
            "profiles": M.Profile}
SINGLETONS = {"site_settings": M.SiteSettings, "payment_settings": M.PaymentSettings, "meta_settings": M.MetaSettings}
STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
EMAIL_ON = {"confirmed", "shipped", "delivered", "cancelled"}


def _model(name):
    m = RESOURCES.get(name) or READONLY.get(name)
    if not m: raise HTTPException(404, "Unknown resource")
    return m


@router.get("/schema")
def schema():
    out = {}
    for n, m in {**RESOURCES, **READONLY, **SINGLETONS, "orders": M.Order}.items():
        out[n] = {"readonly": n in READONLY, "singleton": n in SINGLETONS,
                  "columns": [{"name": c.name, "kind": col_kind(c), "required": not c.nullable and c.default is None}
                              for c in m.__table__.columns]}
    return {"ok": True, "schema": out}


@router.get("/r/{name}")
def list_rows(name: str, limit: int = 500, db: Session = Depends(get_db)):
    m = _model(name)
    order = m.created_at.desc() if hasattr(m, "created_at") else None
    rows = db.query(m).order_by(order).limit(min(limit, 5000)).all()
    return {"ok": True, "rows": [to_dict(r) for r in rows]}


@router.post("/r/{name}")
def create_row(name: str, body: dict, db: Session = Depends(get_db)):
    if name not in RESOURCES: raise HTTPException(400, "Read-only resource")
    m = RESOURCES[name]
    data = coerce(m, body)
    if "slug" in m.__table__.columns and not data.get("slug"):
        data["slug"] = slugify(body.get("name") or body.get("title") or "")
    row = m(**data); db.add(row)
    try: db.commit()
    except Exception as e:
        db.rollback(); raise HTTPException(400, str(e.__cause__ or e)[:300])
    return {"ok": True, "row": to_dict(row)}


@router.put("/r/{name}/{rid}")
def update_row(name: str, rid: uuid.UUID, body: dict, db: Session = Depends(get_db)):
    if name not in RESOURCES: raise HTTPException(400, "Read-only resource")
    row = db.get(RESOURCES[name], rid)
    if not row: raise HTTPException(404, "Not found")
    for k, v in coerce(RESOURCES[name], body).items(): setattr(row, k, v)
    try: db.commit()
    except Exception as e:
        db.rollback(); raise HTTPException(400, str(e.__cause__ or e)[:300])
    return {"ok": True, "row": to_dict(row)}


@router.delete("/r/{name}/{rid}")
def delete_row(name: str, rid: uuid.UUID, db: Session = Depends(get_db)):
    if name not in RESOURCES: raise HTTPException(400, "Read-only resource")
    row = db.get(RESOURCES[name], rid)
    if row: db.delete(row); db.commit()
    return {"ok": True}


@router.get("/settings/{name}")
def get_singleton(name: str, db: Session = Depends(get_db)):
    m = SINGLETONS.get(name) or (_ for _ in ()).throw(HTTPException(404))
    row = db.query(m).first()
    if not row: row = m(); db.add(row); db.commit()
    return {"ok": True, "row": to_dict(row)}


@router.put("/settings/{name}")
def put_singleton(name: str, body: dict, db: Session = Depends(get_db)):
    m = SINGLETONS.get(name)
    if not m: raise HTTPException(404)
    row = db.query(m).first() or m()
    for k, v in coerce(m, body).items(): setattr(row, k, v)
    db.add(row); db.commit()
    return {"ok": True, "row": to_dict(row)}


# ---------- Orders ----------
@router.get("/orders")
def orders(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(M.Order)
    if status: q = q.filter(M.Order.status == status)
    return {"ok": True, "orders": [to_dict(o) for o in q.order_by(M.Order.created_at.desc()).limit(2000)]}


@router.patch("/orders/{oid}")
def update_order(oid: uuid.UUID, body: dict, bg: BackgroundTasks, db: Session = Depends(get_db)):
    o = db.get(M.Order, oid)
    if not o: raise HTTPException(404, "Order not found")
    new = body.get("status")
    if new and new not in STATUSES: raise HTTPException(400, f"status must be one of {STATUSES}")
    for k in ("notes", "tracking_number", "courier"):
        if k in body: setattr(o, k, body[k])
    if body.get("estimated_delivery"): o.estimated_delivery = datetime.fromisoformat(body["estimated_delivery"])
    changed = new and new != o.status
    if changed:
        o.status = new
        o.status_history = [*(o.status_history or []), {"status": new, "at": datetime.now(timezone.utc).isoformat()}]
    db.commit()
    if changed and new in EMAIL_ON and body.get("notify", True):
        bg.add_task(_email_bg, o.id, new)
    return {"ok": True, "order": to_dict(o)}


@router.post("/orders/{oid}/email")
def resend_email(oid: uuid.UUID, body: dict, bg: BackgroundTasks, db: Session = Depends(get_db)):
    if not db.get(M.Order, oid): raise HTTPException(404)
    bg.add_task(_email_bg, oid, body.get("template", "placed"))
    return {"ok": True}


# ---------- Dashboard ----------
@router.get("/stats")
def stats(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(M.Order).filter(M.Order.created_at >= since, M.Order.status != "cancelled")
    revenue = float(q.with_entities(func.coalesce(func.sum(M.Order.total), 0)).scalar())
    count = q.count()
    ev = dict(db.query(M.AnalyticsEvent.event_name, func.count()).filter(M.AnalyticsEvent.created_at >= since)
              .group_by(M.AnalyticsEvent.event_name).all())
    return {"ok": True, "days": days, "revenue": revenue, "orders": count, "aov": revenue / count if count else 0,
            "products": db.query(M.Product).count(), "customers": db.query(M.User).count(),
            "leads": db.query(M.CartLead).filter(M.CartLead.stage != "ordered").count(),
            "by_status": dict(db.query(M.Order.status, func.count()).group_by(M.Order.status).all()),
            "funnel": {k: ev.get(k, 0) for k in ("page_view", "view_item", "add_to_cart", "begin_checkout", "purchase")}}


# ---------- Uploads ----------
ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".mp4", ".webm", ".mov"}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED: raise HTTPException(400, "File type not allowed")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    size, limit = 0, settings.MAX_UPLOAD_MB * 1024 * 1024
    with open(os.path.join(settings.UPLOAD_DIR, name), "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                f.close(); os.remove(os.path.join(settings.UPLOAD_DIR, name))
                raise HTTPException(413, "File too large")
            f.write(chunk)
    return {"ok": True, "url": f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{name}"}


# ---------- Users / roles ----------
@router.get("/users")
def users(db: Session = Depends(get_db)):
    roles = {}
    for r in db.query(M.UserRole).all(): roles.setdefault(str(r.user_id), []).append(r.role)
    return {"ok": True, "users": [{"id": str(u.id), "email": u.email, "created_at": u.created_at.isoformat(),
                                   "roles": roles.get(str(u.id), [])} for u in db.query(M.User).all()]}


@router.post("/users/{uid}/role")
def set_role(uid: uuid.UUID, body: dict, db: Session = Depends(get_db), me=Depends(require_admin)):
    role = body.get("role")
    if role not in ("admin", "staff", "user"): raise HTTPException(400, "bad role")
    if uid == me.id and not body.get("grant", True): raise HTTPException(400, "Cannot remove your own role")
    ex = db.query(M.UserRole).filter_by(user_id=uid, role=role).first()
    if body.get("grant", True) and not ex: db.add(M.UserRole(user_id=uid, role=role))
    if not body.get("grant", True) and ex: db.delete(ex)
    db.commit()
    return {"ok": True}
