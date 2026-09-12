"""Student identity lives on the roster; lesson history follows the student id.

`lesson_sessions.student_name` is only a fallback snapshot for hours kept after a
student is deleted (`student_id` is SET NULL) or for old rows logged by name only.
Reads should prefer `students.full_name` whenever the session is still linked.
"""

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .models import LessonSession, Student


def display_student_name(snapshot: str | None, roster_name: str | None) -> str:
    live = (roster_name or "").strip()
    if live:
        return live
    snap = (snapshot or "").strip()
    return snap or "Student"


def session_display_name(session, student=None) -> str:
    row = student if student is not None else getattr(session, "student", None)
    roster = getattr(row, "full_name", None) if row is not None else None
    return display_student_name(getattr(session, "student_name", None), roster)


def _norm_name(value: str | None) -> str:
    return (value or "").strip().lower()


def should_reattach_orphan(
    *,
    session_student_id,
    session_name: str | None,
    session_teacher_id,
    student_teacher_id,
    previous_name: str | None,
) -> bool:
    """Link a name-only history row to the roster student after a rename or late match."""
    if session_student_id is not None:
        return False
    if not student_teacher_id or session_teacher_id != student_teacher_id:
        return False
    old = _norm_name(previous_name)
    return bool(old) and _norm_name(session_name) == old


def sync_student_history(db: Session, student: Student, *, previous_name: str | None = None) -> None:
    """Keep linked lesson snapshots current, and attach leftover name-only rows."""
    name = (student.full_name or "").strip()
    if not name:
        return

    db.query(LessonSession).filter(LessonSession.student_id == student.id).update(
        {LessonSession.student_name: name},
        synchronize_session=False,
    )

    old = (previous_name or "").strip()
    if not old or not student.teacher_id:
        return
    db.query(LessonSession).filter(
        LessonSession.student_id.is_(None),
        LessonSession.teacher_id == student.teacher_id,
        func.lower(func.btrim(LessonSession.student_name)) == old.lower(),
    ).update(
        {LessonSession.student_id: student.id, LessonSession.student_name: name},
        synchronize_session=False,
    )


def backfill_session_student_names(db: Session) -> None:
    """One-shot repair for existing rows: copy live roster names onto linked sessions."""
    db.execute(
        text(
            """
            UPDATE lesson_sessions AS ls
            SET student_name = s.full_name
            FROM students AS s
            WHERE ls.student_id = s.id
              AND ls.student_name IS DISTINCT FROM s.full_name
            """
        )
    )
    db.execute(
        text(
            """
            UPDATE lesson_sessions AS ls
            SET student_id = s.id,
                student_name = s.full_name
            FROM students AS s
            WHERE ls.student_id IS NULL
              AND s.teacher_id IS NOT NULL
              AND ls.teacher_id = s.teacher_id
              AND lower(btrim(ls.student_name)) = lower(btrim(s.full_name))
            """
        )
    )
