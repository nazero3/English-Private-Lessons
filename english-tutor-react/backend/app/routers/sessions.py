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
from ..schemas import SessionCreate, SessionEnd, SessionFeedback, SessionStart, SessionUpdate
from ..student_identity import session_display_name

router = APIRouter(tags=["sessions"])

SESSION_STATUS_IN_PROGRESS = "in_progress"
SESSION_STATUS_COMPLETED = "completed"

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
        "student_name": session_display_name(session),
        "worksheet_score": float(session.worksheet_score) if session.worksheet_score is not None else None,
        "worksheet_total": float(session.worksheet_total) if session.worksheet_total is not None else None,
        "quiz_score": float(session.quiz_score) if session.quiz_score is not None else None,
        "quiz_total": float(session.quiz_total) if session.quiz_total is not None else None,
        "homework_score": float(session.homework_score) if session.homework_score is not None else None,
        "homework_total": float(session.homework_total) if session.homework_total is not None else None,
        "notes": session.notes,
        "homework_assigned": session.homework_assigned or "",
        "note_tags": list(session.note_tags or []),
        "hours": float(session.hours) if session.hours is not None else None,
        "status": session.status or SESSION_STATUS_COMPLETED,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
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


def _hours_from_duration(started_at: datetime, ended_at: datetime) -> float:
    """Round elapsed lesson time to nearest quarter-hour; clamp to payroll bounds."""
    seconds = max(0.0, (ended_at - started_at).total_seconds())
    raw = seconds / 3600.0
    rounded = round(raw * 4) / 4
    if rounded < 0.5:
        rounded = 0.5
    return min(24.0, rounded)


def _normalize_note_tags(tags: list[str] | None) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in tags or []:
        label = " ".join(str(raw or "").split())
        if not label or label in seen:
            continue
        seen.add(label)
        out.append(label)
    return out


def _apply_course_fields(
    db: Session,
    profile: Profile,
    session: LessonSession,
    *,
    lesson_id: UUID | None,
    curriculum: str | None,
    course_title: str | None,
    unit_label: str | None,
    unit_number: int | None,
) -> None:
    """Set lesson/course catalog fields on a session from end/create payloads."""
    title = (course_title or "").strip()
    label = (unit_label or "").strip()
    if lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if profile.role != AppRole.manager and not teacher_has_course(db, profile.id, lesson.course_id):
            raise HTTPException(status_code=403, detail="Course not assigned")
        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        session.lesson_id = lesson.id
        session.course_title = course.title if course else title
        session.unit_label = lesson.theme if not label else label
        session.unit_number = lesson.unit_number if unit_number is None else unit_number
        return

    if not title:
        raise HTTPException(status_code=400, detail="Choose a course")
    if curriculum:
        if curriculum not in CURRICULUM_FLAGS:
            raise HTTPException(status_code=400, detail="Unknown course")
        if not _can_log_curriculum(profile, curriculum):
            raise HTTPException(status_code=403, detail="This course is not enabled for you")
    elif profile.role != AppRole.manager:
        raise HTTPException(status_code=400, detail="Choose a course")

    session.lesson_id = None
    session.course_title = title
    session.unit_label = label
    session.unit_number = unit_number


def _active_for_teacher(db: Session, teacher_id: UUID) -> LessonSession | None:
    return (
        db.query(LessonSession)
        .options(joinedload(LessonSession.student))
        .filter(
            LessonSession.teacher_id == teacher_id,
            LessonSession.status == SESSION_STATUS_IN_PROGRESS,
        )
        .first()
    )


