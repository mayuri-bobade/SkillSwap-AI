from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    unread_count = Column(Integer, default=0)


class ConversationUnread(Base):
    __tablename__ = "conversation_unreads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    count = Column(Integer, default=0)

    __table_args__ = (
        {"mysql_engine": "InnoDB"},
    )
