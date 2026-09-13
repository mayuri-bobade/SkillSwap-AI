from sqlalchemy.orm import Session
from models.wallet import TimeWallet
from models.transaction import Transaction


def lock_tokens(db: Session, wallet_id: int, amount: float, user_id: int, session_id: int, description: str = None):
    wallet = db.query(TimeWallet).filter(TimeWallet.id == wallet_id).first()
    if not wallet:
        raise Exception("Wallet not found")
    if wallet.balance < amount:
        raise Exception("Insufficient balance")

    wallet.balance -= amount
    wallet.locked += amount
    db.commit()

    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=user_id,
        session_id=session_id,
        amount=amount,
        type="lock",
        status="locked",
        description=description or f"Locked {amount} tokens for session",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"wallet": wallet, "transaction": transaction}


def unlock_tokens(db: Session, wallet_id: int, amount: float, user_id: int, session_id: int, description: str = None):
    wallet = db.query(TimeWallet).filter(TimeWallet.id == wallet_id).first()
    if not wallet:
        raise Exception("Wallet not found")
    if wallet.locked < amount:
        raise Exception("Insufficient locked amount")

    wallet.balance += amount
    wallet.locked -= amount
    db.commit()

    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=user_id,
        session_id=session_id,
        amount=amount,
        type="unlock",
        status="completed",
        description=description or f"Unlocked {amount} tokens",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"wallet": wallet, "transaction": transaction}


def release_tokens(db: Session, wallet_id: int, amount: float, user_id: int, session_id: int, description: str = None):
    wallet = db.query(TimeWallet).filter(TimeWallet.id == wallet_id).first()
    if not wallet:
        raise Exception("Wallet not found")
    if wallet.locked < amount:
        raise Exception("Insufficient locked amount")

    wallet.locked -= amount
    wallet.balance += amount
    wallet.total_earned += amount
    db.commit()

    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=user_id,
        session_id=session_id,
        amount=amount,
        type="earn",
        status="completed",
        description=description or f"Earned {amount} tokens",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"wallet": wallet, "transaction": transaction}


def refund_tokens(db: Session, wallet_id: int, amount: float, user_id: int, session_id: int, description: str = None):
    wallet = db.query(TimeWallet).filter(TimeWallet.id == wallet_id).first()
    if not wallet:
        raise Exception("Wallet not found")
    if wallet.locked < amount:
        raise Exception("Insufficient locked amount")

    wallet.locked -= amount
    wallet.balance += amount
    db.commit()

    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=user_id,
        session_id=session_id,
        amount=amount,
        type="refund",
        status="refunded",
        description=description or f"Refunded {amount} tokens",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"wallet": wallet, "transaction": transaction}
