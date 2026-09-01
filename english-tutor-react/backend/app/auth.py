from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .models import Profile, User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(UTC) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> UUID | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def authenticate_parent(db: Session, pin: str, phone: str | None = None, family_code: str | None = None) -> User | None:
    user = None
    if phone:
        user = db.query(User).filter(User.phone == phone).first()
    elif family_code:
        user = db.query(User).filter(User.family_code == family_code.strip().upper()).first()
    if not user or not verify_password(pin, user.password_hash):
        return None
    return user


def profile_to_dict(profile: Profile, email: str | None = None, phone: str | None = None) -> dict:
    user = profile.user
    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "role": profile.role.value,
        "email": email if email is not None else (user.email if user else None),
        "phone": phone if phone is not None else (user.phone if user else None),
        "family_code": user.family_code if user else None,
        "can_access_private_lessons": profile.can_access_private_lessons,
        "can_access_math_grade9": profile.can_access_math_grade9,
        "can_access_math_grade12": profile.can_access_math_grade12,
        "can_access_physics_grade12": profile.can_access_physics_grade12,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }
