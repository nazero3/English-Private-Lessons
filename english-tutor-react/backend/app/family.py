from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import (
    CreditLedger,
    LessonSession,
    Membership,
    ParentStudent,
    PaymentIntent,
    Prize,
    PrizeRedemption,
    Profile,
    Student,
    Subscription,
)

CREDIT_ATTENDANCE = 10
CREDIT_HOMEWORK = 5
CREDIT_CHECKIN = 3
CREDIT_REFERRAL = 50
CREDIT_STREAK = 15

TIER_THRESHOLDS = (("platinum", 1000), ("silver", 400), ("bronze", 100))

TIER_PERKS = {
    "none": {"discount": 0, "label_ar": "بدون بطاقة", "label_en": "None"},
    "bronze": {"discount": 5, "label_ar": "برونز", "label_en": "Bronze"},
    "silver": {"discount": 10, "label_ar": "فضة", "label_en": "Silver"},
    "platinum": {"discount": 15, "label_ar": "بلاتين", "label_en": "Platinum"},
}

SOURCE_LABELS = {
    "attendance": "حضور حصة",
    "homework": "واجب مصحّح",
    "checkin": "زيارة التطبيق",
    "referral": "دعوة صديق",
    "streak": "سلسلة حضور",
    "bonus": "مكافأة",
    "redeem": "استبدال جائزة",
    "adjust": "تعديل",
}

TIER_PREFIX = {"bronze": "BR", "silver": "SV", "platinum": "PT"}


def parents_for_student(db: Session, student_id: UUID) -> list[Profile]:
    links = db.query(ParentStudent).filter(ParentStudent.student_id == student_id).all()
    if not links:
        return []
    ids = [link.parent_id for link in links]
    return db.query(Profile).filter(Profile.id.in_(ids)).all()


def students_for_parent(db: Session, parent_id: UUID) -> list[tuple[Student, ParentStudent]]:
    links = (
        db.query(ParentStudent)
        .filter(ParentStudent.parent_id == parent_id)
        .order_by(ParentStudent.created_at)
        .all()
    )
    out = []
    for link in links:
        student = db.query(Student).filter(Student.id == link.student_id).first()
        if student:
            out.append((student, link))
    return out


def award_credit(
    db: Session,
    *,
    parent_id: UUID,
    amount: int,
    source: str,
    source_key: str,
    student_id: UUID | None = None,
    created_by: UUID | None = None,
    note: str = "",
) -> CreditLedger | None:
    exists = db.query(CreditLedger).filter(CreditLedger.source_key == source_key).first()
    if exists:
        return None
    row = CreditLedger(
        parent_id=parent_id,
        student_id=student_id,
        amount=amount,
        source=source,
        source_key=source_key,
        note=note,
        created_by=created_by,
    )
    db.add(row)
    db.flush()
    return row


def wallet_balance(db: Session, parent_id: UUID) -> int:
    total = (
        db.query(func.coalesce(func.sum(CreditLedger.amount), 0))
        .filter(CreditLedger.parent_id == parent_id)
        .scalar()
    )
    return int(total or 0)


def earned_in_window(db: Session, parent_id: UUID, since: datetime) -> int:
    total = (
        db.query(func.coalesce(func.sum(CreditLedger.amount), 0))
        .filter(
            CreditLedger.parent_id == parent_id,
            CreditLedger.amount > 0,
            CreditLedger.created_at >= since,
        )
        .scalar()
    )
    return int(total or 0)


def tier_for_earned(earned: int) -> str:
    for name, threshold in TIER_THRESHOLDS:
        if earned >= threshold:
            return name
    return "none"


def next_tier_info(earned: int) -> dict:
    order = [("bronze", 100), ("silver", 400), ("platinum", 1000)]
    for name, threshold in order:
        if earned < threshold:
            return {
                "tier": name,
                "needed": threshold - earned,
                "threshold": threshold,
                "label_ar": TIER_PERKS[name]["label_ar"],
            }
    return {"tier": None, "needed": 0, "threshold": 1000, "label_ar": TIER_PERKS["platinum"]["label_ar"]}


