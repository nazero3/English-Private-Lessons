from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from .auth import hash_password
from .config import settings
from .database import SessionLocal, engine
from .models import (
    Activity,
    AppRole,
    Base,
    Course,
    ParentStudent,
    Prize,
    Profile,
    PublicSpotlight,
    Student,
    Subscription,
    TeacherCourseAssignment,
    User,
)

MANAGER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TEACHER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
STUDENT_USER_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
STUDENT_ROSTER_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
PARENT_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
OPS_ID = UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
COURSE_G9 = UUID("11111111-1111-1111-1111-111111111111")
COURSE_G12 = UUID("22222222-2222-2222-2222-222222222222")

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = Path(__file__).resolve().parents[2]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        patch_db_defaults(db)
        ensure_courses(db)
        seed_users(db)
        seed_lessons_if_empty(db)
        ensure_family_catalog(db)
    finally:
        db.close()


def patch_db_defaults(db: Session) -> None:
    """Match Supabase schema: raw SQL inserts omit id and rely on gen_random_uuid()."""
    conn = db.connection()
    try:
        conn.exec_driver_sql("ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student'")
        db.commit()
    except Exception:
        db.rollback()
    conn = db.connection()
    try:
        conn.exec_driver_sql("ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'parent'")
        db.commit()
    except Exception:
        db.rollback()
    conn = db.connection()
    try:
        conn.exec_driver_sql("ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'operations'")
        db.commit()
    except Exception:
        db.rollback()
    conn = db.connection()
    for table in (
        "lessons",
        "teacher_course_assignments",
        "lesson_sessions",
        "students",
        "notifications",
        "student_scores",
        "parent_students",
        "credit_ledger",
        "memberships",
        "subscriptions",
        "payment_intents",
        "public_spotlights",
        "activities",
        "prizes",
        "prize_redemptions",
    ):
        try:
            conn.exec_driver_sql(
                f"ALTER TABLE {table} ALTER COLUMN id SET DEFAULT gen_random_uuid()"
            )
        except Exception:
            db.rollback()
            conn = db.connection()
    conn.exec_driver_sql(
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_access_math_grade12 boolean NOT NULL DEFAULT false"
    )
    conn.exec_driver_sql(
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_access_physics_grade12 boolean NOT NULL DEFAULT false"
    )
    conn.exec_driver_sql(
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL"
    )
    conn.exec_driver_sql(
        "ALTER TABLE lesson_sessions ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL"
    )
    conn.exec_driver_sql(
        "ALTER TABLE lesson_sessions ADD COLUMN IF NOT EXISTS homework_assigned text NOT NULL DEFAULT ''"
    )
    conn.exec_driver_sql(
        "ALTER TABLE lesson_sessions ADD COLUMN IF NOT EXISTS hours numeric(4,2)"
    )
    conn.exec_driver_sql(
        "CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_uidx ON students (user_id) WHERE user_id IS NOT NULL"
    )
    conn.exec_driver_sql("ALTER TABLE users ALTER COLUMN email DROP NOT NULL")
    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text")
    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS family_code text")
    conn.exec_driver_sql(
        "CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uidx ON users (phone) WHERE phone IS NOT NULL"
    )
    conn.exec_driver_sql(
        "CREATE UNIQUE INDEX IF NOT EXISTS users_family_code_uidx ON users (family_code) WHERE family_code IS NOT NULL"
    )
    db.commit()


def ensure_courses(db: Session) -> None:
    """Always ensure the two curriculum courses exist (needed for demo assignment)."""
    rows = [
        (COURSE_G9, "grade_9", "Grade 9 English", "9"),
        (COURSE_G12, "grade_12", "Grade 12 English", "12"),
    ]
    changed = False
    for course_id, code, title, grade in rows:
        if db.query(Course).filter(Course.id == course_id).first():
            continue
        db.add(Course(id=course_id, code=code, title=title, grade=grade))
        changed = True
    if changed:
        db.commit()


