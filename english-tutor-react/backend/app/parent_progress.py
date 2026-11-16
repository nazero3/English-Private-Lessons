"""What a parent is allowed to read about a student's lessons.

Completed sessions already carry the course, the teacher's class note, and
any scores. This module turns those rows into the two things a parent opens
the app to see: which courses the student is taking, and what each lesson
covered.

Curriculum prep never enters here: teacher plans, answer keys, common
mistakes, and the in-lesson script stay on the staff side.
"""

from __future__ import annotations


def _pct(score, total) -> float | None:
    if score is None or total in (None, 0):
        return None
    return round((float(score) / float(total)) * 100, 1)


def _avg(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 1)


def learned_lines(*, grammar: str = "", objectives: list | None = None, title: str = "") -> list[str]:
    """Parent-safe lines of what the lesson taught.

    `title` is the heading already shown on the card, so it is not repeated.
    Non-text objectives are dropped. An empty list means the card has only
    the heading and the teacher's note.
    """
    heading = (title or "").strip()
    lines: list[str] = []
    seen: set[str] = set()

    def add(text: str) -> None:
        cleaned = (text or "").strip()
        if not cleaned or cleaned == heading or cleaned in seen:
            return
        seen.add(cleaned)
        lines.append(cleaned)

    add(grammar)
    for item in objectives or []:
        if isinstance(item, str):
            add(item)
    return lines


def course_rollups(sessions: list[dict]) -> list[dict]:
    """Courses the student has actually taken, newest activity first.

    `sessions` must already be newest-first. A session with no course title
    is grouped under an empty title so the screen can label it. The average
    uses the same score fields as the overall summary, limited to that course.
    """
    groups: dict[str, dict] = {}
    order: list[str] = []
    for session in sessions:
        course = session.get("course") or {}
        title = (course.get("title") or "").strip()
        key = str(course.get("id") or title or "__other__")
        bucket = groups.get(key)
        if bucket is None:
            bucket = {
                "id": course.get("id"),
                "title": title,
                "grade": (course.get("grade") or "").strip(),
                "lessons_count": 0,
                "last_session_date": session.get("session_date"),
                "_percents": [],
            }
            groups[key] = bucket
            order.append(key)
        bucket["lessons_count"] += 1
        for score_key, total_key in (
            ("worksheet_score", "worksheet_total"),
            ("quiz_score", "quiz_total"),
            ("homework_score", "homework_total"),
        ):
            percent = _pct(session.get(score_key), session.get(total_key))
            if percent is not None:
                bucket["_percents"].append(percent)
    out = []
    for key in order:
        bucket = groups[key]
        percents = bucket.pop("_percents")
        bucket["overall_avg"] = _avg(percents)
        out.append(bucket)
    return out
