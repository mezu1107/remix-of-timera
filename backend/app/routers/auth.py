from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_token, hash_password, require_user, user_roles, verify_password
from app.core.utils import coerce, to_dict
from app.models import Order, Profile, User, UserRole

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class Creds(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


def _session(db, user):
    return {"ok": True, "token": create_token(user.id), "user": {"id": str(user.id), "email": user.email},
            "roles": user_roles(db, user.id)}


@router.post("/signup")
def signup(c: Creds, db: Session = Depends(get_db)):
    if len(c.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    email = c.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email already registered")
    u = User(email=email, password_hash=hash_password(c.password))
    db.add(u); db.flush()
    db.add(UserRole(user_id=u.id, role="user"))
    db.add(Profile(id=u.id, email=email, full_name=c.full_name))
    db.commit()
    return _session(db, u)


@router.post("/login")
def login(c: Creds, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == c.email.lower()).first()
    if not u or not verify_password(c.password, u.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return _session(db, u)


@router.get("/session")
def session(user=Depends(require_user), db: Session = Depends(get_db)):
    return {"ok": True, "signed_in": True, "user": {"id": str(user.id), "email": user.email},
            "roles": user_roles(db, user.id)}


@router.get("/profile")
def get_profile(user=Depends(require_user), db: Session = Depends(get_db)):
    p = db.get(Profile, user.id)
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return {"ok": True, "profile": to_dict(p) if p else None, "orders": [to_dict(o) for o in orders]}


@router.put("/profile")
def put_profile(body: dict, user=Depends(require_user), db: Session = Depends(get_db)):
    p = db.get(Profile, user.id) or Profile(id=user.id, email=user.email)
    for k, v in coerce(Profile, body).items():
        setattr(p, k, v)
    db.add(p); db.commit()
    return {"ok": True, "profile": to_dict(p)}
