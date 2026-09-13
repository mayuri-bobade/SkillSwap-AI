from sqlalchemy.orm import Session
from utils.token_manager import lock_tokens, unlock_tokens, release_tokens, refund_tokens


def create_escrow(db: Session, student_wallet_id: int, amount: float, student_id: int, session_id: int):
    return lock_tokens(db, student_wallet_id, amount, student_id, session_id, "Tokens locked for session escrow")


def release_escrow(db: Session, teacher_wallet_id: int, amount: float, teacher_id: int, session_id: int):
    return release_tokens(db, teacher_wallet_id, amount, teacher_id, session_id, "Tokens released from escrow")


def refund_escrow(db: Session, student_wallet_id: int, amount: float, student_id: int, session_id: int):
    return refund_tokens(db, student_wallet_id, amount, student_id, session_id, "Tokens refunded from escrow")


def cancel_escrow(db: Session, wallet_id: int, amount: float, user_id: int, session_id: int):
    return unlock_tokens(db, wallet_id, amount, user_id, session_id, "Tokens unlocked - session cancelled")