def ensure_membership(db: Session, parent_id: UUID) -> Membership | None:
    since = datetime.now(UTC) - timedelta(days=365)
    earned = earned_in_window(db, parent_id, since)
    tier = tier_for_earned(earned)
    current = (
        db.query(Membership)
        .filter(Membership.parent_id == parent_id)
        .order_by(Membership.created_at.desc())
        .first()
    )
    if tier == "none":
        return current
    if current and current.tier == tier:
        return current
    card_number = f"KF-{TIER_PREFIX[tier]}-{uuid4().hex[:6].upper()}"
    row = Membership(
        parent_id=parent_id,
        tier=tier,
        card_number=card_number,
        period_start=since,
        period_end=datetime.now(UTC) + timedelta(days=365),
    )
    db.add(row)
    db.flush()
    return row


def current_membership(db: Session, parent_id: UUID) -> Membership | None:
    return (
        db.query(Membership)
        .filter(Membership.parent_id == parent_id)
        .order_by(Membership.created_at.desc())
        .first()
    )


def on_session_saved(db: Session, session: LessonSession, previous_homework: float | None = None) -> None:
    if not session.student_id:
        return
    parents = parents_for_student(db, session.student_id)
    if not parents:
        return
    for parent in parents:
        award_credit(
            db,
            parent_id=parent.id,
            amount=CREDIT_ATTENDANCE,
            source="attendance",
            source_key=f"session:{session.id}:attendance",
            student_id=session.student_id,
            note="حضور حصة",
        )
        if session.homework_score is not None and previous_homework is None:
            award_credit(
                db,
                parent_id=parent.id,
                amount=CREDIT_HOMEWORK,
                source="homework",
                source_key=f"session:{session.id}:homework",
                student_id=session.student_id,
                note="واجب مصحّح",
            )
        maybe_award_streak(db, parent.id, session.student_id)
        ensure_membership(db, parent.id)


def maybe_award_streak(db: Session, parent_id: UUID, student_id: UUID) -> None:
    now = datetime.now(UTC)
    weeks = []
    for i in range(4):
        start = now - timedelta(days=7 * (i + 1))
        end = now - timedelta(days=7 * i)
        hit = (
            db.query(LessonSession)
            .filter(
                LessonSession.student_id == student_id,
                LessonSession.session_date >= start,
                LessonSession.session_date < end,
            )
            .first()
        )
        weeks.append(bool(hit))
    if not all(weeks):
        return
    iso = now.isocalendar()
    award_credit(
        db,
        parent_id=parent_id,
        amount=CREDIT_STREAK,
        source="streak",
        source_key=f"streak:{student_id}:{iso.year}-W{iso.week}",
        student_id=student_id,
        note="أربع أسابيع حضور متتالية",
    )


def award_weekly_checkin(db: Session, parent_id: UUID) -> CreditLedger | None:
    iso = datetime.now(UTC).isocalendar()
    return award_credit(
        db,
        parent_id=parent_id,
        amount=CREDIT_CHECKIN,
        source="checkin",
        source_key=f"checkin:{parent_id}:{iso.year}-W{iso.week}",
        note="زيارة أسبوعية للتطبيق",
    )


def student_is_enrolled(db: Session, student_id: UUID, days: int = 30) -> bool:
    since = datetime.now(UTC) - timedelta(days=days)
    return (
        db.query(LessonSession)
        .filter(LessonSession.student_id == student_id, LessonSession.session_date >= since)
        .first()
        is not None
    )


def parent_has_enrolled_child(db: Session, parent_id: UUID) -> bool:
    for student, _link in students_for_parent(db, parent_id):
        if student_is_enrolled(db, student.id):
            return True
    return False


def ensure_subscription(db: Session, parent_id: UUID) -> Subscription | None:
    now = datetime.now(UTC)
    current = (
        db.query(Subscription)
        .filter(Subscription.parent_id == parent_id)
        .order_by(Subscription.created_at.desc())
        .first()
    )
    if current and current.ends_at and current.ends_at < now and current.status in ("active", "complimentary"):
        current.status = "expired"
        db.flush()

    if parent_has_enrolled_child(db, parent_id):
        if current and current.status in ("active", "complimentary") and (not current.ends_at or current.ends_at >= now):
            if current.status != "complimentary":
                current.status = "complimentary"
                current.complimentary_reason = "كورس فعّال للابن"
            return current
        row = Subscription(
            parent_id=parent_id,
            status="complimentary",
            period="enrolled",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=30),
            complimentary_reason="عضوية مجانية مع كورس كينز",
        )
        db.add(row)
        db.flush()
        return row

    if current and current.status == "active" and (not current.ends_at or current.ends_at >= now):
        return current
    return current


