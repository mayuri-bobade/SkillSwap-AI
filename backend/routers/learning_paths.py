import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import google.generativeai as genai
from database import SessionLocal
from models.user import User
from models.skill import Skill

load_dotenv()

router = APIRouter(prefix="/api/learning-paths", tags=["learning-paths"])

api_key = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-3.6-flash")

SYSTEM_PROMPT = """You are an AI Learning Path Assistant designed for students.

Your job is to help students learn technologies, programming languages, computer science concepts, career skills, interview preparation, academic topics, projects, and other educational subjects.

Understand the student's question carefully.

If the student asks for a learning roadmap or learning path, create a structured and personalized roadmap based on their goal and assumed/current level.

Break complex topics into simple steps and put them in the correct learning order.

Include practical exercises, mini-projects, practice tasks, useful concepts, estimated timelines, and what the student should learn next.

If the student provides their current skill level, available time, target role, or deadline, use that information to personalize the response.

If the student does not provide these details, make reasonable beginner-friendly assumptions and still provide a useful answer.

If the question is a general educational question rather than a roadmap request, answer it clearly and simply without unnecessarily creating a roadmap.

Use beginner-friendly language.

Prefer structured headings, numbered steps, bullet points, tables, and practical examples when useful.

Do not give vague advice.

Focus on actionable learning guidance that a student can actually follow.

The goal is to help the student understand WHAT to learn, WHY to learn it, IN WHAT ORDER to learn it, and HOW to practice it."""

EXTRACT_SKILLS_PROMPT = """Extract the key skills, technologies, programming languages, frameworks, tools, and topics mentioned in this learning path.

Return ONLY a JSON array of skill names as strings. No other text.

Example: ["React", "JavaScript", "Node.js", "REST API"]

Learning Path:
{learning_path}"""

MATCH_TEACHERS_PROMPT = """You are a skill-matching assistant. Match teachers to a learning path based on their teaching skills.

Learning Path Skills: {skills}

Available Teachers: {teachers}

For each teacher, evaluate how well their teaching skills match the learning path skills. Consider:
- Direct skill matches (e.g., teacher teaches "React" and learning path needs "React")
- Related technology matches (e.g., teacher teaches "JavaScript" and learning path needs "React" - JavaScript is closely related)
- Number of matching skills
- Teacher's experience level and rating

Return ONLY a JSON array of matched teacher objects. No other text.

Each object must have these exact fields:
- "id": teacher's id (number)
- "name": teacher's name (string)
- "avatar": teacher's avatar URL (string)
- "bio": teacher's bio (string)
- "rating": teacher's rating (number)
- "total_ratings": number of ratings (number)
- "experience": teacher's experience level (string)
- "sessions_completed": number of sessions completed (number)
- "teach_skills": array of all skills the teacher teaches (array of strings)
- "matched_skills": array of skills that match the learning path (array of strings)
- "match_count": number of matched skills (number)
- "relevance": "high" if 2+ direct matches or strong related match, "medium" if 1 direct match, "low" if only related matches (string)

Sort by match_count descending (best matches first). Return at most 10 teachers.
Only include teachers who have at least one matching or related skill."""


class QuestionRequest(BaseModel):
    question: str


class RecommendTeachersRequest(BaseModel):
    learning_path: str