def seed_users(db: Session) -> None:
    if not settings.seed_demo_users:
        return
    if not db.query(Profile).filter(Profile.id == MANAGER_ID).first():
        ensure_courses(db)

        db.add(
            User(
                id=MANAGER_ID,
                email="manager@lesson-sheets.app",
                password_hash=hash_password("changeme"),
            )
        )
        db.add(
            User(
                id=TEACHER_ID,
                email="teacher@lesson-sheets.app",
                password_hash=hash_password("changeme"),
            )
        )
        db.add(
            Profile(
                id=MANAGER_ID,
                full_name="Manager",
                role=AppRole.manager,
                can_access_private_lessons=True,
                can_access_math_grade9=True,
                can_access_math_grade12=True,
                can_access_physics_grade12=True,
            )
        )
        db.add(
            Profile(
                id=TEACHER_ID,
                full_name="Teacher",
                role=AppRole.teacher,
                can_access_private_lessons=False,
                can_access_math_grade9=False,
            )
        )
        db.flush()

        if db.query(Course).filter(Course.id == COURSE_G9).first():
            exists = (
                db.query(TeacherCourseAssignment)
                .filter(
                    TeacherCourseAssignment.teacher_id == TEACHER_ID,
                    TeacherCourseAssignment.course_id == COURSE_G9,
                )
                .first()
            )
            if not exists:
                db.add(
                    TeacherCourseAssignment(
                        teacher_id=TEACHER_ID,
                        course_id=COURSE_G9,
                    )
                )

        db.commit()

    ensure_demo_student(db)
    ensure_demo_parent(db)
    ensure_demo_operations(db)
    ensure_family_catalog(db)


def ensure_demo_student(db: Session) -> None:
    if not db.query(Profile).filter(Profile.id == TEACHER_ID).first():
        return
    if db.query(Profile).filter(Profile.id == STUDENT_USER_ID).first():
        return
    if db.query(User).filter(User.email == "student@lesson-sheets.app").first():
        return
    db.add(
        User(
            id=STUDENT_USER_ID,
            email="student@lesson-sheets.app",
            password_hash=hash_password("changeme"),
        )
    )
    db.add(
        Profile(
            id=STUDENT_USER_ID,
            full_name="Demo Student",
            role=AppRole.student,
        )
    )
    db.flush()
    if not db.query(Student).filter(Student.id == STUDENT_ROSTER_ID).first():
        db.add(
            Student(
                id=STUDENT_ROSTER_ID,
                teacher_id=TEACHER_ID,
                user_id=STUDENT_USER_ID,
                full_name="Demo Student",
            )
        )
    db.commit()


def ensure_demo_parent(db: Session) -> None:
    from datetime import UTC, datetime, timedelta

    from .family import award_credit, ensure_membership

    if not db.query(Profile).filter(Profile.id == STUDENT_ROSTER_ID).first() and not db.query(
        Student
    ).filter(Student.id == STUDENT_ROSTER_ID).first():
        return
    if db.query(Profile).filter(Profile.id == PARENT_ID).first():
        ensure_family_catalog(db)
        return
    if db.query(User).filter(User.phone == "+963993000001").first():
        return
    db.add(
        User(
            id=PARENT_ID,
            email=None,
            phone="+963993000001",
            family_code="KFDEMO1",
            password_hash=hash_password("123456"),
        )
    )
    db.add(Profile(id=PARENT_ID, full_name="أم سارة", role=AppRole.parent))
    db.flush()
    if db.query(Student).filter(Student.id == STUDENT_ROSTER_ID).first():
        exists = (
            db.query(ParentStudent)
            .filter(ParentStudent.parent_id == PARENT_ID, ParentStudent.student_id == STUDENT_ROSTER_ID)
            .first()
        )
        if not exists:
            db.add(
                ParentStudent(
                    parent_id=PARENT_ID,
                    student_id=STUDENT_ROSTER_ID,
                    relationship="mother",
                )
            )
    award_credit(
        db,
        parent_id=PARENT_ID,
        amount=120,
        source="bonus",
        source_key="seed:parent-welcome",
        note="رصيد ترحيبي",
    )
    ensure_membership(db, PARENT_ID)
    now = datetime.now(UTC)
    db.add(
        Subscription(
            parent_id=PARENT_ID,
            status="complimentary",
            period="enrolled",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=90),
            complimentary_reason="عضوية مجانية مع كورس كينز",
        )
    )
    db.add(
        PublicSpotlight(
            parent_id=PARENT_ID,
            kind="vip_parent",
            display_name="أم سارة",
            badge="بطاقة برونز",
            tier="bronze",
            opted_in=True,
            sort_order=1,
        )
    )
    db.add(
        PublicSpotlight(
            parent_id=PARENT_ID,
            student_id=STUDENT_ROSTER_ID,
            kind="best_student",
            display_name="سارة",
            badge="نجم الحضور",
            tier="",
            opted_in=True,
            sort_order=1,
        )
    )
    db.add(
        PublicSpotlight(
            parent_id=PARENT_ID,
            kind="good_parent",
            display_name="أم سارة",
            badge="شريك الأسبوع",
            tier="bronze",
            opted_in=True,
            sort_order=1,
        )
    )
    db.commit()


