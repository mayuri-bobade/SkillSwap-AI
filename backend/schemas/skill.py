from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = "General"
    description: Optional[str] = ""
    level: Optional[str] = "beginner"
    type: str
    yearsOfExperience: Optional[int] = 0


class SkillOut(BaseModel):
    id: int
    user_id: int
    name: str
    category: str = "General"
    description: str = ""
    level: str = "beginner"
    type: str
    years_of_experience: int = 0
    is_approved: bool = True

    class Config:
        from_attributes = True


class SkillCategoryGroup(BaseModel):
    _id: str
    skills: list
