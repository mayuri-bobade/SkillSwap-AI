from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    participantId: int


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    type: str = "text"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    last_message_id: Optional[int] = None
    last_message_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: list
    pagination: dict
