from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload

from ..auth import profile_to_dict
from ..database import get_db
from ..deps import require_ops_or_manager
from ..models import AppRole, Profile, Student, WeeklyScheduleSlot
from ..schedule_export import build_teacher_workbook
from ..schedule_grid import (
    DEFAULT_DURATION_MINUTES,
    TIME_STARTS,
    grid_meta,
    next_color,
    occupied_starts,
    ranges_overlap,
    slot_payload,
    weekly_hours,
)
from ..schemas import ScheduleSlotIn, ScheduleSlotPut

router = APIRouter(tags=["schedules"])


def _teacher_or_404(db: Session, teacher_id: UUID) -> Profile:
    teacher = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.id == teacher_id, Profile.role == AppRole.teacher)
        .first()
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


def _slot_rows(db: Session, teacher_id: UUID) -> list[WeeklyScheduleSlot]:
    return (
        db.query(WeeklyScheduleSlot)
        .options(joinedload(WeeklyScheduleSlot.student), joinedload(WeeklyScheduleSlot.teacher))
        .filter(WeeklyScheduleSlot.teacher_id == teacher_id)
        .order_by(WeeklyScheduleSlot.weekday, WeeklyScheduleSlot.start_minutes)
        .all()
    )


def _slot_dicts(rows: list[WeeklyScheduleSlot], teacher: Profile) -> list[dict]:
    return [slot_payload(row, row.student, teacher) for row in rows]


def _students_for_teacher(db: Session, teacher_id: UUID) -> list[dict]:
    teacher = db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == teacher_id).first()
    teacher_payload = (
        profile_to_dict(teacher, teacher.user.email if teacher and teacher.user else None) if teacher else None
    )
    rows = (
        db.query(Student)
        .filter(Student.teacher_id == teacher_id)
        .order_by(Student.full_name)
        .all()
    )
    return [
        {
            "id": str(row.id),
            "teacher_id": str(row.teacher_id) if row.teacher_id else None,
            "full_name": row.full_name,
            "teacher": teacher_payload,
        }
        for row in rows
    ]


def _color_for_student(existing: list[dict], student_id: str, requested: str | None) -> str:
    if requested:
        return requested
    used = {row["color"] for row in existing}
    for row in existing:
        if row["student_id"] == student_id:
            return row["color"]
    return next_color(used)


def _validate_slot(body: ScheduleSlotIn, db: Session, teacher_id: UUID) -> None:
    try:
        occupied_starts(body.start_minutes, body.duration_minutes or DEFAULT_DURATION_MINUTES)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.teacher_id != teacher_id:
        raise HTTPException(status_code=400, detail="Assign this student to the teacher first")


def _find_overlap(
    slots: list[dict],
    weekday: int,
    start_minutes: int,
    duration_minutes: int,
    ignore_id: str | None = None,
) -> dict | None:
    for row in slots:
        if ignore_id and row["id"] == ignore_id:
            continue
        if row["weekday"] != weekday:
            continue
        if ranges_overlap(start_minutes, duration_minutes, row["start_minutes"], row["duration_minutes"]):
            return row
    return None


def _teacher_summary(db: Session, teacher: Profile) -> dict:
    rows = _slot_rows(db, teacher.id)
    payload = _slot_dicts(rows, teacher)
    student_ids = {row.student_id for row in rows}
    return {
        "teacher_id": str(teacher.id),
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher.user else None),
        "student_count": db.query(Student).filter(Student.teacher_id == teacher.id).count(),
        "scheduled_student_count": len(student_ids),
        "slot_count": len(payload),
        "weekly_hours": weekly_hours(payload),
    }


@router.get("/schedules")
def list_schedules(_: Profile = Depends(require_ops_or_manager), db: Session = Depends(get_db)):
    teachers = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role == AppRole.teacher)
        .order_by(Profile.full_name)
        .all()
    )
    return {
        **grid_meta(),
        "teachers": [_teacher_summary(db, teacher) for teacher in teachers],
    }


@router.get("/schedules/teachers/{teacher_id}")
def get_teacher_schedule(
    teacher_id: UUID,
    _: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    teacher = _teacher_or_404(db, teacher_id)
    rows = _slot_rows(db, teacher.id)
    payload = _slot_dicts(rows, teacher)
    return {
        **grid_meta(),
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher.user else None),
        "students": _students_for_teacher(db, teacher.id),
        "slots": payload,
        "weekly_hours": weekly_hours(payload),
    }


