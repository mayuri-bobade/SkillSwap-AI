from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(10), default="text")
    created_at = Column(DateTime, server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    last_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    last_message_at = Column(DateTime, nullable=True)
    hidden_by = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
