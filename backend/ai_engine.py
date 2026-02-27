"""
AI Workout Recommendation Engine
Generates personalized workout plans based on user goals, fitness level, and history.
"""

from typing import List, Dict
import random

EXERCISE_LIBRARY = {
    "strength": {
        "beginner": [
            {"name": "Bodyweight Squats", "sets": 3, "reps": "12", "rest": 60, "calories": 8, "muscle": "Quads, Glutes"},
            {"name": "Push-ups", "sets": 3, "reps": "10", "rest": 60, "calories": 7, "muscle": "Chest, Triceps"},
            {"name": "Dumbbell Rows", "sets": 3, "reps": "10", "rest": 60, "calories": 7, "muscle": "Back, Biceps"},
            {"name": "Glute Bridges", "sets": 3, "reps": "15", "rest": 45, "calories": 5, "muscle": "Glutes, Hamstrings"},
            {"name": "Plank Hold", "sets": 3, "reps": "30s", "rest": 45, "calories": 4, "muscle": "Core"},
            {"name": "Dumbbell Lunges", "sets": 3, "reps": "10 each", "rest": 60, "calories": 9, "muscle": "Quads, Glutes"},
        ],
        "intermediate": [
            {"name": "Barbell Squats", "sets": 4, "reps": "8", "rest": 90, "calories": 12, "muscle": "Quads, Glutes"},
            {"name": "Bench Press", "sets": 4, "reps": "8", "rest": 90, "calories": 10, "muscle": "Chest, Triceps"},
            {"name": "Deadlifts", "sets": 3, "reps": "6", "rest": 120, "calories": 15, "muscle": "Full Body"},
            {"name": "Pull-ups", "sets": 4, "reps": "8", "rest": 90, "calories": 10, "muscle": "Back, Biceps"},
            {"name": "Overhead Press", "sets": 3, "reps": "10", "rest": 75, "calories": 8, "muscle": "Shoulders"},
            {"name": "Romanian Deadlifts", "sets": 3, "reps": "10", "rest": 75, "calories": 11, "muscle": "Hamstrings"},
        ],
        "advanced": [
            {"name": "Heavy Barbell Squats", "sets": 5, "reps": "5", "rest": 180, "calories": 18, "muscle": "Quads, Glutes"},
            {"name": "Weighted Pull-ups", "sets": 4, "reps": "6", "rest": 120, "calories": 14, "muscle": "Back, Biceps"},
            {"name": "Sumo Deadlifts", "sets": 4, "reps": "5", "rest": 180, "calories": 20, "muscle": "Full Body"},
            {"name": "Incline Bench Press", "sets": 4, "reps": "6", "rest": 120, "calories": 12, "muscle": "Upper Chest"},
            {"name": "Bulgarian Split Squats", "sets": 4, "reps": "8 each", "rest": 90, "calories": 13, "muscle": "Quads, Glutes"},
            {"name": "Barbell Hip Thrust", "sets": 4, "reps": "8", "rest": 90, "calories": 11, "muscle": "Glutes"},
        ]
    },
    "cardio": {
        "beginner": [
            {"name": "Brisk Walking", "sets": 1, "reps": "20 min", "rest": 0, "calories": 100, "muscle": "Full Body"},
            {"name": "Light Jogging", "sets": 4, "reps": "2 min run / 1 min walk", "rest": 60, "calories": 120, "muscle": "Legs, Cardio"},
            {"name": "Jumping Jacks", "sets": 3, "reps": "30", "rest": 45, "calories": 20, "muscle": "Full Body"},
            {"name": "Step-ups", "sets": 3, "reps": "15 each", "rest": 45, "calories": 15, "muscle": "Legs"},
        ],
        "intermediate": [
            {"name": "Interval Running", "sets": 6, "reps": "400m sprint", "rest": 90, "calories": 50, "muscle": "Legs, Cardio"},
            {"name": "Jump Rope", "sets": 5, "reps": "2 min", "rest": 60, "calories": 35, "muscle": "Full Body"},
            {"name": "Cycling", "sets": 1, "reps": "30 min moderate", "rest": 0, "calories": 250, "muscle": "Legs, Cardio"},
            {"name": "Burpees", "sets": 4, "reps": "15", "rest": 60, "calories": 25, "muscle": "Full Body"},
        ],
        "advanced": [
            {"name": "HIIT Sprints", "sets": 10, "reps": "30s all-out / 30s rest", "rest": 30, "calories": 40, "muscle": "Full Body"},
            {"name": "Box Jumps", "sets": 5, "reps": "10", "rest": 60, "calories": 20, "muscle": "Explosive Legs"},
            {"name": "Rowing Machine", "sets": 1, "reps": "5000m", "rest": 0, "calories": 400, "muscle": "Full Body"},
            {"name": "Assault Bike Intervals", "sets": 8, "reps": "20s max effort", "rest": 40, "calories": 30, "muscle": "Full Body"},
        ]
    },
    "weight_loss": {
        "beginner": [
            {"name": "Walking Lunges", "sets": 3, "reps": "12 each", "rest": 45, "calories": 10, "muscle": "Legs"},
            {"name": "Mountain Climbers", "sets": 3, "reps": "20", "rest": 45, "calories": 12, "muscle": "Core, Cardio"},
            {"name": "High Knees", "sets": 3, "reps": "30s", "rest": 30, "calories": 15, "muscle": "Legs, Cardio"},
            {"name": "Wall Sit", "sets": 3, "reps": "30s", "rest": 45, "calories": 8, "muscle": "Quads"},
        ],
        "intermediate": [
            {"name": "Kettlebell Swings", "sets": 4, "reps": "20", "rest": 60, "calories": 18, "muscle": "Full Body"},
            {"name": "Jump Squats", "sets": 4, "reps": "15", "rest": 60, "calories": 16, "muscle": "Legs"},
            {"name": "Battle Ropes", "sets": 5, "reps": "30s", "rest": 45, "calories": 22, "muscle": "Full Body"},
            {"name": "TRX Rows", "sets": 3, "reps": "15", "rest": 45, "calories": 10, "muscle": "Back"},
        ],
        "advanced": [
            {"name": "Barbell Complex", "sets": 5, "reps": "6 each movement", "rest": 90, "calories": 35, "muscle": "Full Body"},
            {"name": "Tabata Push-ups", "sets": 8, "reps": "20s on / 10s off", "rest": 10, "calories": 20, "muscle": "Chest"},
            {"name": "Box Jump Burpees", "sets": 5, "reps": "10", "rest": 60, "calories": 28, "muscle": "Full Body"},
        ]
    },
    "muscle_gain": {
        "beginner": [
            {"name": "Dumbbell Bicep Curls", "sets": 3, "reps": "12", "rest": 60, "calories": 5, "muscle": "Biceps"},
            {"name": "Tricep Dips", "sets": 3, "reps": "10", "rest": 60, "calories": 6, "muscle": "Triceps"},
            {"name": "Lat Pulldowns", "sets": 3, "reps": "12", "rest": 60, "calories": 7, "muscle": "Back"},
            {"name": "Chest Fly", "sets": 3, "reps": "12", "rest": 60, "calories": 6, "muscle": "Chest"},
        ],
        "intermediate": [
            {"name": "Barbell Curl", "sets": 4, "reps": "10", "rest": 75, "calories": 7, "muscle": "Biceps"},
            {"name": "Close-grip Bench", "sets": 4, "reps": "10", "rest": 75, "calories": 9, "muscle": "Triceps"},
            {"name": "Cable Rows", "sets": 4, "reps": "12", "rest": 75, "calories": 8, "muscle": "Back"},
            {"name": "Arnold Press", "sets": 4, "reps": "10", "rest": 75, "calories": 8, "muscle": "Shoulders"},
        ],
        "advanced": [
            {"name": "Preacher Curls", "sets": 5, "reps": "8", "rest": 90, "calories": 8, "muscle": "Biceps"},
            {"name": "Skull Crushers", "sets": 5, "reps": "8", "rest": 90, "calories": 9, "muscle": "Triceps"},
            {"name": "T-Bar Rows", "sets": 5, "reps": "8", "rest": 90, "calories": 12, "muscle": "Back"},
            {"name": "Face Pulls", "sets": 4, "reps": "15", "rest": 60, "calories": 6, "muscle": "Rear Delts"},
        ]
    },
    "general_fitness": {
        "beginner": [
            {"name": "Bodyweight Circuit", "sets": 3, "reps": "10 each", "rest": 60, "calories": 50, "muscle": "Full Body"},
            {"name": "Yoga Flow", "sets": 1, "reps": "20 min", "rest": 0, "calories": 80, "muscle": "Flexibility"},
            {"name": "Light Swimming", "sets": 1, "reps": "20 min", "rest": 0, "calories": 150, "muscle": "Full Body"},
        ],
        "intermediate": [
            {"name": "Full Body Circuit", "sets": 4, "reps": "12 each", "rest": 45, "calories": 80, "muscle": "Full Body"},
            {"name": "Functional Training", "sets": 3, "reps": "15", "rest": 60, "calories": 60, "muscle": "Full Body"},
        ],
        "advanced": [
            {"name": "Olympic Lifting Complex", "sets": 5, "reps": "5", "rest": 120, "calories": 40, "muscle": "Full Body"},
            {"name": "CrossFit WOD", "sets": 1, "reps": "AMRAP 20min", "rest": 0, "calories": 400, "muscle": "Full Body"},
        ]
    }
}