@router.get("/sessions")
def list_sessions(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role in (AppRole.student, AppRole.parent):
        raise HTTPException(status_code=403, detail="Use the student portal")
    if profile.role not in (AppRole.manager, AppRole.teacher, AppRole.operations):
        raise HTTPException(status_code=403, detail="Not allowed")
    q = (
        db.query(LessonSession)
        .options(joinedload(LessonSession.student))
        .filter(LessonSession.status == SESSION_STATUS_COMPLETED)
        .order_by(LessonSession.created_at.desc(), LessonSession.id.desc())
    )
    if not can_see_all_sessions(profile):
        q = q.filter(LessonSession.teacher_id == profile.id)
    return [_session_dict(s, db) for s in q.all()]


@router.get("/sessions/active")
def get_active_session(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role != AppRole.teacher:
        raise HTTPException(status_code=403, detail="Teachers only")
    active = _active_for_teacher(db, profile.id)
    if not active:
        return None
    return _session_dict(active, db)


@router.post("/sessions/start", status_code=201)
def start_session(body: SessionStart, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role != AppRole.teacher:
        raise HTTPException(status_code=403, detail="Teachers only")
    if _active_for_teacher(db, profile.id):
        raise HTTPException(status_code=409, detail="You already have a lesson in progress")

    student, student_name = _resolve_student(db, profile, body.student_id, "")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now = datetime.now(UTC)
    session = LessonSession(
        teacher_id=profile.id,
        student_id=student.id,
        student_name=student_name,
        status=SESSION_STATUS_IN_PROGRESS,
        started_at=now,
        session_date=now,
        note_tags=[],
        notes="",
        homework_assigned="",
        course_title="",
        unit_label="",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.post("/sessions/{session_id}/end")
def end_session(
    session_id: UUID,
    body: SessionEnd,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    if profile.role != AppRole.teacher:
        raise HTTPException(status_code=403, detail="Teachers only")
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != profile.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status != SESSION_STATUS_IN_PROGRESS:
        raise HTTPException(status_code=400, detail="This lesson is not in progress")

    now = datetime.now(UTC)
    started = session.started_at or session.created_at or now
    if started.tzinfo is None:
        started = started.replace(tzinfo=UTC)

    _apply_course_fields(
        db,
        profile,
        session,
        lesson_id=body.lesson_id,
        curriculum=body.curriculum,
        course_title=body.course_title,
        unit_label=body.unit_label,
        unit_number=body.unit_number,
    )

    tags = _normalize_note_tags(body.note_tags)
    free_notes = (body.notes or "").strip()
    session.note_tags = tags
    session.notes = free_notes
    session.homework_assigned = (body.homework_assigned or "").strip()
    session.ended_at = now
    session.status = SESSION_STATUS_COMPLETED
    session.hours = body.hours if body.hours is not None else _hours_from_duration(started, now)
    session.session_date = started

    on_session_saved(db, session, previous_homework=None)
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.get("/teachers/status")
def teachers_status(_: Profile = Depends(require_ops_or_manager), db: Session = Depends(get_db)):
    """Live board: every teacher free or in lesson, plus last completed notes."""
    from ..auth import profile_to_dict

    teachers = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role == AppRole.teacher)
        .order_by(Profile.full_name)
        .all()
    )
    active_rows = (
        db.query(LessonSession)
        .options(joinedload(LessonSession.student))
        .filter(LessonSession.status == SESSION_STATUS_IN_PROGRESS)
        .all()
    )
    active_by_teacher = {row.teacher_id: row for row in active_rows}

    latest_completed: dict[UUID, LessonSession] = {}
    completed = (
        db.query(LessonSession)
        .options(joinedload(LessonSession.student))
        .filter(LessonSession.status == SESSION_STATUS_COMPLETED)
        .order_by(LessonSession.ended_at.desc().nullslast(), LessonSession.created_at.desc())
        .all()
    )
    for row in completed:
        if row.teacher_id not in latest_completed:
            latest_completed[row.teacher_id] = row

    rows = []
    for teacher in teachers:
        active = active_by_teacher.get(teacher.id)
        last = latest_completed.get(teacher.id)
        entry = {
            "teacher_id": str(teacher.id),
            "teacher": profile_to_dict(teacher, teacher.user.email if teacher.user else None),
            "status": "in_lesson" if active else "free",
            "active_session": None,
            "last_session": None,
        }
        if active:
            entry["active_session"] = {
                "session_id": str(active.id),
                "student_id": str(active.student_id) if active.student_id else None,
                "student_name": session_display_name(active),
                "started_at": active.started_at.isoformat() if active.started_at else None,
            }
        if last:
            entry["last_session"] = {
                "session_id": str(last.id),
                "student_id": str(last.student_id) if last.student_id else None,
                "student_name": session_display_name(last),
                "ended_at": last.ended_at.isoformat() if last.ended_at else None,
                "session_date": last.session_date.isoformat() if last.session_date else None,
                "note_tags": list(last.note_tags or []),
                "notes": last.notes or "",
                "course_title": last.course_title or "",
                "unit_label": last.unit_label or "",
                "hours": float(last.hours) if last.hours is not None else None,
            }
        rows.append(entry)
    return {"teachers": rows}


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
            LessonSession.status == SESSION_STATUS_COMPLETED,
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
        note_tags=_normalize_note_tags(body.note_tags),
        hours=body.hours,
        status=SESSION_STATUS_COMPLETED,
        session_date=body.session_date or datetime.now(UTC),
        ended_at=datetime.now(UTC),
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

    if "note_tags" in data:
        session.note_tags = _normalize_note_tags(data.pop("note_tags"))

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
                f"{manager.full_name or 'Manager'} left feedback on {session_display_name(session)}'s session ({label}): "
                f"{preview}"
            ),
        )
    )
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.delete("/sessions/{session_id}/feedback")
def delete_feedback(
    session_id: UUID,
    _: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.manager_feedback = ""
    session.manager_feedback_at = None
    session.manager_id = None
    db.query(Notification).filter(
        Notification.session_id == session.id,
        Notification.type == "manager_feedback",
    ).delete(synchronize_session=False)
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
