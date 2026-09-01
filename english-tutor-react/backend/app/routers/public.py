from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, Prize, PublicSpotlight

router = APIRouter(tags=["public"])


def _spotlight_public(row: PublicSpotlight) -> dict:
    return {
        "id": str(row.id),
        "kind": row.kind,
        "display_name": row.display_name,
        "badge": row.badge or "",
        "tier": row.tier or "",
    }


@router.get("/public/luminate")
def luminate(db: Session = Depends(get_db)):
    activities = (
        db.query(Activity)
        .filter(Activity.active.is_(True))
        .order_by(Activity.sort_order, Activity.starts_at)
        .all()
    )
    prizes = (
        db.query(Prize)
        .filter(Prize.active.is_(True))
        .order_by(Prize.sort_order, Prize.credit_cost)
        .all()
    )
    spots = (
        db.query(PublicSpotlight)
        .filter(PublicSpotlight.opted_in.is_(True))
        .order_by(PublicSpotlight.sort_order, PublicSpotlight.created_at.desc())
        .all()
    )
    vip = [_spotlight_public(s) for s in spots if s.kind == "vip_parent"]
    students = [_spotlight_public(s) for s in spots if s.kind == "best_student"]
    parents = [_spotlight_public(s) for s in spots if s.kind == "good_parent"]
    return {
        "activities": [
            {
                "id": str(a.id),
                "title": a.title,
                "description": a.description or "",
                "starts_at": a.starts_at.isoformat() if a.starts_at else None,
                "location": a.location or "",
            }
            for a in activities
        ],
        "prizes": [
            {
                "id": str(p.id),
                "title": p.title,
                "description": p.description or "",
                "credit_cost": int(p.credit_cost),
            }
            for p in prizes
        ],
        "vip_parents": vip,
        "best_students": students,
        "good_parents": parents,
        "copy": {
            "complimentary": "عضوية عائلة كينز مجاناً مع كل كورس",
        },
    }
