"""Guards from the live-lesson review. Rolls back, except the finish race which deletes its rows."""

import threading
import unittest
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import SessionLocal
from app.family import ensure_subscription, student_is_enrolled
from app.models import AppRole, LessonSession, ParentStudent, Profile, Student, Subscription, User
from app.routers.sessions import _latest_completed_by_teacher, end_session
from app.schemas import SessionEnd


def _teacher_view(teacher_id):
    return SimpleNamespace(
        id=teacher_id,
        role=AppRole.teacher,
        can_access_private_lessons=True,
        can_access_math_grade9=False,
        can_access_math_grade12=False,
        can_access_physics_grade12=False,
    )


class LiveLessonGuardTests(unittest.TestCase):
    def setUp(self):
        try:
            self.db = SessionLocal()
            self.db.execute(text("SELECT 1"))
        except OperationalError:
            self.db = None
            self.skipTest("Local Postgres is not available")

    def tearDown(self):
        if getattr(self, "db", None) is not None:
            self.db.rollback()
            self.db.close()

    def _user(self, role, name):
        user = User(email=f"zz-live-{uuid4().hex[:10]}@example.com", password_hash="x")
        self.db.add(user)
        self.db.flush()
        profile = Profile(id=user.id, full_name=name, role=role)
        self.db.add(profile)
        self.db.flush()
        return profile

    def _lesson(self, teacher_id, student, *, status, when, notes=""):
        row = LessonSession(
            teacher_id=teacher_id,
            student_id=student.id,
            student_name=student.full_name,
            status=status,
            started_at=when,
            ended_at=when if status == "completed" else None,
            session_date=when,
            created_at=when,
            notes=notes,
            homework_assigned="",
            course_title="English File",
            unit_label="Unit 1",
            hours=1 if status == "completed" else None,
            note_tags=[],
        )
        self.db.add(row)
        self.db.flush()
        return row

    def test_started_lesson_is_not_enrollment(self):
        teacher = self._user(AppRole.teacher, "ZZ Teacher")
        student = Student(teacher_id=teacher.id, full_name=f"ZZ {uuid4().hex[:6]}")
        self.db.add(student)
        self.db.flush()
        now = datetime.now(UTC)
        self._lesson(teacher.id, student, status="in_progress", when=now)
        self.assertFalse(student_is_enrolled(self.db, student.id))

        self._lesson(teacher.id, student, status="completed", when=now, notes="done")
        self.assertTrue(student_is_enrolled(self.db, student.id))

    def test_cancelled_start_drops_free_month_and_keeps_manager_grant(self):
        parent = self._user(AppRole.parent, "ZZ Parent")
        teacher = self._user(AppRole.teacher, "ZZ Teacher")
        student = Student(teacher_id=teacher.id, full_name=f"ZZ {uuid4().hex[:6]}")
        self.db.add(student)
        self.db.flush()
        self.db.add(ParentStudent(parent_id=parent.id, student_id=student.id, relationship="mother"))
        now = datetime.now(UTC)
        self._lesson(teacher.id, student, status="in_progress", when=now)
        opened = Subscription(
            parent_id=parent.id,
            status="complimentary",
            period="enrolled",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=30),
            complimentary_reason="عضوية مجانية مع كورس كينز",
        )
        self.db.add(opened)
        self.db.flush()

        expired = ensure_subscription(self.db, parent.id)
        self.assertEqual(expired.status, "expired")
        self.db.refresh(opened)
        self.assertEqual(opened.status, "expired")

        grant = Subscription(
            parent_id=parent.id,
            status="complimentary",
            period="grant",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=14),
            complimentary_reason="منحة إدارية",
            created_at=now + timedelta(seconds=1),
        )
        self.db.add(grant)
        self.db.flush()
        kept = ensure_subscription(self.db, parent.id)
        self.assertEqual(kept.id, grant.id)
        self.assertEqual(kept.status, "complimentary")

    def test_finished_lesson_still_opens_free_month(self):
        parent = self._user(AppRole.parent, "ZZ Parent")
        teacher = self._user(AppRole.teacher, "ZZ Teacher")
        student = Student(teacher_id=teacher.id, full_name=f"ZZ {uuid4().hex[:6]}")
        self.db.add(student)
        self.db.flush()
        self.db.add(ParentStudent(parent_id=parent.id, student_id=student.id, relationship="mother"))
        self._lesson(teacher.id, student, status="completed", when=datetime.now(UTC), notes="done")
        sub = ensure_subscription(self.db, parent.id)
        self.assertEqual(sub.status, "complimentary")
        self.assertEqual(sub.period, "enrolled")

    def test_longer_welcome_without_a_lesson_stays(self):
        parent = self._user(AppRole.parent, "ZZ Parent")
        now = datetime.now(UTC)
        welcome = Subscription(
            parent_id=parent.id,
            status="complimentary",
            period="enrolled",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=90),
            complimentary_reason="عضوية تجريبية",
        )
        self.db.add(welcome)
        self.db.flush()
        kept = ensure_subscription(self.db, parent.id)
        self.assertEqual(kept.id, welcome.id)
        self.assertEqual(kept.status, "complimentary")

    def test_status_board_uses_newest_finished_lesson(self):
        teacher = self._user(AppRole.teacher, "ZZ Teacher")
        student = Student(teacher_id=teacher.id, full_name=f"ZZ {uuid4().hex[:6]}")
        self.db.add(student)
        self.db.flush()
        now = datetime.now(UTC)
        self._lesson(teacher.id, student, status="completed", when=now - timedelta(days=2), notes="old")
        newest = self._lesson(teacher.id, student, status="completed", when=now - timedelta(hours=1), notes="new")
        self._lesson(teacher.id, student, status="in_progress", when=now, notes="live")
        latest = _latest_completed_by_teacher(self.db)
        self.assertEqual(latest[teacher.id].id, newest.id)
        self.assertEqual(latest[teacher.id].notes, "new")


