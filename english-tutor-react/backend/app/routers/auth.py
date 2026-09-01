from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import authenticate_parent, authenticate_user, create_access_token, profile_to_dict
from ..database import get_db
from ..deps import get_current_user_id
from ..models import AppRole, Profile, User
from ..phone import normalize_syrian_phone
from ..schemas import LoginRequest, ParentLoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    profile = db.query(Profile).filter(Profile.id == user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Profile not found")
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "phone": user.phone},
        profile=profile_to_dict(profile),
    )


@router.post("/parent-login", response_model=TokenResponse)
def parent_login(body: ParentLoginRequest, db: Session = Depends(get_db)):
    phone = None
    if body.phone:
        try:
            phone = normalize_syrian_phone(body.phone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    code = (body.family_code or "").strip().upper() or None
    if not phone and not code:
        raise HTTPException(status_code=400, detail="أدخل رقم الموبايل أو رمز العائلة")
    user = authenticate_parent(db, body.pin.strip(), phone=phone, family_code=code)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="رقم أو رمز غير صحيح")
    profile = db.query(Profile).filter(Profile.id == user.id).first()
    if not profile or profile.role != AppRole.parent:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="حساب الأهل غير موجود")
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "phone": user.phone, "family_code": user.family_code},
        profile=profile_to_dict(profile),
    )


@router.get("/me")
def me(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not user or not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
    return {
        "user": {"id": str(user.id), "email": user.email, "phone": user.phone, "family_code": user.family_code},
        "profile": profile_to_dict(profile),
    }


@router.post("/logout")
def logout():
    return {"ok": True}
