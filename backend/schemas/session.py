from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class SessionCreate(BaseModel):
    userId: int
    skillName: str
    scheduledAt: str
    duration: int
    notes: Optional[str] = ""


class SessionUpdate(BaseModel):
    reason: Optional[str] = ""


class SessionOut(BaseModel):
    id: int
    teacher_id: int
    student_id: int
    skill_id: int
    scheduled_at: datetime
    duration: int
    status: str = "pending"
    teacher_confirmed: bool = False
    student_confirmed: bool = False
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    transaction_id: Optional[int] = None
    cancelled_by_id: Optional[int] = None
    cancel_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list
    pagination: dict
