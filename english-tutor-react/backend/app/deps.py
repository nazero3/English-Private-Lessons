from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from .auth import decode_token
from .database import get_db
from .models import AppRole, Profile, TeacherCourseAssignment

security = HTTPBearer(auto_error=False)


def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> UUID:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
    user_id = decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user_id


def get_current_profile(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Profile:
    profile = db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Profile not found")
    return profile


def require_manager(profile: Profile = Depends(get_current_profile)) -> Profile:
    if profile.role != AppRole.manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager access required")
    return profile


def require_staff(profile: Profile = Depends(get_current_profile)) -> Profile:
    if profile.role not in (AppRole.manager, AppRole.teacher):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher or manager access required")
    return profile


def require_parent(profile: Profile = Depends(get_current_profile)) -> Profile:
    if profile.role != AppRole.parent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access required")
    return profile


def teacher_has_course(db: Session, teacher_id: UUID, course_id: UUID) -> bool:
    return (
        db.query(TeacherCourseAssignment)
        .filter(
            TeacherCourseAssignment.teacher_id == teacher_id,
            TeacherCourseAssignment.course_id == course_id,
        )
        .first()
        is not None
    )


def require_lesson_access(
    course_id: UUID,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Profile:
    if profile.role == AppRole.manager:
        return profile
    if not teacher_has_course(db, profile.id, course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course not assigned")
    return profile
