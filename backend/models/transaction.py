from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("time_wallets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # earn, spend, refund, bonus, lock, unlock
    status = Column(String(20), default="completed")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
