from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    profile: dict


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileOut(BaseModel):
    id: UUID
    full_name: str
    role: str
    email: str | None = None
    phone: str | None = None
    family_code: str | None = None
    can_access_private_lessons: bool
    can_access_math_grade9: bool
    can_access_math_grade12: bool
    can_access_physics_grade12: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class CreateTeacherRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str


class UpdateTeacherRequest(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    full_name: str | None = None


class CreateOperationsRequest(CreateTeacherRequest):
    pass


class UpdateOperationsRequest(UpdateTeacherRequest):
    pass


class CourseOut(BaseModel):
    id: UUID
    code: str
    title: str
    grade: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class LessonOut(BaseModel):
    id: UUID
    course_id: UUID
    unit_number: int
    theme: str
    grammar: str
    arabic: str = ""
    explanation: str = ""
    visual: list[Any] = []
    objectives: list[Any] = []
    session_flow: list[Any] = []
    common_mistakes: list[Any] = []
    teacher_notes: str = ""
    worksheet: list[Any] = []
    homework: list[Any] = []
    quiz_bank: list[Any] = []
    updated_at: datetime | None = None
    course: CourseOut | None = None

    model_config = {"from_attributes": True}


class LessonUpdate(BaseModel):
    theme: str | None = None
    grammar: str | None = None
    arabic: str | None = None
    explanation: str | None = None
    visual: list[Any] | None = None
    objectives: list[Any] | None = None
    session_flow: list[Any] | None = None
    common_mistakes: list[Any] | None = None
    teacher_notes: str | None = None
    worksheet: list[Any] | None = None
    homework: list[Any] | None = None
    quiz_bank: list[Any] | None = None


class AssignmentOut(BaseModel):
    id: UUID
    teacher_id: UUID
    course_id: UUID
    teacher: ProfileOut | None = None
    course: CourseOut | None = None


class SetAssignmentRequest(BaseModel):
    teacher_id: UUID
    course_id: UUID
    assigned: bool


class SessionCreate(BaseModel):
    model_config = {"extra": "ignore"}

    lesson_id: UUID | None = None
    curriculum: str | None = None
    course_title: str | None = None
    unit_label: str | None = None
    unit_number: int | None = None
    student_id: UUID | None = None
    student_name: str = "Student"
    worksheet_score: float | None = None
    worksheet_total: float | None = None
    quiz_score: float | None = None
    quiz_total: float | None = None
    homework_score: float | None = None
    homework_total: float | None = None
    notes: str = ""
    homework_assigned: str = ""
    session_date: datetime | None = None
    hours: float | None = Field(default=None, ge=0.5, le=24)


class SessionUpdate(BaseModel):
    model_config = {"extra": "ignore"}

    lesson_id: UUID | None = None
    student_id: UUID | None = None
    student_name: str | None = None
    worksheet_score: float | None = None
    worksheet_total: float | None = None
    quiz_score: float | None = None
    quiz_total: float | None = None
    homework_score: float | None = None
    homework_total: float | None = None
    notes: str | None = None
    homework_assigned: str | None = None
    session_date: datetime | None = None
    hours: float | None = Field(default=None, ge=0.5, le=24)


class SessionFeedback(BaseModel):
    feedback: str


class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    teacher_id: UUID | None = None


class StudentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    teacher_id: UUID | None = None


class StudentScoreCreate(BaseModel):
    title: str
    score: float | None = None
    total: float | None = None
    notes: str = ""
    test_date: datetime | None = None


class StudentScoreUpdate(BaseModel):
    title: str | None = None
    score: float | None = None
    total: float | None = None
    notes: str | None = None
    test_date: datetime | None = None


class GradeQuizRequest(BaseModel):
    answers: dict[str, Any] = {}


class FlagRequest(BaseModel):
    enabled: bool


class ParentLoginRequest(BaseModel):
    phone: str | None = None
    family_code: str | None = None
    pin: str = Field(min_length=4, max_length=8)


class ParentCreate(BaseModel):
    full_name: str
    phone: str
    pin: str = Field(min_length=4, max_length=8)
    student_id: UUID | None = None
    relationship: str = "guardian"


class ParentUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    pin: str | None = Field(default=None, min_length=4, max_length=8)


class ParentLinkStudent(BaseModel):
    student_id: UUID
    relationship: str = "guardian"


class ParentCreditGrant(BaseModel):
    amount: int
    source: str = "bonus"
    note: str = ""
    student_id: UUID | None = None


class PayIntentCreate(BaseModel):
    period: str = "monthly"
    method: str = "whatsapp"


class SpotlightUpdate(BaseModel):
    opted_in: bool
    kind: str = "good_parent"
    display_name: str | None = None
    student_id: UUID | None = None
    badge: str | None = None


class PinChange(BaseModel):
    pin: str = Field(min_length=4, max_length=8)


class ComplimentaryGrant(BaseModel):
    reason: str = "منحة إدارية"
    days: int = 30
