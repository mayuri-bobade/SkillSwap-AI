from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    sessionId: int
    rating: int
    comment: Optional[str] = ""


class ReviewOut(BaseModel):
    id: int
    session_id: int
    reviewer_id: int
    reviewee_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    reviews: list
    pagination: dict


class MyReviewsResponse(BaseModel):
    given: list
    received: list
