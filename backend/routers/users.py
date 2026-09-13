from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.skill import Skill
from schemas.user import UserUpdate, UserOut
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search")
def search_users(
    skill: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    query = db.query(User).filter(User.id != user.id, User.role != "admin")

    if skill:
        skill_user_ids = (
            db.query(Skill.user_id)
            .filter(
                Skill.name.ilike(f"%{skill}%"),
                Skill.type == "teach",
                Skill.is_approved == True,
            )
            .subquery()
        )
        query = query.filter(User.id.in_(skill_user_ids))

    total = query.count()
    users = query.order_by(User.rating.desc()).offset(skip).limit(limit).all()

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


@router.get("/profile")
def get_my_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).filter(Skill.user_id == user.id).all()
    return {
        "success": True,
        "data": _user_dict(user),
    }


@router.put("/profile")
def update_user_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        user.name = data.name
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar is not None:
        user.avatar = data.avatar
    if data.experience is not None:
        user.experience = data.experience
    if data.availability is not None:
        user.availability = data.availability
    db.commit()
    db.refresh(user)
    return {"success": True, "data": _user_dict(user)}


@router.get("/{user_id}")
def get_user_profile(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    skills = db.query(Skill).filter(Skill.user_id == user_id, Skill.is_active == True).all()
    skills_teach = [_skill_dict(s) for s in skills if s.type == "teach"]
    skills_learn = [_skill_dict(s) for s in skills if s.type == "learn"]

    user_data = _user_dict(target_user)
    user_data["skillsTeach"] = skills_teach
    user_data["skillsLearn"] = skills_learn

    return {
        "success": True,
        "data": {
            "user": user_data,
            "skills": [_skill_dict(s) for s in skills],
        },
    }


@router.get("/{user_id}/skills")
def get_user_skills(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).filter(Skill.user_id == user_id, Skill.is_active == True).all()
    return {"success": True, "data": [_skill_dict(s) for s in skills]}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "_id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar or "",
        "bio": user.bio or "",
        "role": user.role or "user",
        "experience": user.experience or "beginner",
        "availability": user.availability or [],
        "rating": user.rating or 0,
        "totalRatings": user.total_ratings or 0,
        "sessionsCompleted": user.sessions_completed or 0,
        "skillsTaught": user.skills_taught or 0,
        "skillsLearned": user.skills_learned or 0,
        "isOnline": user.is_online or False,
        "lastSeen": user.last_seen.isoformat() if user.last_seen else None,
        "googleId": user.google_id,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def _skill_dict(skill: Skill) -> dict:
    return {
        "id": skill.id,
        "_id": skill.id,
        "user": skill.user_id,
        "user_id": skill.user_id,
        "name": skill.name,
        "category": skill.category or "General",
        "description": skill.description or "",
        "level": skill.level or "beginner",
        "type": skill.type,
        "yearsOfExperience": skill.years_of_experience or 0,
        "isApproved": skill.is_approved,
    }