@router.post("/generate")
def generate_learning_path(data: QuestionRequest):
    if not data.question or not data.question.strip():
        raise HTTPException(status_code=400, detail="Please provide a question")

    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured. Please add your Gemini API key to backend_python/.env")

    try:
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nStudent Question: {data.question.strip()}"
        )
        answer = response.text
        return {"success": True, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


def _extract_skills_fallback(text: str) -> List[str]:
    """Simple keyword extraction fallback when AI is unavailable."""
    tech_keywords = [
        "react", "javascript", "python", "java", "typescript", "node.js", "nodejs",
        "html", "css", "sql", "mongodb", "django", "flask", "fastapi", "angular",
        "vue", "next.js", "nextjs", "express", "bootstrap", "tailwind", "git",
        "docker", "kubernetes", "aws", "machine learning", "deep learning",
        "data science", "artificial intelligence", "api", "rest", "graphql",
        "c++", "c#", "php", "ruby", "go", "rust", "swift", "kotlin",
        "mysql", "postgresql", "redis", "firebase", "supabase",
        "figma", "photoshop", "illustrator",
        "excel", "power bi", "tableau",
        "communication", "leadership", "management",
    ]
    text_lower = text.lower()
    found = [kw for kw in tech_keywords if kw in text_lower]
    return found[:10] if found else ["general"]


def _match_teachers_fallback(skills: List[str], teachers: list) -> list:
    """Simple text matching fallback when AI is unavailable."""
    results = []
    for teacher in teachers:
        matched = []
        for ts in teacher["teach_skills"]:
            ts_lower = ts.lower()
            for s in skills:
                if s.lower() in ts_lower or ts_lower in s.lower():
                    matched.append(ts)
                    break
        if matched:
            ratio = len(matched) / len(skills) if skills else 0
            if ratio >= 0.5:
                relevance = "high"
            elif ratio >= 0.25:
                relevance = "medium"
            else:
                relevance = "low"
            results.append({
                "id": teacher["id"],
                "name": teacher["name"],
                "avatar": teacher["avatar"],
                "bio": teacher["bio"],
                "rating": teacher["rating"],
                "total_ratings": teacher["total_ratings"],
                "experience": teacher["experience"],
                "sessions_completed": teacher["sessions_completed"],
                "teach_skills": teacher["teach_skills"],
                "matched_skills": matched,
                "match_count": len(matched),
                "relevance": relevance,
            })
    results.sort(key=lambda x: (-x["match_count"], x["relevance"] != "high"))
    return results[:10]


@router.post("/recommend-teachers")
def recommend_teachers(data: RecommendTeachersRequest):
    if not data.learning_path or not data.learning_path.strip():
        raise HTTPException(status_code=400, detail="Learning path text is required")

    db = SessionLocal()
    try:
        all_teachers_raw = (
            db.query(User, Skill)
            .join(Skill, Skill.user_id == User.id)
            .filter(Skill.type == "teach", Skill.is_active == True)
            .all()
        )

        if not all_teachers_raw:
            return {"success": True, "data": {"teachers": [], "skills_extracted": []}}

        teachers_map = {}
        for user, skill in all_teachers_raw:
            if user.id not in teachers_map:
                teachers_map[user.id] = {
                    "id": user.id,
                    "name": user.name,
                    "avatar": user.avatar or "",
                    "bio": user.bio or "",
                    "rating": user.rating or 0,
                    "total_ratings": user.total_ratings or 0,
                    "experience": user.experience or "beginner",
                    "sessions_completed": user.sessions_completed or 0,
                    "teach_skills": [],
                }
            teachers_map[user.id]["teach_skills"].append(skill.name)

        teachers_list = list(teachers_map.values())

        skills_extracted = []
        matched_teachers = []

        if api_key and api_key != "your_gemini_api_key_here":
            try:
                extract_prompt = EXTRACT_SKILLS_PROMPT.format(learning_path=data.learning_path.strip())
                response = model.generate_content(extract_prompt)
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                start = text.find("[")
                end = text.rfind("]") + 1
                if start != -1 and end > start:
                    text = text[start:end]
                skills_extracted = json.loads(text)
            except Exception:
                skills_extracted = _extract_skills_fallback(data.learning_path)

            try:
                teachers_info = json.dumps(teachers_list, default=str)
                match_prompt = MATCH_TEACHERS_PROMPT.format(
                    skills=json.dumps(skills_extracted),
                    teachers=teachers_info,
                )
                response = model.generate_content(match_prompt)
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                start = text.find("[")
                end = text.rfind("]") + 1
                if start != -1 and end > start:
                    text = text[start:end]
                matched_teachers = json.loads(text)
            except Exception:
                matched_teachers = _match_teachers_fallback(skills_extracted, teachers_list)
        else:
            skills_extracted = _extract_skills_fallback(data.learning_path)
            matched_teachers = _match_teachers_fallback(skills_extracted, teachers_list)

        return {
            "success": True,
            "data": {
                "teachers": matched_teachers,
                "skills_extracted": skills_extracted,
            },
        }
    finally:
        db.close()
