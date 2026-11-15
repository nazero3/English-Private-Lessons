import unittest
from datetime import UTC, datetime, timedelta

from app.routers.sessions import _hours_from_duration, _normalize_note_tags


class HoursFromDurationTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 1, 1, 10, 0, tzinfo=UTC)

    def test_one_hour(self):
        self.assertEqual(_hours_from_duration(self.start, self.start + timedelta(hours=1)), 1.0)

    def test_short_lesson_clamps_to_half(self):
        self.assertEqual(_hours_from_duration(self.start, self.start + timedelta(minutes=10)), 0.5)

    def test_rounds_to_quarter(self):
        self.assertEqual(_hours_from_duration(self.start, self.start + timedelta(minutes=45)), 0.75)
        self.assertEqual(_hours_from_duration(self.start, self.start + timedelta(minutes=38)), 0.75)


class NoteTagsTests(unittest.TestCase):
    def test_dedupes_and_trims(self):
        self.assertEqual(
            _normalize_note_tags(['Grammar', ' Grammar ', '', 'Grammar', 'Reading']),
            ['Grammar', 'Reading'],
        )

    def test_empty(self):
        self.assertEqual(_normalize_note_tags(None), [])
        self.assertEqual(_normalize_note_tags([]), [])


if __name__ == '__main__':
    unittest.main()
