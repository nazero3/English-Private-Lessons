from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..auth import hash_password, profile_to_dict
from ..database import get_db
from ..deps import get_current_profile, require_staff
from ..models import (
    AppRole,
    Course,
    Lesson,
    LessonSession,
    Profile,
    Student,
    StudentScore,
    User,
)
from ..schemas import StudentCreate, StudentScoreCreate, StudentScoreUpdate, StudentUpdate

router = APIRouter(tags=["students"])


def _pct(score, total) -> float | None:
    if score is None or total in (None, 0):
        return None
    return round((float(score) / float(total)) * 100, 1)


def _avg(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 1)


def _safe_homework(items: list | None) -> list[dict]:
    out = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        row = {
            "id": item.get("id"),
            "type": item.get("type"),
            "prompt": item.get("prompt") or "",
        }
        if item.get("type") == "mcq":
            row["options"] = item.get("options") or []
        out.append(row)
    return out


def _score_dict(row: StudentScore) -> dict:
    return {
        "id": str(row.id),
        "student_id": str(row.student_id),
        "teacher_id": str(row.teacher_id),
        "title": row.title,
        "score": float(row.score) if row.score is not None else None,
        "total": float(row.total) if row.total is not None else None,
        "percent": _pct(row.score, row.total),
        "notes": row.notes or "",
        "test_date": row.test_date.isoformat() if row.test_date else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _session_for_student(session: LessonSession, db: Session, *, include_answers: bool) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first() if session.lesson_id else None
    course = db.query(Course).filter(Course.id == lesson.course_id).first() if lesson else None
    homework_items = lesson.homework if lesson else []
    catalog_course = (
        {"id": None, "title": session.course_title, "grade": ""}
        if not course and (session.course_title or "")
        else None
    )
    catalog_lesson = (
        {
            "id": None,
            "course_id": None,
            "unit_number": session.unit_number,
            "theme": session.unit_label or "Lesson",
            "grammar": "",
            "course": catalog_course,
        }
        if not lesson and (session.unit_label or session.unit_number is not None)
        else None
    )
    return {
        "id": str(session.id),
        "teacher_id": str(session.teacher_id),
        "lesson_id": str(session.lesson_id) if session.lesson_id else None,
        "student_id": str(session.student_id) if session.student_id else None,
        "student_name": session.student_name,
        "worksheet_score": float(session.worksheet_score) if session.worksheet_score is not None else None,
        "worksheet_total": float(session.worksheet_total) if session.worksheet_total is not None else None,
        "quiz_score": float(session.quiz_score) if session.quiz_score is not None else None,
        "quiz_total": float(session.quiz_total) if session.quiz_total is not None else None,
        "homework_score": float(session.homework_score) if session.homework_score is not None else None,
        "homework_total": float(session.homework_total) if session.homework_total is not None else None,
        "notes": session.notes or "",
        "homework_assigned": session.homework_assigned or "",
        "session_date": session.session_date.isoformat() if session.session_date else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "homework": homework_items if include_answers else _safe_homework(homework_items),
        "lesson": {
            "id": str(lesson.id),
            "course_id": str(lesson.course_id),
            "unit_number": lesson.unit_number,
            "theme": lesson.theme,
            "grammar": lesson.grammar,
            "course": {
                "id": str(course.id),
                "title": course.title,
                "grade": course.grade,
            }
            if course
            else None,
        }
        if lesson
        else catalog_lesson,
        "course": {
            "id": str(course.id),
            "title": course.title,
            "grade": course.grade,
        }
        if course
        else catalog_course,
    }


def _score_summary(sessions: list[dict], tests: list[dict]) -> dict:
    worksheet = [_pct(s.get("worksheet_score"), s.get("worksheet_total")) for s in sessions]
    quiz = [_pct(s.get("quiz_score"), s.get("quiz_total")) for s in sessions]
    homework = [_pct(s.get("homework_score"), s.get("homework_total")) for s in sessions]
    test_pcts = [t.get("percent") for t in tests]
    parts = [v for v in (*worksheet, *quiz, *homework, *test_pcts) if v is not None]
    return {
        "tests_count": len(tests),
        "lessons_count": len(sessions),
        "worksheet_avg": _avg([v for v in worksheet if v is not None]),
        "quiz_avg": _avg([v for v in quiz if v is not None]),
        "homework_avg": _avg([v for v in homework if v is not None]),
        "tests_avg": _avg([v for v in test_pcts if v is not None]),
        "overall_avg": _avg(parts),
    }


def _student_dict(row: Student, db: Session) -> dict:
    login = db.query(User).filter(User.id == row.user_id).first() if row.user_id else None
    teacher = (
        db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == row.teacher_id).first()
        if row.teacher_id
        else None
    )
    return {
        "id": str(row.id),
        "teacher_id": str(row.teacher_id) if row.teacher_id else None,
        "user_id": str(row.user_id) if row.user_id else None,
        "full_name": row.full_name,
        "email": login.email if login else None,
        "has_login": bool(login),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher and teacher.user else None)
        if teacher
        else None,
    }


