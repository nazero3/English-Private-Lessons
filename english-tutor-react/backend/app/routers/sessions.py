from calendar import monthrange
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import can_see_all_sessions, get_current_profile, require_manager, require_ops_or_manager, teacher_has_course
from ..family import on_session_saved
from ..models import AppRole, Course, Lesson, LessonSession, Notification, Profile, Student
from ..schemas import SessionCreate, SessionFeedback, SessionUpdate

router = APIRouter(tags=["sessions"])

CURRICULUM_FLAGS = {
    "english_file": "can_access_private_lessons",
    "math_grade9": "can_access_math_grade9",
    "math_grade12": "can_access_math_grade12",
    "physics_grade12": "can_access_physics_grade12",
}


def _can_log_curriculum(profile: Profile, curriculum: str | None) -> bool:
    if profile.role == AppRole.manager:
        return True
    flag = CURRICULUM_FLAGS.get(curriculum or "")
    if not flag:
        return False
    return bool(getattr(profile, flag, False))


def _catalog_course(session: LessonSession) -> dict | None:
    title = (session.course_title or "").strip()
    if not title:
        return None
    return {"id": None, "title": title, "grade": ""}


def _catalog_lesson(session: LessonSession) -> dict | None:
    theme = (session.unit_label or "").strip()
    if not theme and session.unit_number is None:
        return None
    return {
        "id": None,
        "course_id": None,
        "unit_number": session.unit_number,
        "theme": theme or "Lesson",
        "grammar": "",
        "course": _catalog_course(session),
    }


def _feedback_preview(text: str, limit: int = 160) -> str:
    compact = " ".join((text or "").split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1].rstrip() + "…"


def _session_dict(session: LessonSession, db: Session) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first() if session.lesson_id else None
    course = db.query(Course).filter(Course.id == lesson.course_id).first() if lesson else None
    teacher = db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == session.teacher_id).first()
    manager = (
        db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == session.manager_id).first()
        if session.manager_id
        else None
    )
    from ..auth import profile_to_dict

    course_payload = (
        {
            "id": str(course.id),
            "title": course.title,
            "grade": course.grade,
        }
        if course
        else _catalog_course(session)
    )
    lesson_payload = (
        {
            "id": str(lesson.id),
            "course_id": str(lesson.course_id),
            "unit_number": lesson.unit_number,
            "theme": lesson.theme,
            "grammar": lesson.grammar,
            "course": course_payload,
        }
        if lesson
        else _catalog_lesson(session)
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
        "notes": session.notes,
        "homework_assigned": session.homework_assigned or "",
        "hours": float(session.hours) if session.hours is not None else None,
        "session_date": session.session_date.isoformat() if session.session_date else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "manager_feedback": session.manager_feedback,
        "manager_feedback_at": session.manager_feedback_at.isoformat() if session.manager_feedback_at else None,
        "manager_id": str(session.manager_id) if session.manager_id else None,
        "course_title": session.course_title or "",
        "unit_label": session.unit_label or "",
        "lesson": lesson_payload,
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher and teacher.user else None)
        if teacher
        else None,
        "manager": profile_to_dict(manager, manager.user.email if manager and manager.user else None)
        if manager
        else None,
        "course": course_payload,
    }


def _resolve_student(db: Session, profile: Profile, student_id: UUID | None, student_name: str) -> tuple[Student | None, str]:
    name = (student_name or "").strip() or "Student"
    student = None
    if student_id:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        if profile.role != AppRole.manager and student.teacher_id != profile.id:
            raise HTTPException(status_code=403, detail="Not your student")
        name = student.full_name
        return student, name

    teacher_id = profile.id if profile.role != AppRole.manager else None
    q = db.query(Student).filter(Student.full_name.ilike(name))
    if teacher_id:
        q = q.filter(Student.teacher_id == teacher_id)
    student = q.first()
    if not student and profile.role != AppRole.manager:
        student = Student(teacher_id=profile.id, full_name=name)
        db.add(student)
        db.flush()
    return student, name


