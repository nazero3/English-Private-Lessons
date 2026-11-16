import unittest

from app.parent_progress import course_rollups, learned_lines


class LearnedLinesTests(unittest.TestCase):
    def test_grammar_and_objectives_without_repeating_the_title(self):
        lines = learned_lines(
            grammar="Present simple",
            objectives=["Use it in a sentence.", "Present simple", "  "],
            title="Present simple",
        )
        self.assertEqual(lines, ["Use it in a sentence."])

    def test_ignores_non_text_objectives(self):
        self.assertEqual(learned_lines(grammar="", objectives=[{"prompt": "hidden"}, None]), [])

    def test_empty_when_nothing_was_recorded(self):
        self.assertEqual(learned_lines(), [])


class CourseRollupTests(unittest.TestCase):
    def test_groups_newest_first_and_averages_only_that_course(self):
        sessions = [
            {
                "course": {"id": "eng", "title": "English File", "grade": "Beginner"},
                "session_date": "2026-03-02",
                "quiz_score": 8,
                "quiz_total": 10,
                "worksheet_score": None,
                "worksheet_total": None,
                "homework_score": None,
                "homework_total": None,
            },
            {
                "course": {"id": "math", "title": "Algebra", "grade": "9"},
                "session_date": "2026-03-01",
                "quiz_score": 5,
                "quiz_total": 10,
                "worksheet_score": None,
                "worksheet_total": None,
                "homework_score": None,
                "homework_total": None,
            },
            {
                "course": {"id": "eng", "title": "English File", "grade": "Beginner"},
                "session_date": "2026-02-20",
                "quiz_score": 10,
                "quiz_total": 10,
                "worksheet_score": None,
                "worksheet_total": None,
                "homework_score": None,
                "homework_total": None,
            },
        ]
        rows = course_rollups(sessions)
        self.assertEqual([row["title"] for row in rows], ["English File", "Algebra"])
        english = rows[0]
        self.assertEqual(english["lessons_count"], 2)
        self.assertEqual(english["last_session_date"], "2026-03-02")
        self.assertEqual(english["grade"], "Beginner")
        self.assertEqual(english["overall_avg"], 90.0)
        self.assertEqual(rows[1]["overall_avg"], 50.0)

    def test_untitled_sessions_share_one_group(self):
        rows = course_rollups(
            [
                {"course": None, "session_date": "2026-03-01"},
                {"course": {"id": None, "title": "", "grade": ""}, "session_date": "2026-02-01"},
            ]
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "")
        self.assertEqual(rows[0]["lessons_count"], 2)
        self.assertIsNone(rows[0]["overall_avg"])


if __name__ == "__main__":
    unittest.main()
