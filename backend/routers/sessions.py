from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models.user import User
from models.skill import Skill
from models.session import Session as SessionModel
from models.wallet import TimeWallet
from models.notification import Notification
from schemas.session import SessionCreate, SessionUpdate
from utils.escrow import create_escrow, release_escrow, refund_escrow, cancel_escrow
from middleware.auth import get_current_user
import math
from datetime import datetime

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("")
def create_session(
    data: SessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    teacher = db.query(User).filter(User.id == data.userId).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="User not found")

    skill = db.query(Skill).filter(
        Skill.user_id == data.userId,
        Skill.name == data.skillName,
        Skill.type == "teach",
    ).first()
    if not skill:
        skill = Skill(
            user_id=data.userId,
            name=data.skillName,
            type="teach",
            category="General",
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)

    student_wallet = db.query(TimeWallet).filter(TimeWallet.user_id == user.id).first()
    if not student_wallet or student_wallet.balance < 1:
        raise HTTPException(status_code=400, detail="Insufficient tokens")

    scheduled_at = datetime.fromisoformat(data.scheduledAt.replace("Z", "+00:00")) if isinstance(data.scheduledAt, str) else data.scheduledAt

    session = SessionModel(
        teacher_id=data.userId,
        student_id=user.id,
        skill_id=skill.id,
        scheduled_at=scheduled_at,
        duration=math.ceil(data.duration / 60),
        notes=data.notes or "",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    result = create_escrow(db, student_wallet.id, 1, user.id, session.id)
    session.transaction_id = result["transaction"].id
    db.commit()

    notification = Notification(
        user_id=data.userId,
        type="session_request",
        title="New Session Request",
        message=f"{user.name} wants to learn {data.skillName} from you",
        data_id=session.id,
        model="Session",
    )
    db.add(notification)
    db.commit()

    return {"success": True, "data": _session_dict(session)}


@router.put("/{session_id}/accept")
def accept_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session.status != "pending":
        raise HTTPException(status_code=400, detail="Session cannot be accepted")

    session.status = "accepted"
    db.commit()

    student_wallet = db.query(TimeWallet).filter(TimeWallet.user_id == session.student_id).first()
    if student_wallet:
        student_wallet.locked = max(0, student_wallet.locked - 1)
        student_wallet.total_spent += 1
        db.commit()

        from models.transaction import Transaction
        db.add(Transaction(
            wallet_id=student_wallet.id,
            user_id=session.student_id,
            session_id=session.id,
            amount=1,
            type="spend",
            status="completed",
            description="Spent 1 token for session",
        ))
        db.commit()

    teacher_wallet = db.query(TimeWallet).filter(TimeWallet.user_id == session.teacher_id).first()
    if teacher_wallet:
        teacher_wallet.balance += 1
        teacher_wallet.total_earned += 1
        db.commit()

        from models.transaction import Transaction
        db.add(Transaction(
            wallet_id=teacher_wallet.id,
            user_id=session.teacher_id,
            session_id=session.id,
            amount=1,
            type="earn",
            status="completed",
            description="Earned 1 token for teaching",
        ))
        db.commit()

    notification = Notification(
        user_id=session.student_id,
        type="session_accepted",
        title="Session Accepted",
        message="Your session request has been accepted",
        data_id=session.id,
        model="Session",
    )
    db.add(notification)
    db.commit()

    db.add(Notification(
        user_id=session.teacher_id,
        type="token_earned",
        title="Tokens Earned",
        message="You earned 1 token for accepting a session",
        data_id=session.id,
        model="Session",
    ))
    db.commit()

    return {"success": True, "data": _session_dict(session)}


@router.put("/{session_id}/reject")
def reject_session(
    session_id: int,
    data: SessionUpdate = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session.status != "pending":
        raise HTTPException(status_code=400, detail="Session cannot be rejected")

    student_wallet = db.query(TimeWallet).filter(TimeWallet.user_id == session.student_id).first()
    cancel_escrow(db, student_wallet.id, 1, session.student_id, session.id)

    session.status = "cancelled"
    session.cancelled_by_id = user.id
    session.cancel_reason = (data.reason if data else "") or "Rejected by teacher"
    db.commit()

    notification = Notification(
        user_id=session.student_id,
        type="system",
        title="Session Rejected",
        message="Your session request has been rejected. Tokens have been refunded.",
        data_id=session.id,
        model="Session",
    )
    db.add(notification)
    db.commit()

    return {"success": True, "data": _session_dict(session)}


@router.put("/{session_id}/cancel")
def cancel_session(
    session_id: int,
    data: SessionUpdate = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != user.id and session.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session.status not in ("pending", "accepted"):
        raise HTTPException(status_code=400, detail="Session cannot be cancelled")

    hours_until = (session.scheduled_at - datetime.utcnow()).total_seconds() / 3600
    student_wallet = db.query(TimeWallet).filter(TimeWallet.user_id == session.student_id).first()

    if hours_until > 24:
        refund_escrow(db, student_wallet.id, 1, session.student_id, session.id)
    else:
        cancel_escrow(db, student_wallet.id, 1, session.student_id, session.id)

    session.status = "cancelled"
    session.cancelled_by_id = user.id
    session.cancel_reason = (data.reason if data else "") or "Cancelled by user"
    db.commit()

    notify_user = session.student_id if session.teacher_id == user.id else session.teacher_id
    notification = Notification(
        user_id=notify_user,
        type="system",
        title="Session Cancelled",
        message=f"Session has been cancelled. {'Tokens refunded.' if hours_until > 24 else 'Tokens released.'}",
        data_id=session.id,
        model="Session",
    )
    db.add(notification)
    db.commit()

    return {"success": True, "data": _session_dict(session)}


@router.put("/{session_id}/complete")
def complete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.teacher_id != user.id and session.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if session.status not in ("accepted", "ongoing"):
        raise HTTPException(status_code=400, detail="Session cannot be completed")

    is_teacher = session.teacher_id == user.id

    if is_teacher and session.teacher_confirmed:
        return {"success": True, "data": _session_dict(session)}
    if not is_teacher and session.student_confirmed:
        return {"success": True, "data": _session_dict(session)}

    if is_teacher:
        session.teacher_confirmed = True
    else:
        session.student_confirmed = True
    db.commit()

    if session.teacher_confirmed and session.student_confirmed:
        session.status = "completed"
        db.commit()

        teacher = db.query(User).filter(User.id == session.teacher_id).first()
        teacher.sessions_completed += 1
        teacher.skills_taught = (teacher.skills_taught or 0) + 1
        student = db.query(User).filter(User.id == session.student_id).first()
        student.sessions_completed += 1
        student.skills_learned = (student.skills_learned or 0) + 1
        db.commit()

        db.add(Notification(
            user_id=session.student_id,
            type="session_completed",
            title="Session Completed",
            message="Your session has been completed",
            data_id=session.id,
            model="Session",
        ))
        db.commit()

    return {"success": True, "data": _session_dict(session)}


@router.get("/my")
def get_my_sessions(
    type: str = Query(None),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    query = db.query(SessionModel)

    if type == "teaching":
        query = query.filter(SessionModel.teacher_id == user.id)
    elif type == "learning":
        query = query.filter(SessionModel.student_id == user.id)
    else:
        query = query.filter(
            (SessionModel.teacher_id == user.id) | (SessionModel.student_id == user.id)
        )

    if status:
        if status == "upcoming":
            query = query.filter(SessionModel.status.in_(["accepted", "ongoing"]))
        elif status == "completed":
            query = query.filter(SessionModel.status.in_(["completed", "cancelled"]))
        else:
            query = query.filter(SessionModel.status == status)

    total = query.count()
    sessions = query.order_by(SessionModel.scheduled_at.desc()).offset(skip).limit(limit).all()

    result = []
    for s in sessions:
        d = _session_dict(s)
        teacher = db.query(User).filter(User.id == s.teacher_id).first()
        student = db.query(User).filter(User.id == s.student_id).first()
        skill = db.query(Skill).filter(Skill.id == s.skill_id).first()
        d["teacher"] = {"id": teacher.id, "_id": teacher.id, "name": teacher.name, "avatar": teacher.avatar or ""} if teacher else None
        d["student"] = {"id": student.id, "_id": student.id, "name": student.name, "avatar": student.avatar or ""} if student else None
        d["skill"] = {"name": skill.name, "category": skill.category} if skill else None
        result.append(d)

    return {
        "success": True,
        "data": {
            "sessions": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/{session_id}")
def get_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    d = _session_dict(session)
    teacher = db.query(User).filter(User.id == session.teacher_id).first()
    student = db.query(User).filter(User.id == session.student_id).first()
    skill = db.query(Skill).filter(Skill.id == session.skill_id).first()
    d["teacher"] = {
        "id": teacher.id,
        "_id": teacher.id,
        "name": teacher.name,
        "avatar": teacher.avatar or "",
        "rating": teacher.rating or 0,
    } if teacher else None
    d["student"] = {
        "id": student.id,
        "_id": student.id,
        "name": student.name,
        "avatar": student.avatar or "",
        "rating": student.rating or 0,
    } if student else None
    d["skill"] = {
        "name": skill.name,
        "category": skill.category,
        "level": skill.level,
    } if skill else None

    return {"success": True, "data": d}


def _session_dict(s: SessionModel) -> dict:
    return {
        "id": s.id,
        "_id": s.id,
        "teacher": s.teacher_id,
        "student": s.student_id,
        "skill": s.skill_id,
        "teacher_id": s.teacher_id,
        "student_id": s.student_id,
        "skill_id": s.skill_id,
        "scheduledAt": s.scheduled_at.isoformat() if s.scheduled_at else None,
        "duration": s.duration,
        "status": s.status,
        "teacherConfirmed": s.teacher_confirmed,
        "studentConfirmed": s.student_confirmed,
        "notes": s.notes,
        "meetingLink": s.meeting_link,
        "transactionId": s.transaction_id,
        "cancelledBy": s.cancelled_by_id,
        "cancelReason": s.cancel_reason,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }
