from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import get_current_user
from models import ProgressLog, Workout
from datetime import datetime, timedelta

router = APIRouter()

class LogProgressRequest(BaseModel):
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = ""

@router.post("/log")
def log_progress(req: LogProgressRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    log = ProgressLog(
        user_id=current_user["user_id"],
        weight=req.weight,
        body_fat=req.body_fat,
        muscle_mass=req.muscle_mass,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"id": log.id, "message": "Progress logged"}

@router.get("/history")
def progress_history(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user["user_id"]
    ).order_by(ProgressLog.logged_at.desc()).limit(30).all()
    
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "weight": r.weight,
            "body_fat": r.body_fat,
            "muscle_mass": r.muscle_mass,
            "notes": r.notes,
            "logged_at": r.logged_at
        }
        for r in rows
    ]

@router.get("/summary")
def progress_summary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    latest = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user["user_id"]
    ).order_by(ProgressLog.logged_at.desc()).first()

    first = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user["user_id"]
    ).order_by(ProgressLog.logged_at.asc()).first()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    workout_streak = db.query(func.count(func.distinct(func.date(Workout.completed_at)))).filter(
        Workout.user_id == current_user["user_id"],
        Workout.completed_at >= thirty_days_ago
    ).scalar()

    total_workouts = db.query(func.count(Workout.id)).filter(
        Workout.user_id == current_user["user_id"]
    ).scalar()

    weight_change = None
    if latest and first and latest.id != first.id and latest.weight and first.weight:
        weight_change = round(latest.weight - first.weight, 1)

    return {
        "current_weight": latest.weight if latest else None,
        "current_body_fat": latest.body_fat if latest else None,
        "weight_change": weight_change,
        "workout_streak": workout_streak or 0,
        "total_workouts": total_workouts or 0,
    }
