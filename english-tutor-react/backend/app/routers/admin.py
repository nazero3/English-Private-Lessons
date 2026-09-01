from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..auth import hash_password, profile_to_dict
from ..database import engine, get_db
from ..deps import get_current_profile, require_manager
from ..models import (
    AppRole,
    Notification,
    Profile,
    TeacherCourseAssignment,
    User,
)
from ..schemas import (
    CreateOperationsRequest,
    CreateTeacherRequest,
    FlagRequest,
    ProfileOut,
    SetAssignmentRequest,
    UpdateOperationsRequest,
    UpdateTeacherRequest,
)

router = APIRouter(tags=["admin"])


@router.get("/profiles", response_model=list[ProfileOut])
def list_profiles(_: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    rows = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role.in_((AppRole.manager, AppRole.teacher, AppRole.operations)))
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
    if role not in ("manager", "teacher", "operations"):
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


def _quote_ident(name: str) -> str:
    return '"' + str(name).replace('"', '""') + '"'


def _prepare_teacher_delete_schema() -> None:
    """Run outside the request transaction so a failed ALTER cannot abort the delete."""
    statements = (
        "ALTER TABLE students ALTER COLUMN teacher_id DROP NOT NULL",
        "ALTER TABLE lesson_sessions ALTER COLUMN manager_id DROP NOT NULL",
        "ALTER TABLE students ALTER COLUMN user_id DROP NOT NULL",
    )
    with engine.begin() as conn:
        for sql in statements:
            try:
                conn.exec_driver_sql(sql)
            except Exception:
                pass


def _sql(db: Session, sql: str, params: dict | None = None) -> None:
    nested = db.begin_nested()
    try:
        db.execute(text(sql), params or {})
        nested.commit()
    except Exception:
        nested.rollback()


def _clear_profile_refs(db: Session, profile_id: UUID, reassign_id: UUID) -> list[str]:
    names = [
        row[0]
        for row in db.execute(
            text("SELECT full_name FROM students WHERE teacher_id = :tid"),
            {"tid": profile_id},
        )
    ]
    params = {"tid": profile_id, "mid": reassign_id}
    for sql in (
        "UPDATE students SET teacher_id = NULL WHERE teacher_id = :tid",
        "UPDATE lesson_sessions SET manager_id = NULL WHERE manager_id = :tid",
        "UPDATE lesson_sessions SET teacher_id = :mid WHERE teacher_id = :tid",
        "UPDATE student_scores SET teacher_id = :mid WHERE teacher_id = :tid",
        "DELETE FROM teacher_course_assignments WHERE teacher_id = :tid",
        "DELETE FROM notifications WHERE user_id = :tid",
        "UPDATE credit_ledger SET created_by = NULL WHERE created_by = :tid",
        "UPDATE payment_intents SET confirmed_by = NULL WHERE confirmed_by = :tid",
        "UPDATE prize_redemptions SET fulfilled_by = NULL WHERE fulfilled_by = :tid",
        "DELETE FROM parent_students WHERE parent_id = :tid",
    ):
        _sql(db, sql, params)
    fks = db.execute(
        text(
            """
            SELECT rel.relname AS table_name, att.attname AS column_name, att.attnotnull AS not_null
            FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = rel.relnamespace
            JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS cols(attnum, ord) ON true
            JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = cols.attnum
            WHERE c.contype = 'f'
              AND c.confrelid = 'profiles'::regclass
              AND n.nspname = 'public'
              AND rel.relname <> 'profiles'
            """
        )
    )
    reassign = {("lesson_sessions", "teacher_id"), ("student_scores", "teacher_id")}
    prefer_null = {
        ("students", "teacher_id"),
        ("students", "user_id"),
        ("lesson_sessions", "manager_id"),
        ("credit_ledger", "created_by"),
        ("payment_intents", "confirmed_by"),
        ("prize_redemptions", "fulfilled_by"),
        ("public_spotlights", "parent_id"),
    }
    may_delete = {
        "notifications",
        "teacher_course_assignments",
        "parent_students",
        "prize_redemptions",
        "public_spotlights",
    }
    for table, column, not_null in fks:
        tbl = _quote_ident(table)
        col = _quote_ident(column)
        key = (table, column)
        if key in reassign:
            _sql(db, f"UPDATE {tbl} SET {col} = :mid WHERE {col} = :tid", params)
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :tid", params)
        elif key in prefer_null or not not_null:
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :tid", params)
            _sql(db, f"UPDATE {tbl} SET {col} = :mid WHERE {col} = :tid", params)
        elif table in may_delete:
            _sql(db, f"DELETE FROM {tbl} WHERE {col} = :tid", params)
        else:
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :tid", params)
            _sql(db, f"UPDATE {tbl} SET {col} = :mid WHERE {col} = :tid", params)
            if table in may_delete:
                _sql(db, f"DELETE FROM {tbl} WHERE {col} = :tid", params)
    return names


