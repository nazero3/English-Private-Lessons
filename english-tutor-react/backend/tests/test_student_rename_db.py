"""Local Postgres checks. Always roll back so demo rows stay unchanged."""

import unittest
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import SessionLocal
from app.models import AppRole, LessonSession, Profile, Student
from app.student_identity import session_display_name, sync_student_history


class StudentRenameDbTests(unittest.TestCase):
    def setUp(self):
        try:
            self.db = SessionLocal()
            self.db.execute(text("SELECT 1"))
        except OperationalError:
            self.db = None
            self.skipTest("Local Postgres is not available")
        self.teacher = (
            self.db.query(Profile).filter(Profile.role == AppRole.teacher).first()
        )
        if not self.teacher:
            self.skipTest("No teacher profile in local database")

    def tearDown(self):
        if getattr(self, "db", None) is not None:
            self.db.rollback()
            self.db.close()

    def test_history_follows_roster_rename(self):
        marker = f"zz-rename-{uuid4().hex[:8]}"
        student = Student(teacher_id=self.teacher.id, full_name=f"{marker}-yasen")
        self.db.add(student)
        self.db.flush()

        session = LessonSession(
            teacher_id=self.teacher.id,
            student_id=student.id,
            student_name=student.full_name,
            course_title="Grade 9 English",
            unit_label="Unit 1",
            unit_number=1,
            hours=1,
        )
        self.db.add(session)
        self.db.flush()

        previous = student.full_name
        student.full_name = f"{marker}-Yasin"
        self.db.flush()

        self.assertEqual(session_display_name(session, student), f"{marker}-Yasin")
        self.assertEqual(session.student_name, previous)

        sync_student_history(self.db, student, previous_name=previous)
        self.db.flush()
        self.db.refresh(session)

        self.assertEqual(session.student_name, f"{marker}-Yasin")
        self.assertEqual(session.student_id, student.id)

    def test_orphan_name_only_row_is_linked_on_rename(self):
        marker = f"zz-orphan-{uuid4().hex[:8]}"
        old_name = f"{marker}-yasen"
        student = Student(teacher_id=self.teacher.id, full_name=old_name)
        self.db.add(student)
        self.db.flush()

        orphan = LessonSession(
            teacher_id=self.teacher.id,
            student_id=None,
            student_name=old_name,
            course_title="Grade 9 English",
            unit_label="Unit 2",
            unit_number=2,
            hours=1,
        )
        self.db.add(orphan)
        self.db.flush()

        student.full_name = f"{marker}-Yasin"
        sync_student_history(self.db, student, previous_name=old_name)
        self.db.flush()
        self.db.refresh(orphan)

        self.assertEqual(orphan.student_id, student.id)
        self.assertEqual(orphan.student_name, f"{marker}-Yasin")


if __name__ == "__main__":
    unittest.main()
