from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False, default=1)
    status = Column(String(20), default="pending")
    teacher_confirmed = Column(Boolean, default=False)
    student_confirmed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    meeting_link = Column(String(500), nullable=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    cancelled_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancel_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
