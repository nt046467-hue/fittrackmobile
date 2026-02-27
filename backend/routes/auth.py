from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from auth_utils import hash_password, verify_password, create_token, get_current_user
from models import User

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
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hashed,
        goal=req.goal,
        fitness_level=req.fitness_level,
        weight=req.weight,
        height=req.height,
        age=req.age
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id, user.email)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "goal": user.goal,
            "fitness_level": user.fitness_level
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id, user.email)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "goal": user.goal,
            "fitness_level": user.fitness_level,
            "weight": user.weight,
            "height": user.height,
            "age": user.age
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "goal": user.goal,
        "fitness_level": user.fitness_level,
        "weight": user.weight,
        "height": user.height,
        "age": user.age,
        "created_at": user.created_at
    }

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    fields = {k: v for k, v in req.dict().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in fields.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated"}
