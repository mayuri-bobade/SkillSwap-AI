from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.wallet import TimeWallet
from schemas.user import UserCreate, UserLogin, GoogleLogin, UserOut, AuthResponse, UserUpdate, PasswordUpdate
from middleware.auth import create_access_token, get_current_user
from utils.password import hash_password, verify_password
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(data.password)
    user = User(name=data.name, email=data.email, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    wallet = TimeWallet(user_id=user.id, balance=5)
    db.add(wallet)
    db.commit()

    token = create_access_token(user.id)
    return {
        "success": True,
        "data": {
            "token": token,
            "user": _user_dict(user),
        },
    }


@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Please provide email and password")

    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {
        "success": True,
        "data": {
            "token": token,
            "user": _user_dict(user),
        },
    }


@router.post("/google")
def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        import requests

        # Try to verify as ID token first
        try:
            payload = google_id_token.verify_oauth2_token(
                data.token, google_requests.Request(), GOOGLE_CLIENT_ID
            )
            google_id = payload["sub"]
            email = payload["email"]
            name = payload.get("name", "")
            picture = payload.get("picture", "")
        except Exception:
            # If not ID token, treat as access token and fetch user info
            userinfo_response = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {data.token}"}
            )
            if userinfo_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Google token")
            userinfo = userinfo_response.json()
            google_id = userinfo.get("id", "")
            email = userinfo.get("email", "")
            name = userinfo.get("name", "")
            picture = userinfo.get("picture", "")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()

    if not user:
        import secrets
        random_pw = secrets.token_hex(32)
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            avatar=picture,
            password=hash_password(random_pw),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        wallet = TimeWallet(user_id=user.id, balance=5)
        db.add(wallet)
        db.commit()
    elif not user.google_id:
        user.google_id = google_id
        if picture and not user.avatar:
            user.avatar = picture
        db.commit()

    token = create_access_token(user.id)
    return {
        "success": True,
        "data": {
            "token": token,
            "user": _user_dict(user),
        },
    }


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"success": True, "data": _user_dict(user)}


@router.put("/profile")
def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        user.name = data.name
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar is not None:
        user.avatar = data.avatar
    if data.experience is not None:
        user.experience = data.experience
    if data.availability is not None:
        user.availability = data.availability
    db.commit()
    db.refresh(user)
    return {"success": True, "data": _user_dict(user)}


@router.put("/password")
def update_password(
    data: PasswordUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.currentPassword, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password = hash_password(data.newPassword)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}


@router.delete("/account")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from models.wallet import TimeWallet
    from models.transaction import Transaction
    from models.session import Session
    from models.notification import Notification
    from models.skill import Skill
    from models.review import Review
    from models.report import Report
    from models.verification import SkillVerification
    from models.message import Message, Conversation
    from models.conversation_unread import ConversationParticipant, ConversationUnread

    uid = user.id

    db.query(ConversationUnread).filter(ConversationUnread.user_id == uid).delete(synchronize_session=False)
    db.query(ConversationParticipant).filter(ConversationParticipant.user_id == uid).delete(synchronize_session=False)

    user_msg_ids = [m.id for m in db.query(Message.id).filter(Message.sender_id == uid).all()]
    if user_msg_ids:
        db.query(Conversation).filter(Conversation.last_message_id.in_(user_msg_ids)).update({Conversation.last_message_id: None}, synchronize_session=False)
        db.query(Message).filter(Message.id.in_(user_msg_ids)).delete(synchronize_session=False)

    db.query(Notification).filter(Notification.user_id == uid).delete(synchronize_session=False)
    db.query(Report).filter((Report.reporter_id == uid) | (Report.reported_user_id == uid)).delete(synchronize_session=False)

    session_ids = [s.id for s in db.query(Session.id).filter((Session.teacher_id == uid) | (Session.student_id == uid)).all()]
    if session_ids:
        db.query(Session).filter(Session.id.in_(session_ids)).update({Session.transaction_id: None}, synchronize_session=False)
        db.query(Review).filter(Review.session_id.in_(session_ids)).delete(synchronize_session=False)
        db.query(Transaction).filter(Transaction.session_id.in_(session_ids)).delete(synchronize_session=False)
        db.query(Session).filter(Session.id.in_(session_ids)).delete(synchronize_session=False)

    db.query(Review).filter((Review.reviewer_id == uid) | (Review.reviewee_id == uid)).delete(synchronize_session=False)
    db.query(Transaction).filter(Transaction.user_id == uid).delete(synchronize_session=False)
    db.query(TimeWallet).filter(TimeWallet.user_id == uid).delete(synchronize_session=False)

    skill_ids = [s.id for s in db.query(Skill.id).filter(Skill.user_id == uid).all()]
    if skill_ids:
        db.query(SkillVerification).filter(SkillVerification.skill_id.in_(skill_ids)).delete(synchronize_session=False)
    db.query(SkillVerification).filter(SkillVerification.user_id == uid).delete(synchronize_session=False)
    db.query(Skill).filter(Skill.user_id == uid).delete(synchronize_session=False)

    db.delete(user)
    db.commit()
    return {"success": True, "message": "Account deleted successfully"}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "_id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar or "",
        "bio": user.bio or "",
        "role": user.role or "user",
        "experience": user.experience or "beginner",
        "availability": user.availability or [],
        "rating": user.rating or 0,
        "totalRatings": user.total_ratings or 0,
        "sessionsCompleted": user.sessions_completed or 0,
        "skillsTaught": user.skills_taught or 0,
        "skillsLearned": user.skills_learned or 0,
        "isOnline": user.is_online or False,
        "lastSeen": user.last_seen.isoformat() if user.last_seen else None,
        "googleId": user.google_id,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }
