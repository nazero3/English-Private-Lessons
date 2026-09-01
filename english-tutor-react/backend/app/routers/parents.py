from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import hash_password, profile_to_dict
from ..database import get_db
from ..deps import require_parent, require_staff
from ..family import (
    CREDIT_REFERRAL,
    award_credit,
    award_weekly_checkin,
    current_membership,
    ensure_membership,
    ensure_subscription,
    ledger_dict,
    parent_public_name,
    payment_dict,
    prize_dict,
    redemption_dict,
    students_for_parent,
    subscription_allows_app,
    subscription_dict,
    wallet_balance,
    wallet_payload,
)
from ..models import (
    AppRole,
    ParentStudent,
    PaymentIntent,
    Prize,
    PrizeRedemption,
    Profile,
    PublicSpotlight,
    Student,
    Subscription,
    User,
)
from ..phone import display_phone, normalize_syrian_phone
from ..routers.students import _portal_payload, _staff_can_manage
from ..schemas import (
    ComplimentaryGrant,
    ParentCreate,
    ParentCreditGrant,
    ParentLinkStudent,
    ParentUpdate,
    PayIntentCreate,
    PinChange,
    SpotlightUpdate,
)

WHATSAPP_NUMBER = "963983888184"
MONTHLY_PRICE = 25000
TERM_PRICE = 60000

router = APIRouter(tags=["family"])


def _family_code() -> str:
    return f"KF{uuid4().hex[:6].upper()}"


def _parent_dict(db: Session, profile: Profile) -> dict:
    user = db.query(User).filter(User.id == profile.id).first()
    links = students_for_parent(db, profile.id)
    data = profile_to_dict(profile)
    data["phone_display"] = display_phone(user.phone if user else None)
    data["children"] = [
        {
            "student_id": str(student.id),
            "full_name": student.full_name,
            "relationship": link.relationship,
            "teacher_id": str(student.teacher_id),
        }
        for student, link in links
    ]
    data["wallet"] = wallet_payload(db, profile.id)
    data["subscription"] = subscription_dict(ensure_subscription(db, profile.id))
    return data


def _get_parent_profile(db: Session, parent_id: UUID) -> Profile:
    profile = db.query(Profile).options(joinedload(Profile.user)).filter(Profile.id == parent_id).first()
    if not profile or profile.role != AppRole.parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return profile


def _staff_can_see_parent(db: Session, staff: Profile, parent: Profile) -> bool:
    if staff.role == AppRole.manager:
        return True
    for student, _link in students_for_parent(db, parent.id):
        if student.teacher_id == staff.id:
            return True
    return False


def _whatsapp_pay_url(invoice_id: UUID, phone: str | None, period: str) -> str:
    text = (
        f"مرحباً، أريد تسديد اشتراك عائلة كينز. "
        f"الفاتورة: {invoice_id}. الفترة: {period}. رقم الأهل: {phone or '-'}"
    )
    from urllib.parse import quote

    return f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(text)}"


@router.get("/parents")
def list_parents(staff: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    rows = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.role == AppRole.parent)
        .order_by(Profile.full_name)
        .all()
    )
    out = []
    for profile in rows:
        if not _staff_can_see_parent(db, staff, profile):
            continue
        ensure_subscription(db, profile.id)
        ensure_membership(db, profile.id)
        out.append(_parent_dict(db, profile))
    db.commit()
    return out


