from sqlalchemy import Column, Integer, Float, ForeignKey
from database import Base


class TimeWallet(Base):
    __tablename__ = "time_wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Float, default=5)
    total_earned = Column(Float, default=0)
    total_spent = Column(Float, default=0)
    locked = Column(Float, default=0)
