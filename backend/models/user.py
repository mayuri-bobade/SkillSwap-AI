from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=True)
    avatar = Column(String(500), default="")
    bio = Column(Text, default="")
    role = Column(String(20), default="user")
    experience = Column(String(20), default="beginner")
    availability = Column(JSON, default=list)
    rating = Column(Float, default=0)
    total_ratings = Column(Integer, default=0)
    sessions_completed = Column(Integer, default=0)
    skills_taught = Column(Integer, default=0)
    skills_learned = Column(Integer, default=0)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    google_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
