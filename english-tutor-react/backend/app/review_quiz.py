import re
from copy import deepcopy


def review_unit_numbers(unit_number: int) -> list[int]:
    n = int(unit_number)
    if n <= 0 or n % 3 != 0:
        return []
    return [n - 2, n - 1, n]


def normalize_answer(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower().strip())


def build_review_quiz(lessons: list[dict], target_count: int = 11) -> list[dict]:
    pool: list[dict] = []
    for lesson in lessons:
        for item in lesson.get("quiz_bank") or []:
            pool.append(
                {
                    **item,
                    "sourceUnit": lesson["unit_number"],
                    "sourceTheme": lesson["theme"],
                    "sourceGrammar": lesson["grammar"],
                    "lessonId": str(lesson["id"]),
                    "compositeId": f"{lesson['id']}:{item.get('id', '')}",
                }
            )

    by_unit: dict[int, list[dict]] = {}
    for item in pool:
        by_unit.setdefault(item["sourceUnit"], []).append(item)

    units = sorted(by_unit.keys())
    picked: list[dict] = []
    guard = 0
    while len(picked) < target_count and guard < target_count * 20:
        guard += 1
        added = False
        for unit in units:
            arr = by_unit.get(unit) or []
            if not arr:
                continue
            prefer_mcq = len(picked) % 2 == 0
            idx = next(
                (i for i, x in enumerate(arr) if (prefer_mcq and x.get("type") == "mcq") or (not prefer_mcq and x.get("type") == "fill")),
                0,
            )
            picked.append(arr.pop(idx))
            added = True
            if len(picked) >= target_count:
                break
        if not added:
            break
    return picked


def strip_quiz_answer_keys(items: list[dict]) -> list[dict]:
    safe = []
    for item in items:
        row = deepcopy(item)
        row.pop("answer", None)
        row.pop("correct", None)
        row.pop("a", None)
        safe.append(row)
    return safe


def build_safe_review_quiz_payload(current_lesson: dict, related_lessons: list[dict], target_count: int = 11) -> dict:
    units = review_unit_numbers(current_lesson["unit_number"])
    if not units:
        raise ValueError("Review quiz is only available on units 3, 6, 9, and 12.")
    lessons = [l for l in related_lessons if l["unit_number"] in units]
    picked = build_review_quiz(lessons, target_count)
    return {
        "lessonId": str(current_lesson["id"]),
        "courseId": str(current_lesson["course_id"]),
        "unitNumber": current_lesson["unit_number"],
        "units": units,
        "items": strip_quiz_answer_keys(picked),
        "lessonsMeta": [
            {
                "id": str(l["id"]),
                "unit_number": l["unit_number"],
                "theme": l["theme"],
                "grammar": l["grammar"],
            }
            for l in sorted(lessons, key=lambda x: x["unit_number"])
        ],
    }


def grade_review_quiz(current_lesson: dict, related_lessons: list[dict], answers: dict, target_count: int = 11) -> dict:
    units = review_unit_numbers(current_lesson["unit_number"])
    if not units:
        raise ValueError("Review quiz is only available on units 3, 6, 9, and 12.")
    lessons = [l for l in related_lessons if l["unit_number"] in units]
    picked = build_review_quiz(lessons, target_count)
    correct = 0
    total = 0
    results = []

    for item in picked:
        key = item.get("compositeId") or item.get("id")
        student = answers.get(key) if answers else None
        if item.get("type") == "mcq" and item.get("correct") is not None:
            total += 1
            ok = student is not None and int(student) == int(item["correct"])
            if ok:
                correct += 1
            results.append({"compositeId": key, "ok": ok})
        elif item.get("type") == "fill" and item.get("answer"):
            total += 1
            ok = normalize_answer(student) == normalize_answer(item["answer"])
            if ok:
                correct += 1
            results.append({"compositeId": key, "ok": ok})

    return {"correct": correct, "total": total, "results": results}
