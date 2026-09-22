# SkillSwap AI

A peer-to-peer skill exchange platform where users trade knowledge using time-based tokens. Teach what you know, learn what you love.

## Live Demo

🔗 [https://skillswap-ai-iota.vercel.app/](https://skillswap-ai-iota.vercel.app/)

## Features

- **Time Token Economy** - Earn tokens by teaching, spend them learning
- **Smart Matching** - AI-powered algorithm matches complementary skill partners
- **Video Sessions** - Built-in video calling for remote learning
- **Real-time Chat** - Instant messaging with skill partners
- **Learning Paths** - Guided skill progression tracks
- **Skill Verification** - Verify your expertise with assessments
- **Wallet System** - Track earnings and token transactions
- **Reviews & Ratings** - Build trust through community feedback

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Socket.IO Client
- Chart.js

### Backend
- FastAPI
- SQLAlchemy
- MySQL
- Socket.IO
- Google Generative AI

## Getting Started

### Prerequisites
- Node.js
- Python 3.8+
- MySQL

### Installation

1. Clone the repository
```bash
git clone https://github.com/mayuri-bobade/SkillSwap-AI.git
cd SkillSwap-AI
```

2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
# Configure .env file
python main.py
```

3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/skills` - Skill listings
- `/api/sessions` - Session management
- `/api/wallet` - Token transactions
- `/api/chat` - Messaging
- `/api/matching` - Partner matching
- `/api/learning-paths` - Learning tracks
