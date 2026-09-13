import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import socketio
from database import engine, Base
from realtime.handler import sio
from models.verification import SkillVerification

from routers import auth, users, skills, sessions, wallet, chat, reviews, notifications, matching, admin, learning_paths, verification

# Create all tables
Base.metadata.create_all(bind=engine)

# Migration: add new columns if they don't exist
try:
    with engine.connect() as _conn:
        for _col, _default in [("skills_taught", "0"), ("skills_learned", "0")]:
            try:
                _conn.execute(text(
                    f"ALTER TABLE users ADD COLUMN {_col} INTEGER NOT NULL DEFAULT {_default}"
                ))
                _conn.commit()
                print(f"Migration: added column users.{_col}")
            except Exception:
                pass  # column already exists
except Exception as _e:
    print(f"Migration warning: {_e}")

# ASGI app combining FastAPI + Socket.IO
app = FastAPI(title="Skill Swap API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(skills.router)
app.include_router(sessions.router)
app.include_router(wallet.router)
app.include_router(chat.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(matching.router)
app.include_router(admin.router)
app.include_router(learning_paths.router)
app.include_router(verification.router)


@app.get("/api/health")
def health_check():
    return {"success": True, "data": {"status": "healthy"}}


# Wrap with Socket.IO
socket_app = socketio.ASGIApp(sio, app)
