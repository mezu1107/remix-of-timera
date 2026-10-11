"""Create (or promote) an admin account.
Usage: python -m scripts.create_admin admin@example.com StrongPassword
"""
import sys

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app import models as M


def main(email: str, password: str):
    Base.metadata.create_all(engine)
    db = SessionLocal()
    email = email.lower().strip()
    u = db.query(M.User).filter(M.User.email == email).first()
    if not u:
        u = M.User(email=email, password_hash=hash_password(password)); db.add(u); db.flush()
        db.add(M.Profile(id=u.id, email=email))
    else:
        u.password_hash = hash_password(password)
    for role in ("admin", "user"):
        if not db.query(M.UserRole).filter_by(user_id=u.id, role=role).first():
            db.add(M.UserRole(user_id=u.id, role=role))
    db.commit()
    print(f"Admin ready: {email}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python -m scripts.create_admin EMAIL PASSWORD")
    main(sys.argv[1], sys.argv[2])