def subscription_allows_app(sub: Subscription | None) -> bool:
    if not sub:
        return False
    if sub.status not in ("active", "complimentary"):
        return False
    if sub.ends_at and sub.ends_at < datetime.now(UTC):
        return False
    return True


def ledger_rows(db: Session, parent_id: UUID, limit: int = 40) -> list[dict]:
    rows = (
        db.query(CreditLedger)
        .filter(CreditLedger.parent_id == parent_id)
        .order_by(CreditLedger.created_at.desc())
        .limit(limit)
        .all()
    )
    return [ledger_dict(r) for r in rows]


def ledger_dict(row: CreditLedger) -> dict:
    return {
        "id": str(row.id),
        "parent_id": str(row.parent_id),
        "student_id": str(row.student_id) if row.student_id else None,
        "amount": int(row.amount),
        "source": row.source,
        "source_label": SOURCE_LABELS.get(row.source, row.source),
        "source_key": row.source_key,
        "note": row.note or "",
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def membership_dict(row: Membership | None, earned: int) -> dict:
    tier = row.tier if row else tier_for_earned(earned)
    if not row and tier == "none":
        tier = "none"
    perks = TIER_PERKS.get(tier, TIER_PERKS["none"])
    nxt = next_tier_info(earned)
    return {
        "tier": tier,
        "card_number": row.card_number if row else None,
        "discount": perks["discount"],
        "label_ar": perks["label_ar"],
        "earned_12m": earned,
        "next": nxt,
        "period_start": row.period_start.isoformat() if row and row.period_start else None,
        "period_end": row.period_end.isoformat() if row and row.period_end else None,
    }


def subscription_dict(row: Subscription | None) -> dict | None:
    if not row:
        return None
    return {
        "id": str(row.id),
        "status": row.status,
        "period": row.period,
        "price": int(row.price or 0),
        "starts_at": row.starts_at.isoformat() if row.starts_at else None,
        "ends_at": row.ends_at.isoformat() if row.ends_at else None,
        "complimentary_reason": row.complimentary_reason or "",
        "paid_at": row.paid_at.isoformat() if row.paid_at else None,
        "access": subscription_allows_app(row),
    }


def payment_dict(row: PaymentIntent) -> dict:
    return {
        "id": str(row.id),
        "parent_id": str(row.parent_id),
        "method": row.method,
        "amount": int(row.amount or 0),
        "period": row.period,
        "status": row.status,
        "note": row.note or "",
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "confirmed_at": row.confirmed_at.isoformat() if row.confirmed_at else None,
    }


def prize_dict(row: Prize) -> dict:
    return {
        "id": str(row.id),
        "title": row.title,
        "description": row.description or "",
        "credit_cost": int(row.credit_cost),
        "active": row.active,
        "sort_order": row.sort_order,
    }


def redemption_dict(row: PrizeRedemption, prize: Prize | None = None) -> dict:
    return {
        "id": str(row.id),
        "parent_id": str(row.parent_id),
        "prize_id": str(row.prize_id),
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "fulfilled_at": row.fulfilled_at.isoformat() if row.fulfilled_at else None,
        "prize": prize_dict(prize) if prize else None,
    }


def parent_public_name(profile: Profile) -> str:
    name = (profile.full_name or "").strip()
    if not name:
        return "ولي أمر"
    return name.split()[0]


def wallet_payload(db: Session, parent_id: UUID) -> dict:
    since = datetime.now(UTC) - timedelta(days=365)
    earned = earned_in_window(db, parent_id, since)
    ensure_membership(db, parent_id)
    membership = current_membership(db, parent_id)
    return {
        "balance": wallet_balance(db, parent_id),
        "earned_12m": earned,
        "membership": membership_dict(membership, earned),
        "ledger": ledger_rows(db, parent_id),
    }
