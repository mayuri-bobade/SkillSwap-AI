"""
Database initialization script.
Run this to create the MySQL database and all tables.

Usage:
    python init_db.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/skill_swap")

# Extract database name from URL
db_name = DATABASE_URL.split("/")[-1].split("?")[0]

# Create connection without database to create it if needed
base_url = DATABASE_URL.rsplit("/", 1)[0]

try:
    import pymysql
    # Parse connection details
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    host = parsed.hostname or "localhost"
    port = parsed.port or 3306
    user = parsed.username or "root"
    password = parsed.password or ""

    conn = pymysql.connect(host=host, port=port, user=user, password=password)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"Database '{db_name}' ensured.")
    conn.close()
except Exception as e:
    print(f"Warning: Could not auto-create database: {e}")
    print("Please create the database manually:")
    print(f"  CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")

# Now create all tables
from database import engine, Base
from models import User, Skill, Session, TimeWallet, Transaction, Message, Conversation, Review, Notification, Report, ConversationUnread
from models.conversation_unread import ConversationParticipant

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("All tables created successfully!")

# Create a default admin user
from sqlalchemy.orm import Session as DBSession
from utils.password import hash_password

db = DBSession(bind=engine)
try:
    admin = db.query(User).filter(User.email == "admin@skillswap.com").first()
    if not admin:
        admin = User(
            name="Admin",
            email="admin@skillswap.com",
            password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        db.commit()

        wallet = TimeWallet(user_id=admin.id, balance=5)
        db.add(wallet)
        db.commit()
        print("Default admin user created: admin@skillswap.com / admin123")
    else:
        print("Admin user already exists.")
finally:
    db.close()

print("\nDatabase initialization complete!")
print(f"Connect with: {DATABASE_URL}")
