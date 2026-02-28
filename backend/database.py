from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv
from backend.models import Base

load_dotenv()

# Get database URL from environment or use default
# NOTE: In production (Vercel) you should set DATABASE_URL to a PostgreSQL
# connection string. Falling back to SQLite on a read-only filesystem may fail
# and lead to function crashes. We prefer explicit env var.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # use sqlite for local dev only
    DATABASE_URL = "sqlite:///./fittrack.db"

# Configure engine based on database type
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # Test connections before using them
        connect_args={"connect_timeout": 10}
    )
else:
    # SQLite configuration (for local development)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """Dependency injection for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database by creating all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise
