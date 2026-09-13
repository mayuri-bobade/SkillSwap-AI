from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
