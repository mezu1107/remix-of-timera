"""Public storefront API (read-only catalogue + settings)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.utils import to_dict
from app.models import (BlogPost, Category, Collection, Coupon, Deal, Faq, HeroSlide, PaymentSettings, Popup,
                        Product, Review, SiteSettings, TrustSection)

router = APIRouter(prefix="/api/v1", tags=["public"])


def _active(db, model):
    return [to_dict(r) for r in db.query(model).filter(model.active.is_(True)).order_by(model.sort_order).all()]


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/products")
def products(type: str | None = None, collection: str | None = None, category: str | None = None,
             featured: bool | None = None, q: str | None = None, db: Session = Depends(get_db)):
    qs = db.query(Product).filter(Product.active.is_(True))
    if type: qs = qs.filter(Product.product_type == type)
    if collection: qs = qs.filter(Product.collection == collection)
    if category: qs = qs.filter(Product.category == category)
    if featured is not None: qs = qs.filter(Product.featured.is_(featured))
    if q: qs = qs.filter(or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%")))
    return {"ok": True, "products": [to_dict(p) for p in qs.order_by(Product.sort_order, Product.created_at.desc())]}


@router.get("/products/{slug}")
def product(slug: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.slug == slug, Product.active.is_(True)).first()
    if not p:
        raise HTTPException(404, "Product not found")
    reviews = db.query(Review).filter(Review.product_id == p.id, Review.approved.is_(True)).all()
    return {"ok": True, "product": to_dict(p), "reviews": [to_dict(r) for r in reviews]}


@router.get("/collections")
def collections(db: Session = Depends(get_db)): return {"ok": True, "collections": _active(db, Collection)}


@router.get("/categories")
def categories(db: Session = Depends(get_db)): return {"ok": True, "categories": _active(db, Category)}


@router.get("/hero-slides")
def hero(db: Session = Depends(get_db)): return {"ok": True, "slides": _active(db, HeroSlide)}


@router.get("/faqs")
def faqs(db: Session = Depends(get_db)): return {"ok": True, "faqs": _active(db, Faq)}


@router.get("/trust")
def trust(db: Session = Depends(get_db)): return {"ok": True, "sections": _active(db, TrustSection)}


@router.get("/deals")
def deals(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    rows = [d for d in db.query(Deal).filter(Deal.active.is_(True)).order_by(Deal.sort_order)
            if (not d.ends_at or d.ends_at >= now) and (not d.starts_at or d.starts_at <= now)]
    return {"ok": True, "deals": [to_dict(d) for d in rows]}


@router.get("/popups")
def popups(db: Session = Depends(get_db)): return {"ok": True, "popups": _active(db, Popup)}


@router.get("/reviews")
def reviews(db: Session = Depends(get_db)):
    rows = db.query(Review).filter(Review.approved.is_(True)).order_by(Review.created_at.desc()).limit(100)
    return {"ok": True, "reviews": [to_dict(r) for r in rows]}


@router.post("/reviews")
def submit_review(body: dict, db: Session = Depends(get_db)):
    name, rating = (body.get("customer_name") or "").strip(), int(body.get("rating") or 0)
    if not name or not 1 <= rating <= 5:
        raise HTTPException(400, "Name and rating 1-5 required")
    r = Review(product_id=body.get("product_id") or None, customer_name=name[:100], rating=rating,
               title=(body.get("title") or "")[:200], body=(body.get("body") or "")[:3000], approved=False)
    db.add(r); db.commit()
    return {"ok": True, "message": "Review submitted for approval"}


@router.get("/blog")
def blog(db: Session = Depends(get_db)):
    rows = db.query(BlogPost).filter(BlogPost.published.is_(True)).order_by(BlogPost.published_at.desc())
    return {"ok": True, "posts": [to_dict(p) for p in rows]}


@router.get("/blog/{slug}")
def blog_post(slug: str, db: Session = Depends(get_db)):
    p = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published.is_(True)).first()
    if not p: raise HTTPException(404, "Post not found")
    return {"ok": True, "post": to_dict(p)}


@router.get("/settings")
def site_settings(db: Session = Depends(get_db)):
    s = db.query(SiteSettings).first()
    p = db.query(PaymentSettings).first()
    return {"ok": True, "settings": to_dict(s) if s else {}, "payment": to_dict(p) if p else {}}


@router.post("/coupons/validate")
def validate_coupon(body: dict, db: Session = Depends(get_db)):
    from app.routers.orders import apply_coupon
    discount, err = apply_coupon(db, body.get("code"), float(body.get("subtotal") or 0))
    if err: return {"ok": False, "error": err}
    return {"ok": True, "code": (body.get("code") or "").upper(), "discount": discount}
