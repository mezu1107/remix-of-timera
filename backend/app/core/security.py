import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: uuid.UUID) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.JWT_SECRET, algorithm="HS256")


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
):
    from app.models import User

    if not cred:
        return None
    try:
        payload = jwt.decode(cred.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user = db.get(User, uuid.UUID(payload["sub"]))
    except Exception:
        return None
    return user


def require_user(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(401, "Sign in required")
    return user


def user_roles(db: Session, user_id) -> list[str]:
    from app.models import UserRole

    return [r.role for r in db.query(UserRole).filter(UserRole.user_id == user_id).all()]


def require_admin(user=Depends(require_user), db: Session = Depends(get_db)):
    if not set(user_roles(db, user.id)) & {"admin", "staff"}:
        raise HTTPException(403, "Admin access required")
    return user
