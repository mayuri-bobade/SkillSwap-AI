from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    skill_name = Column(String(255), nullable=False)
    claimed_level = Column(String(20), nullable=False)
    verified_level = Column(String(20), nullable=True)
    score = Column(Float, default=0)
    verification_status = Column(String(20), default="pending")  # pending, verified, partial, failed
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=list)
    ai_feedback = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
