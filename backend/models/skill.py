from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255), default="General")
    description = Column(Text, default="")
    level = Column(String(20), default="beginner")
    type = Column(String(10), nullable=False)  # teach or learn
    years_of_experience = Column(Integer, default=0)
    is_approved = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