def ensure_demo_operations(db: Session) -> None:
    if db.query(Profile).filter(Profile.id == OPS_ID).first():
        return
    if db.query(User).filter(User.email == "ops@lesson-sheets.app").first():
        return
    db.add(
        User(
            id=OPS_ID,
            email="ops@lesson-sheets.app",
            password_hash=hash_password("changeme"),
        )
    )
    db.add(
        Profile(
            id=OPS_ID,
            full_name="Operations",
            role=AppRole.operations,
        )
    )
    db.commit()


def ensure_family_catalog(db: Session) -> None:
    from datetime import UTC, datetime, timedelta

    if db.query(Prize).count() == 0:
        db.add_all(
            [
                Prize(
                    title="خصم الحصة التالية",
                    description="يُطبَّق في المركز على الباقة القادمة حسب بطاقتك.",
                    credit_cost=80,
                    sort_order=1,
                ),
                Prize(
                    title="حصة تجريبية للأخ/الأخت",
                    description="دعوة أخ أو أخت لحضور حصة تعريفية.",
                    credit_cost=150,
                    sort_order=2,
                ),
                Prize(
                    title="ظهور في كينز تُضيء",
                    description="بطاقة شرف على الصفحة العامة (بدون درجات).",
                    credit_cost=40,
                    sort_order=3,
                ),
                Prize(
                    title="حقيبة كينز",
                    description="هدية رمزية من المركز عند التوفر.",
                    credit_cost=220,
                    sort_order=4,
                ),
            ]
        )
    if db.query(Activity).count() == 0:
        soon = datetime.now(UTC) + timedelta(days=10)
        db.add_all(
            [
                Activity(
                    title="يوم الأهل المفتوح",
                    description="لقاء قصير مع المعلّمين ومتابعة تقدّم الأبناء.",
                    starts_at=soon,
                    location="مركز كينز",
                    sort_order=1,
                ),
                Activity(
                    title="مسابقة المحادثة الإنجليزية",
                    description="تحدٍ ودي للطلاب النشطين — الحضور يمنح نقاطاً للعائلة.",
                    starts_at=soon + timedelta(days=14),
                    location="قاعة كينز",
                    sort_order=2,
                ),
                Activity(
                    title="ورشة مهارات المستقبل",
                    description="جلسة قصيرة في التفكير والثقة قبل الامتحانات.",
                    starts_at=soon + timedelta(days=28),
                    location="أونلاين + المركز",
                    sort_order=3,
                ),
            ]
        )
    db.commit()


def seed_lessons_if_empty(db: Session) -> None:
    from .models import Lesson

    if db.query(Lesson).count() > 0:
        return

    seed_path = BACKEND_DIR / "sql" / "seed_lessons.sql"
    if not seed_path.exists():
        seed_path = PROJECT_DIR / "supabase" / "seed.sql"
    if not seed_path.exists():
        return

    sql = seed_path.read_text(encoding="utf-8")
    # Raw driver SQL — seed file contains JSON with ":" that text() would treat as binds.
    db.connection().exec_driver_sql(sql)
    db.commit()