@router.get("/sessions")
def list_sessions(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role in (AppRole.student, AppRole.parent):
        raise HTTPException(status_code=403, detail="Use the student portal")
    if profile.role not in (AppRole.manager, AppRole.teacher, AppRole.operations):
        raise HTTPException(status_code=403, detail="Not allowed")
    q = db.query(LessonSession).order_by(LessonSession.session_date.desc())
    if not can_see_all_sessions(profile):
        q = q.filter(LessonSession.teacher_id == profile.id)
    return [_session_dict(s, db) for s in q.all()]


@router.get("/hours/summary")
def hours_summary(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    _: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    today = datetime.now(UTC).date()
    start = from_date or today.replace(day=1)
    if to_date:
        end = to_date
    else:
        end = date(start.year, start.month, monthrange(start.year, start.month)[1])

    start_dt = datetime(start.year, start.month, start.day, tzinfo=UTC)
    end_exclusive = datetime(end.year, end.month, end.day, tzinfo=UTC) + timedelta(days=1)

    teachers = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role == AppRole.teacher)
        .order_by(Profile.full_name)
        .all()
    )
    totals = (
        db.query(
            LessonSession.teacher_id,
            func.count(LessonSession.id).label("session_count"),
            func.coalesce(func.sum(LessonSession.hours), 0).label("total_hours"),
        )
        .filter(
            LessonSession.hours.isnot(None),
            LessonSession.session_date >= start_dt,
            LessonSession.session_date < end_exclusive,
        )
        .group_by(LessonSession.teacher_id)
        .all()
    )
    by_teacher = {row.teacher_id: row for row in totals}

    from ..auth import profile_to_dict

    rows = []
    for teacher in teachers:
        stats = by_teacher.get(teacher.id)
        rows.append(
            {
                "teacher_id": str(teacher.id),
                "teacher": profile_to_dict(teacher, teacher.user.email if teacher.user else None),
                "session_count": int(stats.session_count) if stats else 0,
                "total_hours": float(stats.total_hours) if stats else 0.0,
            }
        )
    return {
        "from": start.isoformat(),
        "to": end.isoformat(),
        "teachers": rows,
        "total_hours": sum(r["total_hours"] for r in rows),
        "session_count": sum(r["session_count"] for r in rows),
    }