class FinishRaceTests(unittest.TestCase):
    def setUp(self):
        try:
            self.db = SessionLocal()
            self.db.execute(text("SELECT 1"))
        except OperationalError:
            self.db = None
            self.skipTest("Local Postgres is not available")
        self.created = []

    def tearDown(self):
        if getattr(self, "db", None) is not None:
            self.db.rollback()
            self.db.close()
        if not self.created:
            return
        clean = SessionLocal()
        try:
            for teacher_id, student_id in self.created:
                clean.query(LessonSession).filter(LessonSession.teacher_id == teacher_id).delete(
                    synchronize_session=False
                )
                clean.query(Student).filter(Student.id == student_id).delete(synchronize_session=False)
                clean.query(Profile).filter(Profile.id == teacher_id).delete(synchronize_session=False)
                clean.query(User).filter(User.id == teacher_id).delete(synchronize_session=False)
            clean.commit()
        finally:
            clean.close()

    def test_second_finish_does_not_replace_hours(self):
        user = User(email=f"zz-race-{uuid4().hex[:10]}@example.com", password_hash="x")
        self.db.add(user)
        self.db.flush()
        teacher = Profile(
            id=user.id,
            full_name="ZZ Race",
            role=AppRole.teacher,
            can_access_private_lessons=True,
        )
        self.db.add(teacher)
        student = Student(teacher_id=teacher.id, full_name=f"ZZ {uuid4().hex[:6]}")
        self.db.add(student)
        self.db.flush()
        now = datetime.now(UTC)
        session = LessonSession(
            teacher_id=teacher.id,
            student_id=student.id,
            student_name=student.full_name,
            status="in_progress",
            started_at=now,
            session_date=now,
            notes="",
            homework_assigned="",
            course_title="",
            unit_label="",
            note_tags=[],
        )
        self.db.add(session)
        self.db.commit()
        self.created.append((teacher.id, student.id))
        session_id = session.id
        profile = _teacher_view(teacher.id)

        def payload(notes, hours):
            return SessionEnd(
                curriculum="english_file",
                course_title="English File",
                unit_label="Unit 1",
                unit_number=1,
                notes=notes,
                hours=hours,
            )

        started = threading.Event()
        release = threading.Event()
        errors = {}

        def block_save(db, row, previous_homework=None):
            started.set()
            release.wait(5)

        def finish_first():
            db = SessionLocal()
            try:
                end_session(session_id, payload("first", 1.5), profile, db)
            except Exception as exc:  # pragma: no cover - failure detail
                errors["first"] = repr(exc)
            finally:
                db.close()

        def finish_second():
            db = SessionLocal()
            try:
                end_session(session_id, payload("second", 2), profile, db)
                errors["ok"] = True
            except HTTPException as exc:
                errors["status"] = exc.status_code
            except Exception as exc:  # pragma: no cover - failure detail
                errors["err"] = repr(exc)
            finally:
                db.rollback()
                db.close()

        try:
            with patch("app.routers.sessions.on_session_saved", block_save):
                holder = threading.Thread(target=finish_first)
                second = threading.Thread(target=finish_second)
                holder.start()
                self.assertTrue(started.wait(5), "first finish did not reach the save")
                second.start()
                second.join(0.5)
                self.assertTrue(second.is_alive(), "second finish did not wait for the row lock")
                release.set()
                holder.join(5)
                second.join(5)
        finally:
            release.set()

        self.assertEqual(errors.get("status"), 400, errors)
        check = SessionLocal()
        try:
            saved = check.query(LessonSession).filter(LessonSession.id == session_id).one()
            self.assertEqual(saved.notes, "first")
            self.assertEqual(float(saved.hours), 1.5)
            self.assertEqual(saved.status, "completed")
        finally:
            check.close()


if __name__ == "__main__":
    unittest.main()
