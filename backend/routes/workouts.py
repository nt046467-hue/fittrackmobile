from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from auth_utils import get_current_user
from ai_engine import generate_recommendation, get_predefined_workouts
import json

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
def predefined_workouts(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = db.execute("SELECT fitness_level FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()
    db.close()
    level = user["fitness_level"] if user else "beginner"
    return get_predefined_workouts(level)

@router.post("/recommend")
def recommend_workout(req: AIRecommendRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = db.execute("SELECT goal, fitness_level FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()

    recent_rows = db.execute(
        "SELECT name FROM workouts WHERE user_id = ? ORDER BY completed_at DESC LIMIT 3",
        (current_user["user_id"],)
    ).fetchall()
    db.close()

    goal = req.goal or (user["goal"] if user else "general_fitness")
    level = req.fitness_level or (user["fitness_level"] if user else "beginner")
    recent = [r["name"] for r in recent_rows]

    recommendation = generate_recommendation(
        goal=goal,
        fitness_level=level,
        recent_workouts=recent,
        available_time=req.available_time or 45,
        equipment=req.equipment or "gym"
    )
    return recommendation

@router.post("/log")
def log_workout(req: LogWorkoutRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO workouts (user_id, name, type, duration, calories_burned, exercises, notes) VALUES (?,?,?,?,?,?,?)",
        (current_user["user_id"], req.name, req.type, req.duration, req.calories_burned,
         json.dumps(req.exercises), req.notes)
    )
    db.commit()
    workout_id = cursor.lastrowid
    db.close()
    return {"id": workout_id, "message": "Workout logged successfully"}

@router.get("/history")
def workout_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM workouts WHERE user_id = ? ORDER BY completed_at DESC LIMIT ?",
        (current_user["user_id"], limit)
    ).fetchall()
    db.close()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "type": r["type"],
            "duration": r["duration"],
            "calories_burned": r["calories_burned"],
            "exercises": json.loads(r["exercises"]) if r["exercises"] else [],
            "notes": r["notes"],
            "completed_at": r["completed_at"]
        }
        for r in rows
    ]

@router.get("/stats")
def workout_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = db.execute(
        "SELECT COUNT(*) as cnt, SUM(calories_burned) as cals, SUM(duration) as mins FROM workouts WHERE user_id = ?",
        (current_user["user_id"],)
    ).fetchone()

    this_week = db.execute(
        """SELECT COUNT(*) as cnt FROM workouts
           WHERE user_id = ? AND completed_at >= datetime('now', '-7 days')""",
        (current_user["user_id"],)
    ).fetchone()

    db.close()
    return {
        "total_workouts": total["cnt"] or 0,
        "total_calories_burned": total["cals"] or 0,
        "total_minutes": total["mins"] or 0,
        "workouts_this_week": this_week["cnt"] or 0
    }
