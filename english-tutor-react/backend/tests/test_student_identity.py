import unittest
from types import SimpleNamespace
from uuid import uuid4

from app.student_identity import display_student_name, session_display_name, should_reattach_orphan


class DisplayStudentNameTests(unittest.TestCase):
    def test_roster_name_wins_over_stale_snapshot(self):
        self.assertEqual(display_student_name("yasen", "Yasin"), "Yasin")

    def test_snapshot_kept_when_student_row_is_gone(self):
        self.assertEqual(display_student_name("Yasin", None), "Yasin")

    def test_blank_roster_name_falls_back_to_snapshot(self):
        self.assertEqual(display_student_name("Yasin", "  "), "Yasin")

    def test_empty_values_use_default(self):
        self.assertEqual(display_student_name("", None), "Student")

    def test_session_relationship_uses_live_roster_name(self):
        session = SimpleNamespace(
            student_name="yasen",
            student=SimpleNamespace(full_name="Yasin"),
        )
        self.assertEqual(session_display_name(session), "Yasin")

    def test_session_without_link_keeps_snapshot(self):
        session = SimpleNamespace(student_name="Guest", student=None)
        self.assertEqual(session_display_name(session), "Guest")

    def test_explicit_student_argument_overrides_stale_relationship(self):
        session = SimpleNamespace(
            student_name="yasen",
            student=SimpleNamespace(full_name="yasen"),
        )
        self.assertEqual(
            session_display_name(session, SimpleNamespace(full_name="Yasin")),
            "Yasin",
        )


class ReattachOrphanTests(unittest.TestCase):
    def setUp(self):
        self.teacher_id = uuid4()
        self.other_teacher = uuid4()

    def test_reattach_old_name_on_same_teacher(self):
        self.assertTrue(
            should_reattach_orphan(
                session_student_id=None,
                session_name="yasen",
                session_teacher_id=self.teacher_id,
                student_teacher_id=self.teacher_id,
                previous_name="Yasen",
            )
        )

    def test_do_not_steal_another_teachers_row(self):
        self.assertFalse(
            should_reattach_orphan(
                session_student_id=None,
                session_name="yasen",
                session_teacher_id=self.other_teacher,
                student_teacher_id=self.teacher_id,
                previous_name="yasen",
            )
        )

    def test_do_not_reattach_already_linked_session(self):
        self.assertFalse(
            should_reattach_orphan(
                session_student_id=uuid4(),
                session_name="yasen",
                session_teacher_id=self.teacher_id,
                student_teacher_id=self.teacher_id,
                previous_name="yasen",
            )
        )

    def test_unassigned_student_does_not_claim_global_history(self):
        self.assertFalse(
            should_reattach_orphan(
                session_student_id=None,
                session_name="yasen",
                session_teacher_id=self.teacher_id,
                student_teacher_id=None,
                previous_name="yasen",
            )
        )


if __name__ == "__main__":
    unittest.main()
