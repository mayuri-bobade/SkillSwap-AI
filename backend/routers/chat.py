from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.message import Message, Conversation
from models.conversation_unread import ConversationUnread, ConversationParticipant
from schemas.message import MessageCreate
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations")
def get_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant_ids = (
        db.query(ConversationParticipant.conversation_id)
        .filter(ConversationParticipant.user_id == user.id)
        .subquery()
    )
    conversations = db.query(Conversation).filter(Conversation.id.in_(participant_ids)).all()

    result = []
    for conv in conversations:
        hidden = (conv.hidden_by or "").split(",")
        if str(user.id) in hidden:
            continue
        participants = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id
        ).all()

        participant_list = []
        for p in participants:
            u = db.query(User).filter(User.id == p.user_id).first()
            if u:
                participant_list.append({
                    "id": u.id,
                    "_id": u.id,
                    "name": u.name,
                    "avatar": u.avatar or "",
                    "isOnline": u.is_online or False,
                    "lastSeen": u.last_seen.isoformat() if u.last_seen else None,
                })

        last_msg = None
        if conv.last_message_id:
            msg = db.query(Message).filter(Message.id == conv.last_message_id).first()
            if msg:
                last_msg = _message_dict(msg)
                sender = db.query(User).filter(User.id == msg.sender_id).first()
                last_msg["sender"] = {
                    "id": sender.id,
                    "_id": sender.id,
                    "name": sender.name,
                    "avatar": sender.avatar or "",
                } if sender else msg.sender_id

        unread = db.query(ConversationUnread).filter(
            ConversationUnread.conversation_id == conv.id,
            ConversationUnread.user_id == user.id,
        ).first()

        result.append({
            "id": conv.id,
            "_id": conv.id,
            "participants": participant_list,
            "lastMessage": last_msg,
            "lastMessageAt": conv.last_message_at.isoformat() if conv.last_message_at else None,
            "unreadCount": unread.count if unread else 0,
        })

    result.sort(key=lambda x: x["lastMessageAt"] or "", reverse=True)
    return {"success": True, "data": result}


@router.post("/conversations")
def create_conversation(
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = db.query(User).filter(User.id == data.participantId).first()
    if not participant:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user.id)
        .subquery()
    )
    conv_ids = (
        db.query(ConversationParticipant.conversation_id)
        .filter(
            ConversationParticipant.user_id == data.participantId,
            ConversationParticipant.conversation_id.in_(db.query(existing.c.conversation_id)),
        )
        .all()
    )

    if conv_ids:
        conv = db.query(Conversation).filter(Conversation.id == conv_ids[0][0]).first()
    else:
        conv = Conversation()
        db.add(conv)
        db.commit()
        db.refresh(conv)

        db.add(ConversationParticipant(conversation_id=conv.id, user_id=user.id, unread_count=0))
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=data.participantId, unread_count=0))
        db.add(ConversationUnread(conversation_id=conv.id, user_id=user.id, count=0))
        db.add(ConversationUnread(conversation_id=conv.id, user_id=data.participantId, count=0))
        db.commit()

    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv.id
    ).all()

    participant_list = []
    for p in participants:
        u = db.query(User).filter(User.id == p.user_id).first()
        if u:
            participant_list.append({
                "id": u.id,
                "_id": u.id,
                "name": u.name,
                "avatar": u.avatar or "",
                "isOnline": u.is_online or False,
                "lastSeen": u.last_seen.isoformat() if u.last_seen else None,
            })

    last_msg = None
    if conv.last_message_id:
        msg = db.query(Message).filter(Message.id == conv.last_message_id).first()
        if msg:
            last_msg = _message_dict(msg)

    unread = db.query(ConversationUnread).filter(
        ConversationUnread.conversation_id == conv.id,
        ConversationUnread.user_id == user.id,
    ).first()

    return {
        "success": True,
        "data": {
            "id": conv.id,
            "_id": conv.id,
            "participants": participant_list,
            "lastMessage": last_msg,
            "lastMessageAt": conv.last_message_at.isoformat() if conv.last_message_at else None,
            "unreadCount": unread.count if unread else 0,
        },
    }


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user.id,
        )
        .first()
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")

    total = db.query(Message).filter(Message.conversation_id == conversation_id).count()
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    unread = db.query(ConversationUnread).filter(
        ConversationUnread.conversation_id == conversation_id,
        ConversationUnread.user_id == user.id,
    ).first()
    if unread and unread.count > 0:
        unread.count = 0
        db.commit()

    result = []
    for m in reversed(messages):
        msg_data = _message_dict(m)
        sender = db.query(User).filter(User.id == m.sender_id).first()
        msg_data["sender"] = {
            "id": sender.id,
            "_id": sender.id,
            "name": sender.name,
            "avatar": sender.avatar or "",
        } if sender else m.sender_id
        result.append(msg_data)

    return {
        "success": True,
        "data": {
            "messages": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user.id,
        )
        .first()
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.query(ConversationUnread).filter(ConversationUnread.conversation_id == conversation_id).delete()
    db.query(ConversationParticipant).filter(ConversationParticipant.conversation_id == conversation_id).delete()
    conv.last_message_id = None
    db.flush()
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()

    return {"success": True, "message": "Conversation deleted"}


def _message_dict(m: Message) -> dict:
    return {
        "id": m.id,
        "_id": m.id,
        "conversationId": m.conversation_id,
        "sender": m.sender_id,
        "content": m.content,
        "type": m.type,
        "createdAt": m.created_at.isoformat() if m.created_at else None,
    }


def _conversation_dict(c: Conversation) -> dict:
    return {
        "id": c.id,
        "_id": c.id,
        "lastMessageAt": c.last_message_at.isoformat() if c.last_message_at else None,
    }
