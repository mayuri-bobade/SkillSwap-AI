from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.session import Session as SessionModel
from models.skill import Skill
from models.wallet import TimeWallet
from models.transaction import Transaction
from models.report import Report
from middleware.auth import require_admin
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ReportResolve(BaseModel):
    status: Optional[str] = None
    adminNote: Optional[str] = None


@router.get("/users")
def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "data": {
            "users": [_user_dict(u) for u in users],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_online = not target.is_online
    db.commit()
    db.refresh(target)

    return {"success": True, "data": _user_dict(target)}


@router.get("/reports")
def get_reports(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)

    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for r in reports:
        d = _report_dict(r)
        reporter = db.query(User).filter(User.id == r.reporter_id).first()
        reported = db.query(User).filter(User.id == r.reported_user_id).first()
        d["reporter"] = {"name": reporter.name, "email": reporter.email} if reporter else None
        d["reportedUser"] = {"name": reported.name, "email": reported.email} if reported else None
        result.append(d)

    return {
        "success": True,
        "data": {
            "reports": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.put("/reports/{report_id}/resolve")
def resolve_report(
    report_id: int,
    data: ReportResolve,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if data.status:
        report.status = data.status
    if data.adminNote is not None:
        report.admin_note = data.adminNote
    db.commit()
    db.refresh(report)

    return {"success": True, "data": _report_dict(report)}


@router.get("/stats")
def get_stats(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_sessions = db.query(SessionModel).count()
    completed_sessions = db.query(SessionModel).filter(SessionModel.status == "completed").count()

    wallet_stats = db.query(
        func.sum(TimeWallet.balance),
        func.sum(TimeWallet.total_earned),
        func.sum(TimeWallet.total_spent),
    ).first()

    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = db.query(User).filter(User.last_seen >= thirty_days_ago).count()

    return {
        "success": True,
        "data": {
            "totalUsers": total_users,
            "totalSessions": total_sessions,
            "completedSessions": completed_sessions,
            "activeUsers": active_users,
            "totalTokens": float(wallet_stats[0] or 0),
            "totalEarned": float(wallet_stats[1] or 0),
            "totalSpent": float(wallet_stats[2] or 0),
        },
    }


@router.get("/sessions")
def get_all_sessions(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    query = db.query(SessionModel)
    if status:
        query = query.filter(SessionModel.status == status)

    total = query.count()
    sessions = query.order_by(SessionModel.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for s in sessions:
        d = _session_dict(s)
        teacher = db.query(User).filter(User.id == s.teacher_id).first()
        student = db.query(User).filter(User.id == s.student_id).first()
        skill = db.query(Skill).filter(Skill.id == s.skill_id).first()
        d["teacher"] = {"id": teacher.id, "_id": teacher.id, "name": teacher.name, "email": teacher.email} if teacher else None
        d["student"] = {"id": student.id, "_id": student.id, "name": student.name, "email": student.email} if student else None
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


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "_id": u.id,
        "name": u.name,
        "email": u.email,
        "avatar": u.avatar or "",
        "bio": u.bio or "",
        "role": u.role or "user",
        "experience": u.experience or "beginner",
        "availability": u.availability or [],
        "rating": u.rating or 0,
        "totalRatings": u.total_ratings or 0,
        "sessionsCompleted": u.sessions_completed or 0,
        "skillsTaught": u.skills_taught or 0,
        "skillsLearned": u.skills_learned or 0,
        "isOnline": u.is_online or False,
        "lastSeen": u.last_seen.isoformat() if u.last_seen else None,
        "googleId": u.google_id,
        "createdAt": u.created_at.isoformat() if u.created_at else None,
    }


def _session_dict(s) -> dict:
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
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }


def _report_dict(r) -> dict:
    return {
        "id": r.id,
        "reporter_id": r.reporter_id,
        "reportedUserId": r.reported_user_id,
        "session_id": r.session_id,
        "reason": r.reason,
        "description": r.description,
        "status": r.status,
        "adminNote": r.admin_note,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    }