@router.put("/schedules/teachers/{teacher_id}")
def replace_teacher_schedule(
    teacher_id: UUID,
    body: ScheduleSlotPut,
    profile: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    teacher = _teacher_or_404(db, teacher_id)
    drafts: list[dict] = []
    for item in body.slots:
        _validate_slot(item, db, teacher.id)
        duration = item.duration_minutes or DEFAULT_DURATION_MINUTES
        clash = _find_overlap(drafts, item.weekday, item.start_minutes, duration)
        if clash:
            raise HTTPException(
                status_code=409,
                detail=f"That time overlaps {clash['student_name']} on this teacher's chart",
            )
        student_id = str(item.student_id)
        drafts.append(
            {
                "id": None,
                "student_id": student_id,
                "student_name": "",
                "weekday": item.weekday,
                "start_minutes": item.start_minutes,
                "duration_minutes": duration,
                "color": _color_for_student(drafts, student_id, item.color),
            }
        )

    db.query(WeeklyScheduleSlot).filter(WeeklyScheduleSlot.teacher_id == teacher.id).delete(synchronize_session=False)
    saved = []
    for item, draft in zip(body.slots, drafts, strict=True):
        row = WeeklyScheduleSlot(
            teacher_id=teacher.id,
            student_id=item.student_id,
            weekday=item.weekday,
            start_minutes=item.start_minutes,
            duration_minutes=draft["duration_minutes"],
            color=draft["color"],
            created_by=profile.id,
        )
        db.add(row)
        saved.append(row)
    db.commit()
    for row in saved:
        db.refresh(row)
    rows = _slot_rows(db, teacher.id)
    payload = _slot_dicts(rows, teacher)
    return {
        **grid_meta(),
        "teacher": profile_to_dict(teacher, teacher.user.email if teacher.user else None),
        "students": _students_for_teacher(db, teacher.id),
        "slots": payload,
        "weekly_hours": weekly_hours(payload),
    }


@router.post("/schedules/teachers/{teacher_id}/slots", status_code=201)
def add_schedule_slot(
    teacher_id: UUID,
    body: ScheduleSlotIn,
    profile: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    teacher = _teacher_or_404(db, teacher_id)
    _validate_slot(body, db, teacher.id)
    duration = body.duration_minutes or DEFAULT_DURATION_MINUTES
    existing = _slot_dicts(_slot_rows(db, teacher.id), teacher)
    clash = _find_overlap(existing, body.weekday, body.start_minutes, duration)
    if clash:
        raise HTTPException(
            status_code=409,
            detail=f"That time overlaps {clash['student_name']} on this teacher's chart",
        )
    color = _color_for_student(existing, str(body.student_id), body.color)
    row = WeeklyScheduleSlot(
        teacher_id=teacher.id,
        student_id=body.student_id,
        weekday=body.weekday,
        start_minutes=body.start_minutes,
        duration_minutes=duration,
        color=color,
        created_by=profile.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    student = db.query(Student).filter(Student.id == row.student_id).first()
    return slot_payload(row, student, teacher)


@router.delete("/schedules/slots/{slot_id}")
def delete_schedule_slot(
    slot_id: UUID,
    _: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    row = db.query(WeeklyScheduleSlot).filter(WeeklyScheduleSlot.id == slot_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Schedule slot not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/schedules/teachers/{teacher_id}/export.xlsx")
def export_teacher_schedule_xlsx(
    teacher_id: UUID,
    _: Profile = Depends(require_ops_or_manager),
    db: Session = Depends(get_db),
):
    teacher = _teacher_or_404(db, teacher_id)
    payload = _slot_dicts(_slot_rows(db, teacher.id), teacher)
    content = build_teacher_workbook(teacher.full_name or "Teacher", payload, list(TIME_STARTS))
    safe_name = "".join(ch if ch.isalnum() or ch in "._- " else "_" for ch in (teacher.full_name or "teacher"))
    filename = f"{safe_name.strip() or 'teacher'}-weekly.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
