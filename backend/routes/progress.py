from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import get_current_user

router = APIRouter()

class LogProgressRequest(BaseModel):
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = ""

@router.post("/log")
def log_progress(req: LogProgressRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO progress_logs (user_id, weight, body_fat, muscle_mass, notes) VALUES (?,?,?,?,?)",
        (current_user["user_id"], req.weight, req.body_fat, req.muscle_mass, req.notes)
    )
    db.commit()
    db.close()
    return {"id": cursor.lastrowid, "message": "Progress logged"}

@router.get("/history")
def progress_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM progress_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30",
        (current_user["user_id"],)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]

@router.get("/summary")
def progress_summary(current_user: dict = Depends(get_current_user)):
    db = get_db()

    latest = db.execute(
        "SELECT * FROM progress_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1",
        (current_user["user_id"],)
    ).fetchone()

    first = db.execute(
        "SELECT * FROM progress_logs WHERE user_id = ? ORDER BY logged_at ASC LIMIT 1",
        (current_user["user_id"],)
    ).fetchone()

    workout_streak = db.execute(
        """SELECT COUNT(DISTINCT DATE(completed_at)) as streak
           FROM workouts WHERE user_id = ?
           AND completed_at >= datetime('now', '-30 days')""",
        (current_user["user_id"],)
    ).fetchone()

    total_workouts = db.execute(
        "SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ?",
        (current_user["user_id"],)
    ).fetchone()

    db.close()

    weight_change = None
    if latest and first and latest["id"] != first["id"] and latest["weight"] and first["weight"]:
        weight_change = round(latest["weight"] - first["weight"], 1)

    return {
        "current_weight": latest["weight"] if latest else None,
        "current_body_fat": latest["body_fat"] if latest else None,
        "weight_change": weight_change,
        "workout_streak": workout_streak["streak"] if workout_streak else 0,
        "total_workouts": total_workouts["cnt"] if total_workouts else 0,
    }
