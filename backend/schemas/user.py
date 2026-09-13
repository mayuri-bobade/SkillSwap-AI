from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    token: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[List[dict]] = None


class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: str = ""
    bio: str = ""
    role: str = "user"
    experience: str = "beginner"
    availability: Any = []
    rating: float = 0
    total_ratings: int = 0
    sessions_completed: int = 0
    skills_taught: int = 0
    skills_learned: int = 0
    is_online: bool = False
    last_seen: Optional[datetime] = None
    google_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class UserSearchResult(BaseModel):
    users: List[UserOut]
    pagination: dict


class UserProfileResponse(BaseModel):
    user: Any
    skills: List[Any]