def _detach_teacher(db: Session, teacher: Profile, manager: Profile) -> list[str]:
    """Unassign students; keep class history under the manager so hours are not lost."""
    _prepare_teacher_delete_schema()
    names = _clear_profile_refs(db, teacher.id, manager.id)
    if names:
        shown = ", ".join(names[:12])
        extra = f" and {len(names) - 12} more" if len(names) > 12 else ""
        db.add(
            Notification(
                user_id=manager.id,
                session_id=None,
                type="unassigned_students",
                title="Students need a teacher",
                message=(
                    f"{teacher.full_name} was removed. Assign a teacher to "
                    f"{len(names)} student{'s' if len(names) != 1 else ''}: {shown}{extra}."
                ),
            )
        )
        db.flush()
    return names


@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: UUID, manager: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    if teacher_id == manager.id:
        raise HTTPException(status_code=400, detail="You cannot delete the account you are signed in with")
    profile = db.query(Profile).filter(Profile.id == teacher_id, Profile.role == AppRole.teacher).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher not found")
    try:
        unassigned = _detach_teacher(db, profile, manager)
        db.flush()
        db.expunge_all()
        db.execute(text("DELETE FROM users WHERE id = :tid"), {"tid": teacher_id})
        db.commit()
    except Exception as exc:
        db.rollback()
        orig = getattr(exc, "orig", None) or exc
        raise HTTPException(
            status_code=409,
            detail=f"Could not delete this teacher: {orig}",
        ) from None
    return {
        "id": str(teacher_id),
        "unassigned_count": len(unassigned),
        "unassigned_names": unassigned,
    }


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


def _ops_or_404(db: Session, ops_id: UUID) -> tuple[Profile, User]:
    profile = db.query(Profile).filter(Profile.id == ops_id, Profile.role == AppRole.operations).first()
    user = db.query(User).filter(User.id == ops_id).first()
    if not profile or not user:
        raise HTTPException(status_code=404, detail="Operations account not found")
    return profile, user


@router.post("/operations", status_code=201)
def create_operations(
    body: CreateOperationsRequest, _: Profile = Depends(require_manager), db: Session = Depends(get_db)
):
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = uuid4()
    user = User(id=user_id, email=email, password_hash=hash_password(body.password))
    profile = Profile(
        id=user_id,
        full_name=body.full_name.strip(),
        role=AppRole.operations,
        can_access_private_lessons=False,
        can_access_math_grade9=False,
        can_access_math_grade12=False,
        can_access_physics_grade12=False,
    )
    db.add(user)
    db.add(profile)
    db.commit()
    return profile_to_dict(profile, email)


@router.patch("/operations/{ops_id}")
def update_operations(
    ops_id: UUID,
    body: UpdateOperationsRequest,
    _: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    profile, user = _ops_or_404(db, ops_id)

    if body.full_name is not None:
        profile.full_name = body.full_name.strip()
    if body.email is not None:
        email = body.email.lower().strip()
        taken = db.query(User).filter(User.email == email, User.id != ops_id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = email
    if body.password:
        user.password_hash = hash_password(body.password)

    db.commit()
    db.refresh(profile)
    db.refresh(user)
    return profile_to_dict(profile, user.email)


@router.delete("/operations/{ops_id}")
def delete_operations(ops_id: UUID, manager: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    if ops_id == manager.id:
        raise HTTPException(status_code=400, detail="You cannot delete the account you are signed in with")
    profile, user = _ops_or_404(db, ops_id)
    try:
        db.query(Notification).filter(Notification.user_id == ops_id).delete(synchronize_session=False)
        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This operations account could not be deleted because other records still point at it.",
        ) from None
    return {"id": str(ops_id)}
