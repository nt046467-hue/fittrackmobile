from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_db
from auth_utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    goal: str = "general_fitness"
    fitness_level: str = "beginner"
    weight: float = None
    height: float = None
    age: int = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: str = None
    goal: str = None
    fitness_level: str = None
    weight: float = None
    height: float = None
    age: int = None

@router.post("/register")
def register(req: RegisterRequest):
    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    cursor = db.execute(
        "INSERT INTO users (name, email, password_hash, goal, fitness_level, weight, height, age) VALUES (?,?,?,?,?,?,?,?)",
        (req.name, req.email, hashed, req.goal, req.fitness_level, req.weight, req.height, req.age)
    )
    db.commit()
    user_id = cursor.lastrowid
    token = create_token(user_id, req.email)
    db.close()

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "goal": req.goal,
            "fitness_level": req.fitness_level
        }
    }

@router.post("/login")
def login(req: LoginRequest):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"])
    db.close()

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "goal": user["goal"],
            "fitness_level": user["fitness_level"],
            "weight": user["weight"],
            "height": user["height"],
            "age": user["age"]
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (current_user["user_id"],)).fetchone()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "goal": user["goal"],
        "fitness_level": user["fitness_level"],
        "weight": user["weight"],
        "height": user["height"],
        "age": user["age"],
        "created_at": user["created_at"]
    }

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    fields = {k: v for k, v in req.dict().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [current_user["user_id"]]
    db.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
    db.commit()
    db.close()
    return {"message": "Profile updated"}
