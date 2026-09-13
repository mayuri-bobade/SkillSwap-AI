from pydantic import BaseModel
from typing import Optional


class WalletOut(BaseModel):
    id: int
    user_id: int
    balance: float = 5
    total_earned: float = 0
    total_spent: float = 0
    locked: float = 0

    class Config:
        from_attributes = True


class BalanceOut(BaseModel):
    balance: float
    locked: float
    total_earned: float
    total_spent: float


class TransactionOut(BaseModel):
    id: int
    wallet_id: int
    user_id: int
    session_id: Optional[int] = None
    amount: float
    type: str
    status: str = "completed"
    description: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: list
    pagination: dict
