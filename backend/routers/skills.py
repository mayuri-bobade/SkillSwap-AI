from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.skill import Skill
from schemas.skill import SkillCreate
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.post("")
def add_skill(
    data: SkillCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = Skill(
        user_id=user.id,
        name=data.name,
        category=data.category or "General",
        description=data.description or "",
        level=data.level or "beginner",
        type=data.type,
        years_of_experience=data.yearsOfExperience or 0,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"success": True, "data": _skill_dict(skill)}


@router.delete("/{skill_id}")
def remove_skill(
    skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == user.id, Skill.is_active == True).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.is_active = False
    db.commit()
    return {"success": True, "data": {}}


@router.get("/my")
def get_my_skills(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).filter(Skill.user_id == user.id, Skill.is_active == True).all()
    return {"success": True, "data": [_skill_dict(s) for s in skills]}


@router.get("/categories")
def get_skills_by_category(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).filter(Skill.is_approved == True, Skill.is_active == True).all()

    categories = {}
    for skill in skills:
        cat = skill.category or "General"
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({
            "_id": skill.id,
            "name": skill.name,
            "description": skill.description or "",
            "level": skill.level or "beginner",
            "type": skill.type,
            "user": skill.user_id,
        })

    result = [{"_id": cat, "skills": skls} for cat, skls in sorted(categories.items())]
    return {"success": True, "data": result}


@router.get("/{skill_id}")
def get_skill_by_id(
    skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.is_active == True).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"success": True, "data": _skill_dict(skill)}


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