def _portal_payload(student: Student, db: Session, *, include_answers: bool) -> dict:
    sessions = (
        db.query(LessonSession)
        .filter(LessonSession.student_id == student.id)
        .order_by(LessonSession.session_date.desc())
        .all()
    )
    if not sessions and student.teacher_id:
        sessions = (
            db.query(LessonSession)
            .filter(
                LessonSession.teacher_id == student.teacher_id,
                LessonSession.student_name.ilike(student.full_name),
            )
            .order_by(LessonSession.session_date.desc())
            .all()
        )
    tests = (
        db.query(StudentScore)
        .filter(StudentScore.student_id == student.id)
        .order_by(StudentScore.test_date.desc())
        .all()
    )
    session_rows = [_session_for_student(s, db, include_answers=include_answers) for s in sessions]
    test_rows = [_score_dict(t) for t in tests]
    return {
        "student": _student_dict(student, db),
        "sessions": session_rows,
        "scores": test_rows,
        "summary": _score_summary(session_rows, test_rows),
    }


def _staff_can_manage(profile: Profile, student: Student) -> bool:
    if profile.role == AppRole.manager:
        return True
    return profile.role == AppRole.teacher and student.teacher_id == profile.id


def _get_managed_student(db: Session, profile: Profile, student_id: UUID) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if not _staff_can_manage(profile, student):
        raise HTTPException(status_code=403, detail="Not your student")
    return student


def _create_login(db: Session, email: str, password: str, full_name: str) -> UUID:
    email = email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = uuid4()
    db.add(User(id=user_id, email=email, password_hash=hash_password(password)))
    db.add(Profile(id=user_id, full_name=full_name, role=AppRole.student))
    db.flush()
    return user_id