@router.post("/sessions", status_code=201)
def create_session(body: SessionCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role not in (AppRole.manager, AppRole.teacher):
        raise HTTPException(status_code=403, detail="Students cannot create sessions")

    lesson = None
    course_title = (body.course_title or "").strip()
    unit_label = (body.unit_label or "").strip()
    unit_number = body.unit_number
    if body.lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == body.lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if profile.role != AppRole.manager and not teacher_has_course(db, profile.id, lesson.course_id):
            raise HTTPException(status_code=403, detail="Course not assigned")
        if not course_title:
            course = db.query(Course).filter(Course.id == lesson.course_id).first()
            course_title = course.title if course else ""
        if not unit_label:
            unit_label = lesson.theme
        if unit_number is None:
            unit_number = lesson.unit_number
    elif course_title:
        if body.curriculum:
            if body.curriculum not in CURRICULUM_FLAGS:
                raise HTTPException(status_code=400, detail="Unknown course")
            if not _can_log_curriculum(profile, body.curriculum):
                raise HTTPException(status_code=403, detail="This course is not enabled for you")
        elif profile.role != AppRole.manager:
            raise HTTPException(status_code=400, detail="Choose a course")
    else:
        raise HTTPException(status_code=400, detail="Choose a course")

    student, student_name = _resolve_student(db, profile, body.student_id, body.student_name)
    teacher_id = student.teacher_id if student and student.teacher_id else profile.id

    session = LessonSession(
        teacher_id=teacher_id,
        lesson_id=lesson.id if lesson else None,
        course_title=course_title,
        unit_label=unit_label,
        unit_number=unit_number,
        student_id=student.id if student else None,
        student_name=student_name,
        worksheet_score=body.worksheet_score,
        worksheet_total=body.worksheet_total,
        quiz_score=body.quiz_score,
        quiz_total=body.quiz_total,
        homework_score=body.homework_score,
        homework_total=body.homework_total,
        notes=body.notes or "",
        homework_assigned=body.homework_assigned or "",
        hours=body.hours,
        session_date=body.session_date or datetime.now(UTC),
    )
    db.add(session)
    db.flush()
    on_session_saved(db, session, previous_homework=None)
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.patch("/sessions/{session_id}")
def update_session(
    session_id: UUID,
    body: SessionUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    if profile.role not in (AppRole.manager, AppRole.teacher):
        raise HTTPException(status_code=403, detail="Students cannot edit sessions")
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if profile.role != AppRole.manager and session.teacher_id != profile.id:
        raise HTTPException(status_code=403, detail="Not your session")

    previous_homework = float(session.homework_score) if session.homework_score is not None else None

    data = body.model_dump(exclude_unset=True)
    if "student_id" in data or "student_name" in data:
        student, student_name = _resolve_student(
            db,
            profile,
            data.pop("student_id", session.student_id),
            data.pop("student_name", session.student_name) or session.student_name,
        )
        session.student_id = student.id if student else None
        session.student_name = student_name

    lesson_id = data.pop("lesson_id", None) if "lesson_id" in data else ...
    wants_catalog = any(key in data for key in ("curriculum", "course_title", "unit_label", "unit_number"))
    if lesson_id is not ... and lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if profile.role != AppRole.manager and not teacher_has_course(db, profile.id, lesson.course_id):
            raise HTTPException(status_code=403, detail="Course not assigned")
        session.lesson_id = lesson.id
        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        session.course_title = course.title if course else ""
        session.unit_label = lesson.theme
        session.unit_number = lesson.unit_number
    elif wants_catalog or lesson_id is None:
        curriculum = data.pop("curriculum", None)
        course_title = (data.pop("course_title", session.course_title) or "").strip()
        unit_label = (data.pop("unit_label", session.unit_label) or "").strip()
        unit_number = data.pop("unit_number", session.unit_number)
        if curriculum:
            if curriculum not in CURRICULUM_FLAGS:
                raise HTTPException(status_code=400, detail="Unknown course")
            if not _can_log_curriculum(profile, curriculum):
                raise HTTPException(status_code=403, detail="This course is not enabled for you")
        elif wants_catalog and profile.role != AppRole.manager and not course_title:
            raise HTTPException(status_code=400, detail="Choose a course")
        if wants_catalog or lesson_id is None:
            session.lesson_id = None
            if course_title:
                session.course_title = course_title
            if unit_label:
                session.unit_label = unit_label
            if unit_number is not None:
                session.unit_number = unit_number
    else:
        data.pop("curriculum", None)
        data.pop("course_title", None)
        data.pop("unit_label", None)
        data.pop("unit_number", None)

    for field, value in data.items():
        if field in {
            "notes",
            "homework_assigned",
            "worksheet_score",
            "worksheet_total",
            "quiz_score",
            "quiz_total",
            "homework_score",
            "homework_total",
            "session_date",
            "hours",
        }:
            setattr(session, field, value)

    on_session_saved(db, session, previous_homework=previous_homework)
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.delete("/sessions/{session_id}")
def delete_session(session_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role not in (AppRole.manager, AppRole.teacher):
        raise HTTPException(status_code=403, detail="Students cannot delete sessions")
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if profile.role != AppRole.manager and session.teacher_id != profile.id:
        raise HTTPException(status_code=403, detail="Not your session")
    db.query(Notification).filter(Notification.session_id == session.id).delete(synchronize_session=False)
    db.delete(session)
    db.commit()
    return {"id": str(session_id)}


@router.post("/sessions/{session_id}/feedback")
def add_feedback(
    session_id: UUID,
    body: SessionFeedback,
    manager: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    text = body.feedback.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Feedback cannot be empty")
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.manager_feedback = text
    session.manager_feedback_at = datetime.now(UTC)
    session.manager_id = manager.id

    lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first() if session.lesson_id else None
    course = db.query(Course).filter(Course.id == lesson.course_id).first() if lesson else None
    if lesson and course:
        label = f"{course.title} · Unit {lesson.unit_number}"
    elif session.course_title:
        label = session.course_title
        if session.unit_label:
            label = f"{label} · {session.unit_label}"
    else:
        label = "a lesson"

    preview = _feedback_preview(text)
    db.add(
        Notification(
            user_id=session.teacher_id,
            session_id=session.id,
            type="manager_feedback",
            title="New manager feedback",
            message=(
                f"{manager.full_name or 'Manager'} left feedback on {session.student_name}'s session ({label}): "
                f"{preview}"
            ),
        )
    )
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.get("/notifications")
def list_notifications(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == profile.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(n.id),
            "user_id": str(n.user_id),
            "session_id": str(n.session_id) if n.session_id else None,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


@router.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    note = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == profile.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
    note.read = True
    db.commit()
    return {
        "id": str(note.id),
        "read": note.read,
    }


@router.post("/notifications/read-all")
def mark_all_read(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == profile.id, Notification.read.is_(False)).update(
        {"read": True}
    )
    db.commit()
    return {"ok": True}
