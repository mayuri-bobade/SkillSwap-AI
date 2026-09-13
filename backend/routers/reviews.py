from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.review import Review
from models.session import Session as SessionModel
from schemas.review import ReviewCreate
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("")
def create_review(
    data: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == data.sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed sessions")
    if session.teacher_id != user.id and session.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    reviewee = session.student_id if session.teacher_id == user.id else session.teacher_id

    existing = db.query(Review).filter(
        Review.session_id == data.sessionId,
        Review.reviewer_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this session")

    review = Review(
        session_id=data.sessionId,
        reviewer_id=user.id,
        reviewee_id=reviewee,
        rating=data.rating,
        comment=data.comment or "",
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    reviewee_user = db.query(User).filter(User.id == reviewee).first()
    if reviewee_user:
        new_total = reviewee_user.total_ratings + 1
        new_rating = ((reviewee_user.rating * reviewee_user.total_ratings) + data.rating) / new_total
        reviewee_user.rating = round(new_rating * 10) / 10
        reviewee_user.total_ratings = new_total
        db.commit()

    return {"success": True, "data": _review_dict(review)}


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    reviewee_user = db.query(User).filter(User.id == review.reviewee_id).first()
    if reviewee_user and reviewee_user.total_ratings > 0:
        old_total = reviewee_user.total_ratings
        new_total = old_total - 1
        if new_total > 0:
            new_rating = ((reviewee_user.rating * old_total) - review.rating) / new_total
            reviewee_user.rating = round(new_rating * 10) / 10
        else:
            reviewee_user.rating = 0
        reviewee_user.total_ratings = new_total
        db.commit()

    db.delete(review)
    db.commit()
    return {"success": True, "data": {}}


@router.get("/user/{user_id}")
def get_reviews_for_user(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * limit
    total = db.query(Review).filter(Review.reviewee_id == user_id).count()
    reviews = (
        db.query(Review)
        .filter(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for r in reviews:
        d = _review_dict(r)
        reviewer = db.query(User).filter(User.id == r.reviewer_id).first()
        d["reviewer"] = {"name": reviewer.name, "avatar": reviewer.avatar} if reviewer else None
        result.append(d)

    return {
        "success": True,
        "data": {
            "reviews": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/my")
def get_my_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    given = db.query(Review).filter(Review.reviewer_id == user.id).order_by(Review.created_at.desc()).all()
    received = db.query(Review).filter(Review.reviewee_id == user.id).order_by(Review.created_at.desc()).all()

    given_list = []
    for r in given:
        d = _review_dict(r)
        reviewee = db.query(User).filter(User.id == r.reviewee_id).first()
        d["reviewee"] = {"name": reviewee.name, "avatar": reviewee.avatar} if reviewee else None
        given_list.append(d)

    received_list = []
    for r in received:
        d = _review_dict(r)
        reviewer = db.query(User).filter(User.id == r.reviewer_id).first()
        d["reviewer"] = {"name": reviewer.name, "avatar": reviewer.avatar} if reviewer else None
        received_list.append(d)

    return {
        "success": True,
        "data": {
            "given": given_list,
            "received": received_list,
        },
    }


def _review_dict(r: Review) -> dict:
    return {
        "id": r.id,
        "_id": r.id,
        "session": r.session_id,
        "sessionId": r.session_id,
        "reviewer": r.reviewer_id,
        "reviewee": r.reviewee_id,
        "rating": r.rating,
        "comment": r.comment,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    }
