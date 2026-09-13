from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.notification import Notification
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    total = db.query(Notification).filter(Notification.user_id == user.id).count()
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "success": True,
        "data": {
            "notifications": [_notification_dict(n) for n in notifications],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/unread")
def get_unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.read == False,
    ).count()
    return {"success": True, "data": {"count": count}}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id,
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()
    db.refresh(notification)

    return {"success": True, "data": _notification_dict(notification)}


@router.put("/read-all")
def mark_all_as_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"success": True, "data": {}}


def _notification_dict(n: Notification) -> dict:
    return {
        "id": n.id,
        "_id": n.id,
        "user": n.user_id,
        "userId": n.user_id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "data": n.data_id,
        "model": n.model,
        "read": n.read,
        "createdAt": n.created_at.isoformat() if n.created_at else None,
    }
