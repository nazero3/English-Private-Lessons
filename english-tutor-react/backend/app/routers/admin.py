from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..auth import hash_password, profile_to_dict
from ..database import get_db
from ..deps import get_current_profile, require_manager
from ..models import AppRole, Profile, TeacherCourseAssignment, User
from ..schemas import CreateTeacherRequest, FlagRequest, ProfileOut, SetAssignmentRequest, UpdateTeacherRequest

router = APIRouter(tags=["admin"])


@router.get("/profiles", response_model=list[ProfileOut])
def list_profiles(_: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    rows = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role.in_((AppRole.manager, AppRole.teacher)))
        .order_by(Profile.full_name)
        .all()
    )
    return [profile_to_dict(p, p.user.email if p.user else None) for p in rows]


@router.patch("/profiles/{profile_id}/role")
def update_profile_role(
    profile_id: UUID,
    body: dict,
    _: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    role = body.get("role")
    if role not in ("manager", "teacher"):
        raise HTTPException(status_code=400, detail="Invalid role")
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.role = AppRole(role)
    db.commit()
    db.refresh(profile)
    user = db.query(User).filter(User.id == profile.id).first()
    return profile_to_dict(profile, user.email if user else None)


@router.post("/teachers", status_code=201)
def create_teacher(body: CreateTeacherRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = uuid4()
    user = User(id=user_id, email=email, password_hash=hash_password(body.password))
    profile = Profile(
        id=user_id,
        full_name=body.full_name.strip(),
        role=AppRole.teacher,
        can_access_private_lessons=False,
        can_access_math_grade9=False,
        can_access_math_grade12=False,
        can_access_physics_grade12=False,
    )
    db.add(user)
    db.add(profile)
    db.commit()
    return profile_to_dict(profile, email)


@router.patch("/teachers/{teacher_id}")
def update_teacher(
    teacher_id: UUID,
    body: UpdateTeacherRequest,
    _: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == teacher_id, Profile.role == AppRole.teacher).first()
    user = db.query(User).filter(User.id == teacher_id).first()
    if not profile or not user:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if body.full_name is not None:
        profile.full_name = body.full_name.strip()
    if body.email is not None:
        email = body.email.lower().strip()
        taken = db.query(User).filter(User.email == email, User.id != teacher_id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = email
    if body.password:
        user.password_hash = hash_password(body.password)

    db.commit()
    db.refresh(profile)
    db.refresh(user)
    return profile_to_dict(profile, user.email)


@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: UUID, manager: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    if teacher_id == manager.id:
        raise HTTPException(status_code=400, detail="You cannot delete the account you are signed in with")
    profile = db.query(Profile).filter(Profile.id == teacher_id, Profile.role == AppRole.teacher).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher not found")
    user = db.query(User).filter(User.id == teacher_id).first()
    if user:
        db.delete(user)
    db.commit()
    return {"id": str(teacher_id)}


@router.get("/assignments")
def list_assignments(_: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    rows = (
        db.query(TeacherCourseAssignment)
        .options(
            joinedload(TeacherCourseAssignment.teacher).joinedload(Profile.user),
            joinedload(TeacherCourseAssignment.course),
        )
        .all()
    )
    from ..models import Course

    out = []
    for row in rows:
        teacher = row.teacher
        course = row.course
        out.append(
            {
                "id": str(row.id),
                "teacher_id": str(row.teacher_id),
                "course_id": str(row.course_id),
                "teacher": profile_to_dict(teacher, teacher.user.email if teacher and teacher.user else None)
                if teacher
                else None,
                "course": {
                    "id": str(course.id),
                    "code": course.code,
                    "title": course.title,
                    "grade": course.grade,
                }
                if course
                else None,
            }
        )
    return out


@router.put("/assignments")
def set_assignment(body: SetAssignmentRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    existing = (
        db.query(TeacherCourseAssignment)
        .filter(
            TeacherCourseAssignment.teacher_id == body.teacher_id,
            TeacherCourseAssignment.course_id == body.course_id,
        )
        .first()
    )
    if body.assigned and not existing:
        db.add(
            TeacherCourseAssignment(
                teacher_id=body.teacher_id,
                course_id=body.course_id,
            )
        )
    elif not body.assigned and existing:
        db.delete(existing)
    db.commit()
    return {"ok": True}


@router.patch("/teachers/{teacher_id}/private-lessons")
def set_private_lessons(teacher_id: UUID, body: FlagRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    profile = _teacher_or_404(db, teacher_id)
    profile.can_access_private_lessons = body.enabled
    db.commit()
    user = db.query(User).filter(User.id == teacher_id).first()
    return profile_to_dict(profile, user.email if user else None)


@router.patch("/teachers/{teacher_id}/math-grade9")
def set_math_grade9(teacher_id: UUID, body: FlagRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    profile = _teacher_or_404(db, teacher_id)
    profile.can_access_math_grade9 = body.enabled
    db.commit()
    user = db.query(User).filter(User.id == teacher_id).first()
    return profile_to_dict(profile, user.email if user else None)


@router.patch("/teachers/{teacher_id}/math-grade12")
def set_math_grade12(teacher_id: UUID, body: FlagRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    profile = _teacher_or_404(db, teacher_id)
    profile.can_access_math_grade12 = body.enabled
    db.commit()
    user = db.query(User).filter(User.id == teacher_id).first()
    return profile_to_dict(profile, user.email if user else None)


@router.patch("/teachers/{teacher_id}/physics-grade12")
def set_physics_grade12(teacher_id: UUID, body: FlagRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    profile = _teacher_or_404(db, teacher_id)
    profile.can_access_physics_grade12 = body.enabled
    db.commit()
    user = db.query(User).filter(User.id == teacher_id).first()
    return profile_to_dict(profile, user.email if user else None)


def _teacher_or_404(db: Session, teacher_id: UUID) -> Profile:
    profile = db.query(Profile).filter(Profile.id == teacher_id, Profile.role == AppRole.teacher).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return profile
