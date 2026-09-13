from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.skill import Skill
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/matching", tags=["matching"])


@router.get("")
def find_matches(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    my_teach_skills = db.query(Skill).filter(
        Skill.user_id == user.id, Skill.type == "teach", Skill.is_approved == True, Skill.is_active == True
    ).all()
    my_learn_skills = db.query(Skill).filter(
        Skill.user_id == user.id, Skill.type == "learn", Skill.is_approved == True, Skill.is_active == True
    ).all()

    teach_skill_names = [s.name.lower() for s in my_teach_skills]
    learn_skill_names = [s.name.lower() for s in my_learn_skills]

    all_users = db.query(User).filter(User.id != user.id, User.role != "admin").limit(50).all()

    matches = []
    experience_levels = ["beginner", "intermediate", "advanced", "expert"]
    my_exp_index = experience_levels.index(user.experience or "beginner")
    my_days = [a.get("day", "") for a in (user.availability or [])]

    for target in all_users:
        target_teach = db.query(Skill).filter(
            Skill.user_id == target.id, Skill.type == "teach", Skill.is_approved == True, Skill.is_active == True
        ).all()
        target_learn = db.query(Skill).filter(
            Skill.user_id == target.id, Skill.type == "learn", Skill.is_approved == True, Skill.is_active == True
        ).all()

        target_teach_names = [s.name.lower() for s in target_teach]
        target_learn_names = [s.name.lower() for s in target_learn]

        skill_overlap_teach = len([s for s in learn_skill_names if s in target_teach_names])
        skill_overlap_learn = len([s for s in teach_skill_names if s in target_learn_names])
        total_overlap = skill_overlap_teach + skill_overlap_learn
        max_overlap = max(len(learn_skill_names) + len(teach_skill_names), 1)
        skill_score = (total_overlap / max_overlap) * 40

        target_days = [a.get("day", "") for a in (target.availability or [])]
        day_overlap = len([d for d in my_days if d in target_days])
        max_day = max(len(my_days), len(target_days), 1)
        availability_score = (day_overlap / max_day) * 20

        rating_score = ((target.rating or 0) / 5) * 20

        target_exp_index = experience_levels.index(target.experience or "beginner")
        exp_diff = abs(my_exp_index - target_exp_index)
        experience_score = ((4 - exp_diff) / 4) * 20

        total_score = round(skill_score + availability_score + rating_score + experience_score)

        matched_teach = [s for s in target_teach if s.name.lower() in learn_skill_names]
        matched_learn = [s for s in target_learn if s.name.lower() in teach_skill_names]

        matches.append({
            "user": _user_dict(target),
            "teachSkills": [_skill_dict(s) for s in (matched_teach if matched_teach else target_teach)],
            "learnSkills": [_skill_dict(s) for s in (matched_learn if matched_learn else target_learn)],
            "score": total_score,
            "breakdown": {
                "skillOverlap": round(skill_score),
                "availability": round(availability_score),
                "rating": round(rating_score),
                "experience": round(experience_score),
            },
        })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return {"success": True, "data": matches}


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


def _skill_dict(s: Skill) -> dict:
    return {
        "id": s.id,
        "_id": s.id,
        "user": s.user_id,
        "user_id": s.user_id,
        "name": s.name,
        "category": s.category or "General",
        "description": s.description or "",
        "level": s.level or "beginner",
        "type": s.type,
        "yearsOfExperience": s.years_of_experience or 0,
        "isApproved": s.is_approved,
    }
