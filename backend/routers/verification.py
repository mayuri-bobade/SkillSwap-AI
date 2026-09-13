import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import google.generativeai as genai

from database import get_db
from models.user import User
from models.skill import Skill
from models.verification import SkillVerification
from middleware.auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/verification", tags=["verification"])

api_key = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-3.6-flash")

QUESTIONS_PROMPT = """You are an AI Skill Assessment Generator for a skill-sharing platform.

Generate exactly 3 assessment questions for the skill "{skill_name}" at the "{level}" level.

The questions should test practical knowledge and understanding. Mix question types:
- One conceptual/theoretical question
- One practical/application question  
- One problem-solving question

Return ONLY a JSON array of objects with "question" and "type" fields. No other text.

Example format:
[
  {{"question": "What is the difference between...", "type": "conceptual"}},
  {{"question": "Write a code example that...", "type": "practical"}},
  {{"question": "How would you solve...", "type": "problem-solving"}}
]"""

EVALUATION_PROMPT = """You are an AI Skill Evaluator for a skill-sharing platform.

Evaluate the user's answers for the skill "{skill_name}" at the claimed "{level}" level.

Questions and Answers:
{qa_pairs}

Evaluate each answer and provide:
1. A score out of 100 for the overall assessment
2. The verified level based on the answers: "beginner", "intermediate", "advanced", or "expert"
3. A brief feedback explaining the evaluation
4. For each question, a brief assessment

Return ONLY a JSON object with this exact format:
{{
  "score": 85,
  "verified_level": "intermediate",
  "feedback": "Brief overall feedback...",
  "question_assessments": [
    {{"question_index": 0, "correct": true, "brief": "Brief assessment..."}},
    {{"question_index": 1, "correct": true, "brief": "Brief assessment..."}},
    {{"question_index": 2, "correct": false, "brief": "Brief assessment..."}}
  ]
}}"""


class GenerateQuestionsRequest(BaseModel):
    skill_name: str
    level: str


class SubmitAnswersRequest(BaseModel):
    verification_id: int
    answers: List[str]


@router.post("/generate-questions")
def generate_questions(
    data: GenerateQuestionsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    # Find skill in user's profile (optional - allows any skill for verification)
    skill = db.query(Skill).filter(
        Skill.user_id == user.id,
        Skill.is_active == True,
    ).first()

    try:
        prompt = QUESTIONS_PROMPT.format(skill_name=data.skill_name, level=data.level)
        print(f"DEBUG: Generating questions for skill={data.skill_name}, level={data.level}")
        response = model.generate_content(prompt)
        print(f"DEBUG: Response received, text length={len(response.text)}")
        text = response.text.strip()
        print(f"DEBUG: Raw response: {text[:500]}")
        
        # Clean up the response to extract JSON
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # Find the JSON array in the response
        start = text.find("[")
        end = text.rfind("]") + 1
        if start != -1 and end > start:
            text = text[start:end]
        
        print(f"DEBUG: Cleaned text: {text[:500]}")
        questions = json.loads(text)
        print(f"DEBUG: Parsed {len(questions)} questions")

        verification = SkillVerification(
            user_id=user.id,
            skill_id=skill.id if skill else 0,
            skill_name=data.skill_name,
            claimed_level=data.level,
            questions=questions,
            verification_status="pending",
        )
        db.add(verification)
        db.commit()
        db.refresh(verification)

        return {
            "success": True,
            "data": {
                "verification_id": verification.id,
                "questions": questions,
            },
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


@router.post("/submit-answers")
def submit_answers(
    data: SubmitAnswersRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    verification = db.query(SkillVerification).filter(
        SkillVerification.id == data.verification_id,
        SkillVerification.user_id == user.id,
    ).first()

    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")

    if verification.verification_status != "pending":
        raise HTTPException(status_code=400, detail="This assessment has already been completed")

    if len(data.answers) != len(verification.questions):
        raise HTTPException(status_code=400, detail="Number of answers must match number of questions")

    try:
        qa_pairs = ""
        for i, (q, a) in enumerate(zip(verification.questions, data.answers)):
            qa_pairs += f"\nQuestion {i+1} ({q.get('type', 'general')}): {q['question']}\nAnswer: {a}\n"

        prompt = EVALUATION_PROMPT.format(
            skill_name=verification.skill_name,
            level=verification.claimed_level,
            qa_pairs=qa_pairs,
        )
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up the response to extract JSON
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # Find the JSON object in the response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            text = text[start:end]
        
        evaluation = json.loads(text)

        score = evaluation.get("score", 0)
        verified_level = evaluation.get("verified_level", "beginner")
        feedback = evaluation.get("feedback", "")
        question_assessments = evaluation.get("question_assessments", [])

        if score >= 80:
            status = "verified"
        elif score >= 50:
            status = "partial"
        else:
            status = "failed"

        verification.answers = data.answers
        verification.score = score
        verification.verified_level = verified_level
        verification.ai_feedback = feedback
        verification.verification_status = status
        db.commit()

        skill = db.query(Skill).filter(Skill.id == verification.skill_id).first()
        if skill and status == "verified":
            skill.level = verified_level
            db.commit()

        return {
            "success": True,
            "data": {
                "verification_id": verification.id,
                "score": score,
                "verified_level": verified_level,
                "status": status,
                "feedback": feedback,
                "question_assessments": question_assessments,
            },
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI evaluation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answers: {str(e)}")


@router.get("/skill/{skill_id}")
def get_skill_verification(
    skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verification = db.query(SkillVerification).filter(
        SkillVerification.skill_id == skill_id,
        SkillVerification.user_id == user.id,
    ).order_by(SkillVerification.created_at.desc()).first()

    if not verification:
        return {"success": True, "data": None}

    return {
        "success": True,
        "data": {
            "id": verification.id,
            "skill_name": verification.skill_name,
            "claimed_level": verification.claimed_level,
            "verified_level": verification.verified_level,
            "score": verification.score,
            "status": verification.verification_status,
            "feedback": verification.ai_feedback,
            "created_at": verification.created_at.isoformat() if verification.created_at else None,
        },
    }


@router.get("/user/{user_id}")
def get_user_verifications(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verifications = db.query(SkillVerification).filter(
        SkillVerification.user_id == user_id,
    ).order_by(SkillVerification.created_at.desc()).all()

    result = []
    for v in verifications:
        result.append({
            "id": v.id,
            "skill_name": v.skill_name,
            "claimed_level": v.claimed_level,
            "verified_level": v.verified_level,
            "score": v.score,
            "status": v.verification_status,
            "feedback": v.ai_feedback,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        })

    return {"success": True, "data": result}
