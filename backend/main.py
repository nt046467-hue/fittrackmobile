import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db
import models  # Import models to register SQLAlchemy tables
from routes import auth, workouts, nutrition, progress, social

# Initialize database on startup
try:
    init_db()
except Exception as e:
    print(f"Database initialization warning: {e}")

app = FastAPI(
    title="FitTrack API",
    description="Production-ready fitness tracking backend",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Configure CORS for development and production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8100",
    "http://localhost:19000",
    "http://localhost:19001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:19000",
    "http://127.0.0.1:19001",
]

# Add production URLs from environment
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins.extend([url.strip() for url in env_origins.split(",") if url.strip()])

# Allow Vercel domain
vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to FitTrack API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FitTrack API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(workouts.router, prefix="/workouts", tags=["Workouts"])
app.include_router(nutrition.router, prefix="/nutrition", tags=["Nutrition"])
app.include_router(progress.router, prefix="/progress", tags=["Progress"])
app.include_router(social.router, prefix="/social", tags=["Social"])

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# This is required for Vercel
handler = app
