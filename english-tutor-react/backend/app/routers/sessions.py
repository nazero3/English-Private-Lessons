from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_profile, require_manager, teacher_has_course
from ..family import on_session_saved
from ..models import AppRole, Course, Lesson, LessonSession, Notification, Profile, Student
from ..schemas import SessionCreate, SessionFeedback, SessionUpdate

router = APIRouter(tags=["sessions"])


def _session_dict(session: LessonSession, db: Session) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first()
    course = db.query(Course).filter(Course.id == lesson.course_id).first() if lesson else None
    teacher = db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == session.teacher_id).first()
    manager = (
        db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == session.manager_id).first()
        if session.manager_id
        else None
    )
    from ..auth import profile_to_dict

    return {
        "id": str(session.id),
        "teacher_id": str(session.teacher_id),
        "lesson_id": str(session.lesson_id),
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
        "session_date": session.session_date.isoformat() if session.session_date else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "manager_feedback": session.manager_feedback,
        "manager_feedback_at": session.manager_feedback_at.isoformat() if session.manager_feedback_at else None,
        "manager_id": str(session.manager_id) if session.manager_id else None,
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
        else None,
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher and teacher.user else None)
        if teacher
        else None,
        "manager": profile_to_dict(manager, manager.user.email if manager and manager.user else None)
        if manager
        else None,
        "course": {
            "id": str(course.id),
            "title": course.title,
            "grade": course.grade,
        }
        if course
        else None,
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
    q = db.query(LessonSession).order_by(LessonSession.session_date.desc())
    if profile.role != AppRole.manager:
        q = q.filter(LessonSession.teacher_id == profile.id)
    return [_session_dict(s, db) for s in q.all()]


@router.post("/sessions", status_code=201)
def create_session(body: SessionCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role in (AppRole.student, AppRole.parent):
        raise HTTPException(status_code=403, detail="Students cannot create sessions")
    lesson = db.query(Lesson).filter(Lesson.id == body.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if profile.role != AppRole.manager and not teacher_has_course(db, profile.id, lesson.course_id):
        raise HTTPException(status_code=403, detail="Course not assigned")

    student, student_name = _resolve_student(db, profile, body.student_id, body.student_name)
    teacher_id = student.teacher_id if student else profile.id

    session = LessonSession(
        teacher_id=teacher_id,
        lesson_id=body.lesson_id,
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
    if profile.role in (AppRole.student, AppRole.parent):
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
    if "lesson_id" in data and data["lesson_id"]:
        lesson = db.query(Lesson).filter(Lesson.id == data["lesson_id"]).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if profile.role != AppRole.manager and not teacher_has_course(db, profile.id, lesson.course_id):
            raise HTTPException(status_code=403, detail="Course not assigned")
        session.lesson_id = data.pop("lesson_id")
    else:
        data.pop("lesson_id", None)
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
        }:
            setattr(session, field, value)

    on_session_saved(db, session, previous_homework=previous_homework)
    db.commit()
    db.refresh(session)
    return _session_dict(session, db)


@router.delete("/sessions/{session_id}")
def delete_session(session_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role in (AppRole.student, AppRole.parent):
        raise HTTPException(status_code=403, detail="Students cannot delete sessions")
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if profile.role != AppRole.manager and session.teacher_id != profile.id:
        raise HTTPException(status_code=403, detail="Not your session")
    db.delete(session)
    db.commit()
    return {"id": str(session_id)}
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

    lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first()
    course = db.query(Course).filter(Course.id == lesson.course_id).first() if lesson else None
    label = f"{course.title} · Unit {lesson.unit_number}" if lesson and course else "a lesson"

    db.add(
        Notification(
            user_id=session.teacher_id,
            session_id=session.id,
            type="manager_feedback",
            title="New manager feedback",
            message=f"{manager.full_name or 'Manager'} left feedback on {session.student_name}'s session ({label}).",
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
