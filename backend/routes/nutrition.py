from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import get_current_user
from models import NutritionLog, User
from datetime import datetime, timedelta

router = APIRouter()

CALORIE_GOALS = {"weight_loss": 1600, "muscle_gain": 2800, "general_fitness": 2200, "strength": 2600, "cardio": 2400}

FOOD_DATABASE = [
    {"name": "Chicken Breast (100g)", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0},
    {"name": "Brown Rice (100g cooked)", "calories": 112, "protein": 2.6, "carbs": 24, "fat": 0.9, "fiber": 1.8},
    {"name": "Whole Egg", "calories": 72, "protein": 6.3, "carbs": 0.4, "fat": 4.8, "fiber": 0},
    {"name": "Oatmeal (50g dry)", "calories": 187, "protein": 6.7, "carbs": 33, "fat": 3.4, "fiber": 5},
    {"name": "Banana (medium)", "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "fiber": 2.6},
    {"name": "Greek Yogurt (150g)", "calories": 130, "protein": 17, "carbs": 9, "fat": 3.5, "fiber": 0},
    {"name": "Salmon (100g)", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "fiber": 0},
    {"name": "Sweet Potato (100g)", "calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1, "fiber": 3},
    {"name": "Almonds (30g)", "calories": 173, "protein": 6, "carbs": 6, "fat": 15, "fiber": 3.5},
    {"name": "Broccoli (100g)", "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "fiber": 2.6},
    {"name": "Whey Protein Shake", "calories": 120, "protein": 25, "carbs": 3, "fat": 1.5, "fiber": 0},
    {"name": "Avocado (half)", "calories": 120, "protein": 1.5, "carbs": 6, "fat": 11, "fiber": 5},
    {"name": "Whole Wheat Bread (slice)", "calories": 81, "protein": 4, "carbs": 15, "fat": 1.1, "fiber": 1.9},
    {"name": "Tuna (100g canned)", "calories": 130, "protein": 29, "carbs": 0, "fat": 1, "fiber": 0},
    {"name": "Apple (medium)", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4.4},
]

class LogMealRequest(BaseModel):
    meal_name: str
    meal_type: str  # breakfast, lunch, dinner, snack
    calories: int
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    fiber: Optional[float] = 0

@router.get("/search")
def search_food(q: str, current_user: dict = Depends(get_current_user)):
    q_lower = q.lower()
    results = [f for f in FOOD_DATABASE if q_lower in f["name"].lower()]
    return results[:10]

@router.get("/foods")
def get_foods(current_user: dict = Depends(get_current_user)):
    return FOOD_DATABASE

@router.post("/log")
def log_meal(req: LogMealRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    log = NutritionLog(
        user_id=current_user["user_id"],
        meal_name=req.meal_name,
        meal_type=req.meal_type,
        calories=req.calories,
        protein=req.protein,
        carbs=req.carbs,
        fat=req.fat,
        fiber=req.fiber
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"id": log.id, "message": "Meal logged successfully"}

@router.get("/today")
def today_nutrition(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    rows = db.query(NutritionLog).filter(
        NutritionLog.user_id == current_user["user_id"],
        func.date(NutritionLog.logged_at) == today
    ).order_by(NutritionLog.logged_at).all()
    
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    goal = user.goal if user else "general_fitness"
    calorie_goal = CALORIE_GOALS.get(goal, 2200)

    meals = [
        {
            "id": r.id,
            "meal_name": r.meal_name,
            "meal_type": r.meal_type,
            "calories": r.calories,
            "protein": r.protein,
            "carbs": r.carbs,
            "fat": r.fat,
            "fiber": r.fiber,
            "logged_at": r.logged_at
        }
        for r in rows
    ]

    totals = {
        "calories": sum(m["calories"] for m in meals),
        "protein": round(sum(m["protein"] for m in meals), 1),
        "carbs": round(sum(m["carbs"] for m in meals), 1),
        "fat": round(sum(m["fat"] for m in meals), 1),
        "fiber": round(sum(m["fiber"] for m in meals), 1),
    }

    return {
        "meals": meals,
        "totals": totals,
        "calorie_goal": calorie_goal,
        "remaining": max(0, calorie_goal - totals["calories"])
    }

@router.delete("/log/{log_id}")
def delete_meal(log_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.user_id == current_user["user_id"]
    ).delete()
    db.commit()
    return {"message": "Meal deleted"}

@router.get("/weekly")
def weekly_nutrition(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    week_ago = datetime.utcnow() - timedelta(days=7)
    rows = db.query(
        func.date(NutritionLog.logged_at).label("day"),
        func.sum(NutritionLog.calories).label("calories"),
        func.sum(NutritionLog.protein).label("protein"),
        func.sum(NutritionLog.carbs).label("carbs"),
        func.sum(NutritionLog.fat).label("fat")
    ).filter(
        NutritionLog.user_id == current_user["user_id"],
        NutritionLog.logged_at >= week_ago
    ).group_by(func.date(NutritionLog.logged_at)).order_by(func.date(NutritionLog.logged_at)).all()
    
    return [
        {
            "day": str(r.day),
            "calories": r.calories or 0,
            "protein": r.protein or 0,
            "carbs": r.carbs or 0,
            "fat": r.fat or 0
        }
        for r in rows
    ]