WORKOUT_TEMPLATES = {
    "Push Day": ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Dips", "Lateral Raises"],
    "Pull Day": ["Deadlifts", "Pull-ups", "Barbell Rows", "Bicep Curls", "Face Pulls"],
    "Leg Day": ["Barbell Squats", "Romanian Deadlifts", "Leg Press", "Lunges", "Calf Raises"],
    "HIIT Cardio": ["Jump Rope", "Burpees", "Mountain Climbers", "High Knees", "Box Jumps"],
    "Core & Abs": ["Plank Hold", "Russian Twists", "Hanging Leg Raises", "Ab Wheel Rollouts", "Cable Crunches"],
    "Upper Body": ["Bench Press", "Pull-ups", "Overhead Press", "Bicep Curls", "Tricep Extensions"],
    "Lower Body": ["Squats", "Deadlifts", "Lunges", "Leg Curls", "Hip Thrusts"],
    "Full Body": ["Deadlifts", "Push-ups", "Rows", "Squats", "Planks"],
}

def generate_recommendation(
    goal: str,
    fitness_level: str,
    recent_workouts: List[str] = None,
    available_time: int = 45,
    equipment: str = "gym"
) -> Dict:
    """
    AI-powered workout recommendation based on user profile.
    Uses rule-based scoring with randomization for variety.
    """
    goal_map = {
        "weight_loss": "weight_loss",
        "muscle_gain": "muscle_gain",
        "build_muscle": "muscle_gain",
        "lose_weight": "weight_loss",
        "cardio": "cardio",
        "endurance": "cardio",
        "general_fitness": "general_fitness",
        "strength": "strength"
    }

    normalized_goal = goal_map.get(goal, "general_fitness")
    exercises_pool = EXERCISE_LIBRARY.get(normalized_goal, EXERCISE_LIBRARY["general_fitness"])
    level_exercises = exercises_pool.get(fitness_level, exercises_pool.get("beginner", []))

    # Avoid repeating recent workouts
    if recent_workouts:
        level_exercises = [e for e in level_exercises if e["name"] not in recent_workouts] or level_exercises

    # Select 4-6 exercises based on available time
    num_exercises = min(6, max(4, available_time // 10))
    selected = random.sample(level_exercises, min(num_exercises, len(level_exercises)))

    total_calories = sum(
        e["calories"] * e["sets"] for e in selected
    )
    total_duration = sum(
        (e["sets"] * 2 + (e["sets"] - 1) * (e["rest"] / 60)) for e in selected
    )

    # Pick a fitting workout name
    goal_to_template = {
        "strength": ["Push Day", "Pull Day", "Full Body"],
        "cardio": ["HIIT Cardio"],
        "weight_loss": ["HIIT Cardio", "Full Body"],
        "muscle_gain": ["Push Day", "Pull Day", "Leg Day", "Upper Body"],
        "general_fitness": ["Full Body", "Core & Abs"],
    }
    templates = goal_to_template.get(normalized_goal, ["Full Body"])
    workout_name = random.choice(templates)

    # AI rationale
    tips = {
        "weight_loss": f"High-intensity circuit to maximize calorie burn. Keep rest periods short (30-60s) for elevated heart rate.",
        "muscle_gain": f"Progressive overload focus. Aim to increase weight by 2.5-5% each week. Track each set.",
        "cardio": f"Aerobic base building. Stay in 65-75% max heart rate zone for fat oxidation.",
        "strength": f"Neural adaptation focus at {fitness_level} level. Prioritize form over weight.",
        "general_fitness": f"Balanced training stimulus across all fitness components.",
    }

    return {
        "workout_name": workout_name,
        "goal": goal,
        "fitness_level": fitness_level,
        "exercises": selected,
        "estimated_duration": round(total_duration),
        "estimated_calories": total_calories,
        "ai_tip": tips.get(normalized_goal, "Stay consistent and listen to your body."),
        "difficulty_score": {"beginner": 3, "intermediate": 6, "advanced": 9}.get(fitness_level, 5),
        "recommended_days_per_week": {
            "weight_loss": 5,
            "muscle_gain": 4,
            "cardio": 4,
            "strength": 4,
            "general_fitness": 3
        }.get(normalized_goal, 3)
    }

def get_predefined_workouts(fitness_level: str = "beginner") -> List[Dict]:
    """Return a curated list of predefined workout plans."""
    plans = [
        {
            "id": "plan_1",
            "name": "Beginner Full Body",
            "description": "Perfect starting point for building foundational strength and endurance.",
            "duration": 35,
            "level": "beginner",
            "goal": "general_fitness",
            "calories": 220,
            "exercises_count": 5,
            "category": "Full Body",
            "image_key": "fullbody"
        },
        {
            "id": "plan_2",
            "name": "Fat Burner HIIT",
            "description": "High-intensity intervals to torch calories and boost metabolism.",
            "duration": 30,
            "level": "intermediate",
            "goal": "weight_loss",
            "calories": 380,
            "exercises_count": 6,
            "category": "Cardio",
            "image_key": "hiit"
        },
        {
            "id": "plan_3",
            "name": "Muscle Builder Push",
            "description": "Chest, shoulders, and triceps hypertrophy program.",
            "duration": 50,
            "level": "intermediate",
            "goal": "muscle_gain",
            "calories": 280,
            "exercises_count": 6,
            "category": "Strength",
            "image_key": "push"
        },
        {
            "id": "plan_4",
            "name": "Power Legs",
            "description": "Quadriceps, hamstrings, and glutes development.",
            "duration": 55,
            "level": "intermediate",
            "goal": "strength",
            "calories": 320,
            "exercises_count": 6,
            "category": "Strength",
            "image_key": "legs"
        },
        {
            "id": "plan_5",
            "name": "Advanced Strength",
            "description": "Heavy compound movements for experienced lifters.",
            "duration": 70,
            "level": "advanced",
            "goal": "strength",
            "calories": 450,
            "exercises_count": 5,
            "category": "Strength",
            "image_key": "strength"
        },
        {
            "id": "plan_6",
            "name": "Core Destroyer",
            "description": "Complete core and abs strengthening routine.",
            "duration": 25,
            "level": "beginner",
            "goal": "general_fitness",
            "calories": 150,
            "exercises_count": 6,
            "category": "Core",
            "image_key": "core"
        },
    ]

    # Sort by level relevance
    level_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    user_level_val = level_order.get(fitness_level, 0)
    plans.sort(key=lambda x: abs(level_order.get(x["level"], 0) - user_level_val))
    return plans
