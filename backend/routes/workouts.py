from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from auth_utils import get_current_user
from ai_engine import generate_recommendation, get_predefined_workouts
from models import Workout, User
from sqlalchemy import func
import json
from datetime import datetime, timedelta

router = APIRouter()

class LogWorkoutRequest(BaseModel):
    name: str
    type: str
    duration: int
    calories_burned: int
    exercises: Optional[list] = []
    notes: Optional[str] = ""

class AIRecommendRequest(BaseModel):
    goal: Optional[str] = None
    fitness_level: Optional[str] = None
    available_time: Optional[int] = 45
    equipment: Optional[str] = "gym"

@router.get("/predefined")
def predefined_workouts(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    level = user.fitness_level if user else "beginner"
    return get_predefined_workouts(level)

@router.post("/recommend")
def recommend_workout(req: AIRecommendRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    recent_workouts = db.query(Workout).filter(
        Workout.user_id == current_user["user_id"]
    ).order_by(Workout.completed_at.desc()).limit(3).all()

    goal = req.goal or (user.goal if user else "general_fitness")
    level = req.fitness_level or (user.fitness_level if user else "beginner")
    recent = [w.name for w in recent_workouts]

    recommendation = generate_recommendation(
        goal=goal,
        fitness_level=level,
        recent_workouts=recent,
        available_time=req.available_time or 45,
        equipment=req.equipment or "gym"
    )
    return recommendation

@router.post("/log")
def log_workout(req: LogWorkoutRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    workout = Workout(
        user_id=current_user["user_id"],
        name=req.name,
        type=req.type,
        duration=req.duration,
        calories_burned=req.calories_burned,
        exercises=json.dumps(req.exercises),
        notes=req.notes
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return {"id": workout.id, "message": "Workout logged successfully"}

@router.get("/history")
def workout_history(limit: int = 20, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Workout).filter(
        Workout.user_id == current_user["user_id"]
    ).order_by(Workout.completed_at.desc()).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "duration": r.duration,
            "calories_burned": r.calories_burned,
            "exercises": json.loads(r.exercises) if r.exercises else [],
            "notes": r.notes,
            "completed_at": r.completed_at
        }
        for r in rows
    ]

@router.get("/stats")
def workout_stats(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(
        func.count(Workout.id).label("cnt"),
        func.sum(Workout.calories_burned).label("cals"),
        func.sum(Workout.duration).label("mins")
    ).filter(Workout.user_id == current_user["user_id"]).first()

    week_ago = datetime.utcnow() - timedelta(days=7)
    this_week = db.query(func.count(Workout.id)).filter(
        Workout.user_id == current_user["user_id"],
        Workout.completed_at >= week_ago
    ).scalar()

    return {
        "total_workouts": total.cnt or 0,
        "total_calories_burned": total.cals or 0,
        "total_minutes": total.mins or 0,
        "workouts_this_week": this_week or 0
    }
