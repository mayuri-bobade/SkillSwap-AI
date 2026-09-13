from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    data_id: Optional[int] = None
    model: Optional[str] = None
    read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list
    pagination: dict


class UnreadCountResponse(BaseModel):
    count: int
