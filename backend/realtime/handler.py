import socketio
from database import SessionLocal
from models.user import User
from models.message import Message, Conversation
from models.conversation_unread import ConversationParticipant, ConversationUnread
from models.notification import Notification
from jose import JWTError, jwt
import os

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
online_users = {}

JWT_SECRET = os.getenv("JWT_SECRET", "skill-swap-secret-key-2024")
ALGORITHM = "HS256"


def get_user_from_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        return user_id
    except JWTError:
        return None


@sio.event
async def connect(sid, environ, auth):
    user_id = None
    if auth and isinstance(auth, dict):
        token = auth.get("token", "")
        user_id = get_user_from_token(token)

    if user_id:
        online_users[str(user_id)] = sid
        sio.environ[sid] = {"user_id": user_id}
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                from datetime import datetime
                user.is_online = True
                user.last_seen = datetime.utcnow()
                db.commit()
            await sio.emit("user_online", user_id)
        finally:
            db.close()
    print(f"Client connected: {sid}, user_id: {user_id}")


@sio.event
async def register(sid, userId):
    online_users[str(userId)] = sid
    if sid in sio.environ:
        sio.environ[sid]["user_id"] = int(userId)
    else:
        sio.environ[sid] = {"user_id": int(userId)}
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(userId)).first()
        if user:
            from datetime import datetime
            user.is_online = True
            user.last_seen = datetime.utcnow()
            db.commit()
        await sio.emit("user_online", userId)
    finally:
        db.close()


@sio.event
async def join_room(sid, roomId):
    sio.enter_room(sid, str(roomId))


@sio.event
async def send_message(sid, data):
    conversation_id = data.get("conversationId")
    content = data.get("content")
    msg_type = data.get("type", "text")

    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    if not user_id:
        user_id = data.get("_userId")

    if not user_id:
        print("No user_id found for send_message")
        return

    db = SessionLocal()
    try:
        message = Message(
            conversation_id=int(conversation_id),
            sender_id=int(user_id),
            content=content,
            type=msg_type,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        print(f"Message saved: id={message.id}, conv={conversation_id}, sender={user_id}")

        conv = db.query(Conversation).filter(Conversation.id == int(conversation_id)).first()
        if conv:
            conv.last_message_id = message.id
            from datetime import datetime
            conv.last_message_at = datetime.utcnow()

            participants = db.query(ConversationParticipant).filter(
                ConversationParticipant.conversation_id == int(conversation_id)
            ).all()

            for p in participants:
                if p.user_id != int(user_id):
                    unread = db.query(ConversationUnread).filter(
                        ConversationUnread.conversation_id == int(conversation_id),
                        ConversationUnread.user_id == p.user_id,
                    ).first()
                    if unread:
                        unread.count += 1

            db.commit()

        sender = db.query(User).filter(User.id == int(user_id)).first()
        sender_data = {"id": sender.id, "_id": sender.id, "name": sender.name, "avatar": sender.avatar or ""} if sender else {}

        msg_dict = {
            "id": message.id,
            "_id": message.id,
            "conversationId": message.conversation_id,
            "sender": sender_data,
            "content": message.content,
            "type": message.type,
            "createdAt": message.created_at.isoformat() if message.created_at else None,
        }

        print(f"Emitting new_message to room {conversation_id}: {msg_dict}")
        await sio.emit("new_message", {
            "message": msg_dict,
            "conversationId": conversation_id,
        }, room=str(conversation_id))

        # Also emit to sender directly in case they're not in the room yet
        await sio.emit("new_message", {
            "message": msg_dict,
            "conversationId": conversation_id,
        }, to=sid)

        for p in participants:
            if p.user_id != int(user_id):
                socket_id = online_users.get(str(p.user_id))
                if socket_id:
                    await sio.emit("message_notification", {
                        "conversationId": conversation_id,
                        "message": {
                            "id": message.id,
                            "content": message.content,
                            "sender": sender_data,
                        },
                    }, to=socket_id)
    except Exception as e:
        print(f"Error sending message: {e}")
    finally:
        db.close()


@sio.event
async def typing(sid, data):
    conversation_id = data.get("conversationId")
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    await sio.emit("user_typing", {
        "userId": user_id,
        "conversationId": conversation_id,
    }, room=str(conversation_id), skip_sid=sid)


@sio.event
async def stop_typing(sid, data):
    conversation_id = data.get("conversationId")
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    await sio.emit("user_stop_typing", {
        "userId": user_id,
        "conversationId": conversation_id,
    }, room=str(conversation_id), skip_sid=sid)


@sio.event
async def join_session(sid, sessionId):
    sio.enter_room(sid, f"session_{sessionId}")


@sio.event
async def offer(sid, data):
    session_id = data.get("sessionId")
    offer_data = data.get("offer")
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    await sio.emit("offer", {
        "offer": offer_data,
        "from": user_id,
    }, room=f"session_{session_id}", skip_sid=sid)


@sio.event
async def answer(sid, data):
    session_id = data.get("sessionId")
    answer_data = data.get("answer")
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    await sio.emit("answer", {
        "answer": answer_data,
        "from": user_id,
    }, room=f"session_{session_id}", skip_sid=sid)


@sio.event
async def ice_candidate(sid, data):
    session_id = data.get("sessionId")
    candidate = data.get("candidate")
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")
    await sio.emit("ice-candidate", {
        "candidate": candidate,
        "from": user_id,
    }, room=f"session_{session_id}", skip_sid=sid)


@sio.event
async def notification(sid, data):
    target_user_id = str(data.get("userId"))
    notification_data = data.get("notification")
    socket_id = online_users.get(target_user_id)
    if socket_id:
        await sio.emit("new_notification", notification_data, to=socket_id)


@sio.event
async def disconnect(sid):
    user_id = None
    if sid in sio.environ:
        user_id = sio.environ[sid].get("user_id")

    if not user_id:
        for uid, sid_val in list(online_users.items()):
            if sid_val == sid:
                user_id = uid
                del online_users[uid]
                break
    else:
        user_id = str(user_id)
        if user_id in online_users:
            del online_users[user_id]

    if user_id:
        db = SessionLocal()
        try:
            from datetime import datetime
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.is_online = False
                user.last_seen = datetime.utcnow()
                db.commit()
            await sio.emit("user_offline", int(user_id))
        finally:
            db.close()

    if sid in sio.environ:
        del sio.environ[sid]

    print(f"Client disconnected: {sid}")
