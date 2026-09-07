"""Recurring Sat–Thu timetable used by ops (matches the school wall-chart)."""

from __future__ import annotations

WEEKDAYS = (
    {"id": 0, "en": "Saturday", "ar": "السبت"},
    {"id": 1, "en": "Sunday", "ar": "الأحد"},
    {"id": 2, "en": "Monday", "ar": "الاثنين"},
    {"id": 3, "en": "Tuesday", "ar": "الثلاثاء"},
    {"id": 4, "en": "Wednesday", "ar": "الأربعاء"},
    {"id": 5, "en": "Thursday", "ar": "الخميس"},
)

GRID_START_MINUTES = 12 * 60
GRID_END_MINUTES = 22 * 60
SLOT_STEP_MINUTES = 30
DEFAULT_DURATION_MINUTES = 60
ALLOWED_DURATIONS = (30, 60, 90)

STUDENT_COLORS = (
    "#F5E6C8",
    "#F8D0D0",
    "#C5D8F0",
    "#F5CBA7",
    "#D4E8D0",
    "#E4D5F0",
    "#FFE6A7",
    "#D0E8E3",
)


def time_starts() -> list[int]:
    starts = []
    minute = GRID_START_MINUTES
    while minute <= GRID_END_MINUTES:
        starts.append(minute)
        minute += SLOT_STEP_MINUTES
    return starts


TIME_STARTS = tuple(time_starts())


def format_clock(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    display = hours if hours <= 12 else hours - 12
    return f"{display}:{mins:02d}"


def occupied_starts(start_minutes: int, duration_minutes: int) -> list[int]:
    if duration_minutes not in ALLOWED_DURATIONS:
        raise ValueError("Duration must be 30, 60, or 90 minutes")
    if start_minutes not in TIME_STARTS:
        raise ValueError("Start time is outside the weekly grid")
    ticks = duration_minutes // SLOT_STEP_MINUTES
    occupied = [start_minutes + i * SLOT_STEP_MINUTES for i in range(ticks)]
    if occupied[-1] not in TIME_STARTS:
        raise ValueError("Class would run past the end of the day")
    return occupied


def ranges_overlap(start_a: int, duration_a: int, start_b: int, duration_b: int) -> bool:
    a = set(occupied_starts(start_a, duration_a))
    b = set(occupied_starts(start_b, duration_b))
    return bool(a & b)


def next_color(used: set[str]) -> str:
    for color in STUDENT_COLORS:
        if color not in used:
            return color
    return STUDENT_COLORS[len(used) % len(STUDENT_COLORS)]


def weekly_hours(slots: list[dict]) -> float:
    total = sum(int(slot.get("duration_minutes") or 0) for slot in slots)
    return round(total / 60, 2)


def slot_payload(slot, student=None, teacher=None) -> dict:
    student_name = ""
    if student is not None:
        student_name = student.full_name
    elif getattr(slot, "student_name", None):
        student_name = slot.student_name
    teacher_name = teacher.full_name if teacher is not None else ""
    return {
        "id": str(slot.id),
        "teacher_id": str(slot.teacher_id),
        "student_id": str(slot.student_id),
        "student_name": student_name,
        "teacher_name": teacher_name,
        "weekday": int(slot.weekday),
        "start_minutes": int(slot.start_minutes),
        "duration_minutes": int(slot.duration_minutes),
        "color": slot.color or STUDENT_COLORS[0],
        "label": f"{student_name} / {teacher_name}".strip(" /"),
    }


def grid_meta() -> dict:
    return {
        "weekdays": list(WEEKDAYS),
        "time_starts": list(TIME_STARTS),
        "time_labels": [format_clock(m) for m in TIME_STARTS],
        "slot_step_minutes": SLOT_STEP_MINUTES,
        "default_duration_minutes": DEFAULT_DURATION_MINUTES,
        "allowed_durations": list(ALLOWED_DURATIONS),
        "colors": list(STUDENT_COLORS),
    }
