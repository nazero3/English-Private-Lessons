from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_profile, require_lesson_access, teacher_has_course
from ..models import AppRole, Course, Lesson, Profile
from ..review_quiz import build_safe_review_quiz_payload, grade_review_quiz
from ..schemas import GradeQuizRequest, LessonOut, LessonUpdate

router = APIRouter(tags=["courses"])


def _course_dict(course: Course) -> dict:
    return {
        "id": str(course.id),
        "code": course.code,
        "title": course.title,
        "grade": course.grade,
        "created_at": course.created_at.isoformat() if course.created_at else None,
    }


def _lesson_dict(lesson: Lesson, course: Course | None = None) -> dict:
    return {
        "id": str(lesson.id),
        "course_id": str(lesson.course_id),
        "unit_number": lesson.unit_number,
        "theme": lesson.theme,
        "grammar": lesson.grammar,
        "arabic": lesson.arabic,
        "explanation": lesson.explanation,
        "visual": lesson.visual or [],
        "objectives": lesson.objectives or [],
        "session_flow": lesson.session_flow or [],
        "common_mistakes": lesson.common_mistakes or [],
        "teacher_notes": lesson.teacher_notes,
        "worksheet": lesson.worksheet or [],
        "homework": lesson.homework or [],
        "quiz_bank": lesson.quiz_bank or [],
        "updated_at": lesson.updated_at.isoformat() if lesson.updated_at else None,
        "course": _course_dict(course) if course else None,
    }


@router.get("/courses")
def list_courses(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    if profile.role in (AppRole.student, AppRole.parent, AppRole.operations):
        raise HTTPException(status_code=403, detail="Course access is for teachers and managers")
    if profile.role == AppRole.manager:
        courses = db.query(Course).order_by(Course.grade).all()
    else:
        from ..models import TeacherCourseAssignment

        assigned_ids = [
            a.course_id
            for a in db.query(TeacherCourseAssignment)
            .filter(TeacherCourseAssignment.teacher_id == profile.id)
            .all()
        ]
        courses = db.query(Course).filter(Course.id.in_(assigned_ids)).order_by(Course.grade).all()
    return [_course_dict(c) for c in courses]


@router.get("/courses/{course_id}/lessons")
def list_lessons(course_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    _ensure_course_access(db, profile, course_id)
    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.unit_number)
        .all()
    )
    return [_lesson_dict(l) for l in lessons]


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    _ensure_course_access(db, profile, lesson.course_id)
    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    return _lesson_dict(lesson, course)


@router.patch("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: UUID,
    body: LessonUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    if profile.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Manager access required")
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    return _lesson_dict(lesson, course)


@router.get("/lessons/{lesson_id}/review-quiz")
def get_review_quiz(lesson_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    _ensure_course_access(db, profile, lesson.course_id)
    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    related = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).all()
    current = _lesson_dict(lesson)
    related_dicts = [_lesson_dict(l) for l in related]
    try:
        payload = build_safe_review_quiz_payload(current, related_dicts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    payload["course"] = _course_dict(course) if course else None
    return payload


@router.post("/lessons/{lesson_id}/review-quiz/grade")
def grade_quiz(
    lesson_id: UUID,
    body: GradeQuizRequest,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    _ensure_course_access(db, profile, lesson.course_id)
    related = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).all()
    current = _lesson_dict(lesson)
    related_dicts = [_lesson_dict(l) for l in related]
    try:
        return grade_review_quiz(current, related_dicts, body.answers)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _ensure_course_access(db: Session, profile: Profile, course_id: UUID) -> None:
    if profile.role in (AppRole.student, AppRole.parent, AppRole.operations):
        raise HTTPException(status_code=403, detail="Course access is for teachers and managers")
    if profile.role == AppRole.manager:
        return
    if not teacher_has_course(db, profile.id, course_id):
        raise HTTPException(status_code=403, detail="Course not assigned")