@router.post("/parents", status_code=201)
def create_parent(body: ParentCreate, staff: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    try:
        phone = normalize_syrian_phone(body.phone)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="هذا الرقم مسجّل مسبقاً")
    name = body.full_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="الاسم مطلوب")
    pin = body.pin.strip()
    if not pin.isdigit():
        raise HTTPException(status_code=400, detail="رمز الدخول يجب أن يكون أرقاماً")

    student = None
    if body.student_id:
        student = db.query(Student).filter(Student.id == body.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        if not _staff_can_manage(staff, student):
            raise HTTPException(status_code=403, detail="Not your student")

    user_id = uuid4()
    db.add(
        User(
            id=user_id,
            email=None,
            phone=phone,
            family_code=_family_code(),
            password_hash=hash_password(pin),
        )
    )
    db.add(Profile(id=user_id, full_name=name, role=AppRole.parent))
    db.flush()
    if student:
        db.add(
            ParentStudent(
                parent_id=user_id,
                student_id=student.id,
                relationship=body.relationship or "guardian",
            )
        )
    db.commit()
    return _parent_dict(db, _get_parent_profile(db, user_id))


@router.get("/parents/{parent_id}")
def get_parent(parent_id: UUID, staff: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    profile = _get_parent_profile(db, parent_id)
    if not _staff_can_see_parent(db, staff, profile):
        raise HTTPException(status_code=403, detail="Not your family")
    ensure_subscription(db, profile.id)
    ensure_membership(db, profile.id)
    db.commit()
    return _parent_dict(db, profile)


@router.patch("/parents/{parent_id}")
def update_parent(
    parent_id: UUID,
    body: ParentUpdate,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    profile = _get_parent_profile(db, parent_id)
    if not _staff_can_see_parent(db, staff, profile):
        raise HTTPException(status_code=403, detail="Not your family")
    user = db.query(User).filter(User.id == profile.id).first()
    if body.full_name is not None:
        name = body.full_name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="الاسم مطلوب")
        profile.full_name = name
    if body.phone is not None:
        try:
            phone = normalize_syrian_phone(body.phone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        taken = db.query(User).filter(User.phone == phone, User.id != user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="هذا الرقم مسجّل مسبقاً")
        user.phone = phone
    if body.pin:
        if not body.pin.strip().isdigit():
            raise HTTPException(status_code=400, detail="رمز الدخول يجب أن يكون أرقاماً")
        user.password_hash = hash_password(body.pin.strip())
    db.commit()
    return _parent_dict(db, profile)


@router.post("/parents/{parent_id}/students")
def link_student(
    parent_id: UUID,
    body: ParentLinkStudent,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    profile = _get_parent_profile(db, parent_id)
    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if not _staff_can_manage(staff, student):
        raise HTTPException(status_code=403, detail="Not your student")
    if staff.role != AppRole.manager and not _staff_can_see_parent(db, staff, profile):
        # teachers may link their own students to a new/existing parent
        pass
    exists = (
        db.query(ParentStudent)
        .filter(ParentStudent.parent_id == parent_id, ParentStudent.student_id == student.id)
        .first()
    )
    if exists:
        exists.relationship = body.relationship or exists.relationship
    else:
        db.add(
            ParentStudent(
                parent_id=parent_id,
                student_id=student.id,
                relationship=body.relationship or "guardian",
            )
        )
    db.commit()
    return _parent_dict(db, profile)


@router.delete("/parents/{parent_id}/students/{student_id}")
def unlink_student(
    parent_id: UUID,
    student_id: UUID,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    profile = _get_parent_profile(db, parent_id)
    student = db.query(Student).filter(Student.id == student_id).first()
    if student and not _staff_can_manage(staff, student) and staff.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Not your student")
    row = (
        db.query(ParentStudent)
        .filter(ParentStudent.parent_id == parent_id, ParentStudent.student_id == student_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(row)
    db.commit()
    return _parent_dict(db, profile)


@router.post("/parents/{parent_id}/credits")
def grant_credits(
    parent_id: UUID,
    body: ParentCreditGrant,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    profile = _get_parent_profile(db, parent_id)
    if not _staff_can_see_parent(db, staff, profile) and staff.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Not your family")
    amount = int(body.amount)
    if amount == 0:
        raise HTTPException(status_code=400, detail="Amount required")
    source = body.source or "bonus"
    if source == "referral" and amount < 0:
        raise HTTPException(status_code=400, detail="Referral credits must be positive")
    if source == "referral" and amount == 0:
        amount = CREDIT_REFERRAL
    row = award_credit(
        db,
        parent_id=parent_id,
        amount=amount if source != "referral" else (amount or CREDIT_REFERRAL),
        source=source,
        source_key=f"staff:{staff.id}:{uuid4().hex}",
        student_id=body.student_id,
        created_by=staff.id,
        note=body.note or "",
    )
    ensure_membership(db, parent_id)
    db.commit()
    return ledger_dict(row) if row else {"ok": True}


@router.get("/payments")
def list_payments(staff: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    rows = db.query(PaymentIntent).order_by(PaymentIntent.created_at.desc()).all()
    out = []
    for row in rows:
        parent = db.query(Profile).filter(Profile.id == row.parent_id).first()
        if parent and not _staff_can_see_parent(db, staff, parent) and staff.role != AppRole.manager:
            continue
        item = payment_dict(row)
        item["parent"] = profile_to_dict(parent) if parent else None
        out.append(item)
    return out


@router.post("/payments/{payment_id}/confirm")
def confirm_payment(
    payment_id: UUID,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if staff.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Only a manager can confirm payment")
    row = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
    row.status = "confirmed"
    row.confirmed_at = datetime.now(UTC)
    row.confirmed_by = staff.id
    days = 90 if row.period == "term" else 30
    now = datetime.now(UTC)
    db.add(
        Subscription(
            parent_id=row.parent_id,
            status="active",
            period=row.period,
            price=row.amount,
            starts_at=now,
            ends_at=now + timedelta(days=days),
            paid_at=now,
            payment_id=row.id,
        )
    )
    db.commit()
    return payment_dict(row)


@router.post("/parents/{parent_id}/complimentary")
def grant_complimentary(
    parent_id: UUID,
    body: ComplimentaryGrant,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if staff.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Only a manager can grant complimentary access")
    profile = _get_parent_profile(db, parent_id)
    now = datetime.now(UTC)
    db.add(
        Subscription(
            parent_id=profile.id,
            status="complimentary",
            period="grant",
            price=0,
            starts_at=now,
            ends_at=now + timedelta(days=max(1, body.days)),
            complimentary_reason=body.reason or "منحة إدارية",
        )
    )
    db.commit()
    return _parent_dict(db, profile)


@router.get("/prize-requests")
def list_prize_requests(staff: Profile = Depends(require_staff), db: Session = Depends(get_db)):
    rows = db.query(PrizeRedemption).order_by(PrizeRedemption.created_at.desc()).all()
    out = []
    for row in rows:
        parent = db.query(Profile).filter(Profile.id == row.parent_id).first()
        if parent and staff.role != AppRole.manager and not _staff_can_see_parent(db, staff, parent):
            continue
        prize = db.query(Prize).filter(Prize.id == row.prize_id).first()
        item = redemption_dict(row, prize)
        item["parent"] = profile_to_dict(parent) if parent else None
        out.append(item)
    return out


@router.post("/prize-requests/{redemption_id}/fulfill")
def fulfill_prize(
    redemption_id: UUID,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if staff.role != AppRole.manager:
        raise HTTPException(status_code=403, detail="Only a manager can fulfill prizes")
    row = db.query(PrizeRedemption).filter(PrizeRedemption.id == redemption_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    row.status = "fulfilled"
    row.fulfilled_at = datetime.now(UTC)
    row.fulfilled_by = staff.id
    db.commit()
    prize = db.query(Prize).filter(Prize.id == row.prize_id).first()
    return redemption_dict(row, prize)


@router.post("/parents/{parent_id}/spotlight")
def staff_set_spotlight(
    parent_id: UUID,
    body: SpotlightUpdate,
    staff: Profile = Depends(require_staff),
    db: Session = Depends(get_db),
):
    profile = _get_parent_profile(db, parent_id)
    if staff.role != AppRole.manager and not _staff_can_see_parent(db, staff, profile):
        raise HTTPException(status_code=403, detail="Not your family")
    kind = body.kind or "good_parent"
    student_id = body.student_id
    q = db.query(PublicSpotlight).filter(PublicSpotlight.parent_id == parent_id, PublicSpotlight.kind == kind)
    if student_id:
        q = q.filter(PublicSpotlight.student_id == student_id)
    else:
        q = q.filter(PublicSpotlight.student_id.is_(None))
    row = q.first()
    display = (body.display_name or "").strip() or parent_public_name(profile)
    membership = current_membership(db, parent_id)
    if not row:
        row = PublicSpotlight(
            parent_id=parent_id,
            student_id=student_id,
            kind=kind,
            display_name=display,
            badge=body.badge or "",
            tier=membership.tier if membership else "",
            opted_in=body.opted_in,
        )
        db.add(row)
    else:
        row.opted_in = body.opted_in
        row.display_name = display
        if body.badge is not None:
            row.badge = body.badge
        row.tier = membership.tier if membership else row.tier
    db.commit()
    return {
        "id": str(row.id),
        "kind": row.kind,
        "display_name": row.display_name,
        "badge": row.badge,
        "tier": row.tier,
        "opted_in": row.opted_in,
    }


@router.get("/me/family")
def my_family(profile: Profile = Depends(require_parent), db: Session = Depends(get_db)):
    award_weekly_checkin(db, profile.id)
    sub = ensure_subscription(db, profile.id)
    ensure_membership(db, profile.id)
    children = []
    for student, link in students_for_parent(db, profile.id):
        portal = _portal_payload(student, db, include_answers=False)
        portal["relationship"] = link.relationship
        children.append(portal)
    prizes = db.query(Prize).filter(Prize.active.is_(True)).order_by(Prize.sort_order, Prize.title).all()
    redemptions = (
        db.query(PrizeRedemption)
        .filter(PrizeRedemption.parent_id == profile.id)
        .order_by(PrizeRedemption.created_at.desc())
        .all()
    )
    spots = db.query(PublicSpotlight).filter(PublicSpotlight.parent_id == profile.id).all()
    db.commit()
    return {
        "parent": profile_to_dict(profile),
        "phone_display": display_phone(profile.user.phone if profile.user else None),
        "children": children,
        "wallet": wallet_payload(db, profile.id),
        "subscription": subscription_dict(sub),
        "access": subscription_allows_app(sub),
        "prizes": [prize_dict(p) for p in prizes],
        "redemptions": [
            redemption_dict(r, db.query(Prize).filter(Prize.id == r.prize_id).first()) for r in redemptions
        ],
        "spotlights": [
            {
                "id": str(s.id),
                "kind": s.kind,
                "display_name": s.display_name,
                "badge": s.badge,
                "tier": s.tier,
                "opted_in": s.opted_in,
                "student_id": str(s.student_id) if s.student_id else None,
            }
            for s in spots
        ],
    }


@router.get("/me/family/children/{student_id}")
def my_child(
    student_id: UUID,
    profile: Profile = Depends(require_parent),
    db: Session = Depends(get_db),
):
    link = (
        db.query(ParentStudent)
        .filter(ParentStudent.parent_id == profile.id, ParentStudent.student_id == student_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Child not found")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    sub = ensure_subscription(db, profile.id)
    if not subscription_allows_app(sub):
        raise HTTPException(status_code=402, detail="Subscription required")
    portal = _portal_payload(student, db, include_answers=False)
    portal["relationship"] = link.relationship
    return portal


@router.post("/me/family/pin")
def change_pin(body: PinChange, profile: Profile = Depends(require_parent), db: Session = Depends(get_db)):
    pin = body.pin.strip()
    if not pin.isdigit():
        raise HTTPException(status_code=400, detail="رمز الدخول يجب أن يكون أرقاماً")
    user = db.query(User).filter(User.id == profile.id).first()
    user.password_hash = hash_password(pin)
    db.commit()
    return {"ok": True}


@router.post("/me/family/spotlight")
def parent_spotlight(
    body: SpotlightUpdate,
    profile: Profile = Depends(require_parent),
    db: Session = Depends(get_db),
):
    kind = body.kind or "good_parent"
    if kind not in ("good_parent", "vip_parent", "best_student"):
        raise HTTPException(status_code=400, detail="Invalid spotlight kind")
    student_id = body.student_id
    if kind == "best_student":
        if not student_id:
            raise HTTPException(status_code=400, detail="اختر الابن")
        link = (
            db.query(ParentStudent)
            .filter(ParentStudent.parent_id == profile.id, ParentStudent.student_id == student_id)
            .first()
        )
        if not link:
            raise HTTPException(status_code=404, detail="Child not found")
    q = db.query(PublicSpotlight).filter(PublicSpotlight.parent_id == profile.id, PublicSpotlight.kind == kind)
    if student_id:
        q = q.filter(PublicSpotlight.student_id == student_id)
    else:
        q = q.filter(PublicSpotlight.student_id.is_(None))
    row = q.first()
    display = (body.display_name or "").strip()
    if not display:
        if student_id:
            student = db.query(Student).filter(Student.id == student_id).first()
            display = (student.full_name.split()[0] if student and student.full_name else "طالب")
        else:
            display = parent_public_name(profile)
    membership = current_membership(db, profile.id)
    if not row:
        row = PublicSpotlight(
            parent_id=profile.id,
            student_id=student_id,
            kind=kind,
            display_name=display,
            badge=body.badge or "",
            tier=membership.tier if membership else "",
            opted_in=body.opted_in,
        )
        db.add(row)
    else:
        row.opted_in = body.opted_in
        row.display_name = display
        if body.badge is not None:
            row.badge = body.badge
        row.tier = membership.tier if membership else row.tier
    db.commit()
    return {"id": str(row.id), "opted_in": row.opted_in, "kind": row.kind, "display_name": row.display_name}


@router.post("/me/family/prizes/{prize_id}/redeem")
def redeem_prize(
    prize_id: UUID,
    profile: Profile = Depends(require_parent),
    db: Session = Depends(get_db),
):
    sub = ensure_subscription(db, profile.id)
    if not subscription_allows_app(sub):
        raise HTTPException(status_code=402, detail="Subscription required")
    prize = db.query(Prize).filter(Prize.id == prize_id, Prize.active.is_(True)).first()
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    if wallet_balance(db, profile.id) < prize.credit_cost:
        raise HTTPException(status_code=400, detail="رصيد النقاط غير كافٍ")
    pending = (
        db.query(PrizeRedemption)
        .filter(
            PrizeRedemption.parent_id == profile.id,
            PrizeRedemption.prize_id == prize_id,
            PrizeRedemption.status == "pending",
        )
        .first()
    )
    if pending:
        raise HTTPException(status_code=400, detail="لديك طلب قيد التنفيذ لهذه الجائزة")
    award_credit(
        db,
        parent_id=profile.id,
        amount=-int(prize.credit_cost),
        source="redeem",
        source_key=f"redeem:{profile.id}:{prize_id}:{uuid4().hex[:8]}",
        note=prize.title,
    )
    row = PrizeRedemption(parent_id=profile.id, prize_id=prize.id, status="pending")
    db.add(row)
    db.commit()
    db.refresh(row)
    return redemption_dict(row, prize)


@router.post("/me/family/pay-intent")
def create_pay_intent(
    body: PayIntentCreate,
    profile: Profile = Depends(require_parent),
    db: Session = Depends(get_db),
):
    period = body.period if body.period in ("monthly", "term") else "monthly"
    amount = TERM_PRICE if period == "term" else MONTHLY_PRICE
    method = body.method if body.method in ("whatsapp", "cash", "syriatel_cash", "sham_cash") else "whatsapp"
    row = PaymentIntent(
        parent_id=profile.id,
        method=method,
        amount=amount,
        period=period,
        status="pending",
        note="",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    user = db.query(User).filter(User.id == profile.id).first()
    return {
        **payment_dict(row),
        "whatsapp_url": _whatsapp_pay_url(row.id, user.phone if user else None, period),
        "instructions": "حوّل المبلغ عبر كاش أو واتساب ثم أرسل صورة التحويل. الإدارة تؤكد الدفع من لوحة المعلّمين.",
    }
