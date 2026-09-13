from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data_id = Column(Integer, nullable=True)
    model = Column(String(50), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