@router.get("/students")
def list_students(profile: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    q = db.query(Student)
    if profile.role != AppRole.manager:
        q = q.filter(Student.teacher_id == profile.id)
    rows = q.all()
    rows.sort(key=lambda s: (s.teacher_id is not None, (s.full_name or "").lower()))
    out = []
    for row in rows:
        try:
            out.append(_student_dict(row, db))
        except Exception:
            out.append(
                {
                    "id": str(row.id),
                    "teacher_id": str(row.teacher_id) if row.teacher_id else None,
                    "user_id": str(row.user_id) if row.user_id else None,
                    "full_name": row.full_name,
                    "email": None,
                    "has_login": False,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "teacher": None,
                }
            )
    return out


@router.post("/students", status_code=201)
def create_student(body: StudentCreate, profile: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    name = body.full_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Student name is required")

    teacher_id = profile.id
    if profile.role == AppRole.manager:
        if body.teacher_id:
            teacher = db.query(Profile).filter(Profile.id == body.teacher_id, Profile.role == AppRole.teacher).first()
            if not teacher:
                raise HTTPException(status_code=404, detail="Teacher not found")
            teacher_id = teacher.id
        else:
            teacher_id = None
    elif body.teacher_id and body.teacher_id != profile.id:
        raise HTTPException(status_code=403, detail="Teachers can only create their own students")

    existing = (
        db.query(Student)
        .filter(Student.teacher_id == teacher_id, Student.full_name.ilike(name))
        .first()
    )
    email = body.email.lower().strip() if body.email else None
    wants_login = bool(email and body.password)

    if existing:
        if wants_login and not existing.user_id:
            existing.user_id = _create_login(db, email, body.password, existing.full_name)
            db.commit()
            db.refresh(existing)
        return _student_dict(existing, db)

    user_id = _create_login(db, email, body.password, name) if wants_login else None
    row = Student(teacher_id=teacher_id, user_id=user_id, full_name=name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _student_dict(row, db)


@router.get("/me/student")
def my_student_portal(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role != AppRole.student:
        raise HTTPException(status_code=403, detail="Student access required")
    student = db.query(Student).filter(Student.user_id == profile.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _portal_payload(student, db, include_answers=False)


@router.get("/students/{student_id}")
def get_student(student_id: UUID, profile: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    student = _get_managed_student(db, profile, student_id)
    return _portal_payload(student, db, include_answers=True)


@router.patch("/students/{student_id}")
def update_student(
    student_id: UUID,
    body: StudentUpdate,
    profile: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    student = _get_managed_student(db, profile, student_id)
    data = body.model_dump(exclude_unset=True)
    if body.full_name is not None:
        name = body.full_name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Student name is required")
        clash = (
            db.query(Student)
            .filter(
                Student.teacher_id == student.teacher_id,
                Student.full_name.ilike(name),
                Student.id != student.id,
            )
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="A student with that name already exists")
        student.full_name = name
        if student.user_id:
            login_profile = db.query(Profile).filter(Profile.id == student.user_id).first()
            if login_profile:
                login_profile.full_name = name

    if "teacher_id" in data:
        if profile.role != AppRole.manager:
            raise HTTPException(status_code=403, detail="Only a manager can reassign a student")
        tid = data["teacher_id"]
        if tid is None:
            student.teacher_id = None
        else:
            teacher = db.query(Profile).filter(Profile.id == tid, Profile.role == AppRole.teacher).first()
            if not teacher:
                raise HTTPException(status_code=404, detail="Teacher not found")
            clash = (
                db.query(Student)
                .filter(
                    Student.teacher_id == teacher.id,
                    Student.full_name.ilike(student.full_name),
                    Student.id != student.id,
                )
                .first()
            )
            if clash:
                raise HTTPException(status_code=400, detail="That teacher already has a student with this name")
            student.teacher_id = teacher.id

    email = body.email.lower().strip() if body.email else None
    if email or body.password:
        if student.user_id:
            user = db.query(User).filter(User.id == student.user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Student login not found")
            if email:
                taken = db.query(User).filter(User.email == email, User.id != user.id).first()
                if taken:
                    raise HTTPException(status_code=400, detail="Email already exists")
                user.email = email
            if body.password:
                user.password_hash = hash_password(body.password)
        else:
            if not email or not body.password:
                raise HTTPException(status_code=400, detail="Email and password are required to create a login")
            student.user_id = _create_login(db, email, body.password, student.full_name)

    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not update this student. If you chose No teacher, restart the API and try again.",
        ) from None
    return _student_dict(student, db)


def _quote_ident(name: str) -> str:
    return '"' + str(name).replace('"', '""') + '"'


def _sql(db: Session, sql: str, params: dict | None = None) -> None:
    nested = db.begin_nested()
    try:
        db.execute(text(sql), params or {})
        nested.commit()
    except Exception:
        nested.rollback()


def _db_error_detail(exc: Exception) -> str:
    orig = getattr(exc, "orig", None) or exc
    msg = str(orig).split("\n", 1)[0]
    lowered = msg.lower()
    if "lock timeout" in lowered or "statement timeout" in lowered:
        return "Could not delete this student because the database was busy. Try again."
    return f"Could not delete this student: {msg}"


def _student_fk_rows(db: Session):
    return db.execute(
        text(
            """
            SELECT rel.relname AS table_name, att.attname AS column_name, att.attnotnull AS not_null
            FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = rel.relnamespace
            JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS cols(attnum, ord) ON true
            JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = cols.attnum
            WHERE c.contype = 'f'
              AND c.confrelid = 'students'::regclass
              AND n.nspname = 'public'
            """
        )
    ).all()


def _profile_fk_rows(db: Session):
    return db.execute(
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
    ).all()


def _detach_student_row(db: Session, student_id: UUID) -> None:
    params = {"sid": student_id}
    keep_hours = {"lesson_sessions", "credit_ledger"}
    for sql in (
        "DELETE FROM student_scores WHERE student_id = :sid",
        "DELETE FROM parent_students WHERE student_id = :sid",
        "DELETE FROM public_spotlights WHERE student_id = :sid",
        "UPDATE lesson_sessions SET student_id = NULL WHERE student_id = :sid",
        "UPDATE credit_ledger SET student_id = NULL WHERE student_id = :sid",
        "UPDATE students SET user_id = NULL WHERE id = :sid",
    ):
        _sql(db, sql, params)
    for table, column, not_null in _student_fk_rows(db):
        if table == "students":
            continue
        tbl = _quote_ident(table)
        col = _quote_ident(column)
        if table in keep_hours or not not_null:
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :sid", params)
        else:
            _sql(db, f"DELETE FROM {tbl} WHERE {col} = :sid", params)
    db.execute(text("DELETE FROM students WHERE id = :sid"), params)


def _delete_student_login(db: Session, user_id: UUID) -> None:
    role = db.execute(text("SELECT role FROM profiles WHERE id = :uid"), {"uid": user_id}).scalar()
    if str(getattr(role, "value", role)) != AppRole.student.value:
        return
    params = {"uid": user_id}
    _sql(db, "DELETE FROM notifications WHERE user_id = :uid", params)
    keep = {"lesson_sessions", "student_scores", "credit_ledger", "students"}
    for table, column, not_null in _profile_fk_rows(db):
        if table == "students" and column == "teacher_id":
            continue
        tbl = _quote_ident(table)
        col = _quote_ident(column)
        if table == "students" and column == "user_id":
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :uid", params)
        elif not not_null:
            _sql(db, f"UPDATE {tbl} SET {col} = NULL WHERE {col} = :uid", params)
        elif table not in keep:
            _sql(db, f"DELETE FROM {tbl} WHERE {col} = :uid", params)
    db.execute(text("DELETE FROM users WHERE id = :uid"), params)


@router.delete("/students/{student_id}")
def delete_student(student_id: UUID, profile: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    student = _get_managed_student(db, profile, student_id)
    user_id = student.user_id
    if db.in_transaction():
        db.rollback()
    try:
        with db.begin():
            db.connection().exec_driver_sql("SET LOCAL lock_timeout = '4s'")
            db.connection().exec_driver_sql("SET LOCAL statement_timeout = '12s'")
            _detach_student_row(db, student_id)
            if user_id:
                _delete_student_login(db, user_id)
    except Exception as exc:
        raise HTTPException(status_code=409, detail=_db_error_detail(exc)) from None
    return {"id": str(student_id)}


@router.post("/students/{student_id}/scores", status_code=201)
def add_score(
    student_id: UUID,
    body: StudentScoreCreate,
    profile: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    student = _get_managed_student(db, profile, student_id)
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Test title is required")
    row = StudentScore(
        student_id=student.id,
        teacher_id=student.teacher_id or profile.id,
        title=title,
        score=body.score,
        total=body.total,
        notes=body.notes or "",
        test_date=body.test_date or datetime.now(UTC),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _score_dict(row)


@router.patch("/students/{student_id}/scores/{score_id}")
def update_score(
    student_id: UUID,
    score_id: UUID,
    body: StudentScoreUpdate,
    profile: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    student = _get_managed_student(db, profile, student_id)
    row = db.query(StudentScore).filter(StudentScore.id == score_id, StudentScore.student_id == student.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Score not found")
    data = body.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        title = data["title"].strip()
        if not title:
            raise HTTPException(status_code=400, detail="Test title is required")
        row.title = title
    for field in ("score", "total", "test_date"):
        if field in data:
            setattr(row, field, data[field])
    if "notes" in data and data["notes"] is not None:
        row.notes = data["notes"]
    db.commit()
    db.refresh(row)
    return _score_dict(row)


@router.delete("/students/{student_id}/scores/{score_id}")
def delete_score(
    student_id: UUID,
    score_id: UUID,
    profile: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    student = _get_managed_student(db, profile, student_id)
    row = db.query(StudentScore).filter(StudentScore.id == score_id, StudentScore.student_id == student.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Score not found")
    db.delete(row)
    db.commit()
    return {"id": str(score_id)}
