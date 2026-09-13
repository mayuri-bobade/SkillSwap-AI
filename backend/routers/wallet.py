from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.wallet import TimeWallet
from models.transaction import Transaction
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("")
def get_wallet(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(TimeWallet).filter(TimeWallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"success": True, "data": _wallet_dict(wallet)}


@router.get("/balance")
def get_balance(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(TimeWallet).filter(TimeWallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {
        "success": True,
        "data": {
            "balance": wallet.balance,
            "locked": wallet.locked,
            "totalEarned": wallet.total_earned,
            "totalSpent": wallet.total_spent,
        },
    }


@router.get("/transactions")
def get_transactions(
    type: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    wallet = db.query(TimeWallet).filter(TimeWallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    query = db.query(Transaction).filter(Transaction.wallet_id == wallet.id)
    if type:
        query = query.filter(Transaction.type == type)

    total = query.count()
    transactions = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "data": {
            "transactions": [_transaction_dict(t) for t in transactions],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


def _wallet_dict(w: TimeWallet) -> dict:
    return {
        "id": w.id,
        "user_id": w.user_id,
        "balance": w.balance,
        "total_earned": w.total_earned,
        "total_spent": w.total_spent,
        "locked": w.locked,
    }


def _transaction_dict(t: Transaction) -> dict:
    return {
        "id": t.id,
        "_id": t.id,
        "wallet": t.wallet_id,
        "wallet_id": t.wallet_id,
        "user": t.user_id,
        "user_id": t.user_id,
        "session": t.session_id,
        "session_id": t.session_id,
        "amount": t.amount,
        "type": t.type,
        "status": t.status,
        "description": t.description,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
    }
