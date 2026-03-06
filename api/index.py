import sys
import os
import traceback

# Make imports safe so module import never raises — if imports fail we
# export a minimal WSGI handler that returns a helpful 500 with traceback.
_IMPORT_ERROR = None

try:
    # Add parent directory to path to import backend modules
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse

    # diagnostic version info
    import fastapi as _fastapi_pkg
    try:
        import pydantic as _pydantic_pkg
        print(f"[startup] FastAPI {_fastapi_pkg.__version__}, Pydantic {_pydantic_pkg.__version__}")
    except ImportError:
        print("[startup] Pydantic not installed")

    # Import backend modules with proper paths
    from backend.database import init_db
    from backend import models  # Import models to register SQLAlchemy tables
    from backend.routes import auth, workouts, nutrition, progress, social

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

    # Include routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(workouts.router, prefix="/api/workouts", tags=["Workouts"])
    app.include_router(nutrition.router, prefix="/api/nutrition", tags=["Nutrition"])
    app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
    app.include_router(social.router, prefix="/api/social", tags=["Social"])

    @app.get("/")
    async def root():
        return {
            "message": "FitTrack API",
            "status": "running",
            "docs": "/docs"
        }

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__
            }
        )

    # Initialize database on startup
    @app.on_event("startup")
    async def startup_event():
        try:
            init_db()
        except Exception as e:
            print(f"Database initialization warning: {e}")

    # Export FastAPI app as handler for Vercel
    handler = app

except Exception:
    _IMPORT_ERROR = traceback.format_exc()
    print("[IMPORT ERROR] api/index.py failed to import:\n", _IMPORT_ERROR)

    # Fallback WSGI handler so Vercel doesn't fail import-time. This returns
    # a 500 with the traceback so you can quickly see the root cause in the
    # browser while we fix dependencies/configuration.
    def handler(environ, start_response):
        body = ('{"error":"function import failed","detail":' +
                '"Import failure; check logs for details."}')
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json'), ('Content-Length', str(len(body)))]
        start_response(status, headers)
        return [body.encode('utf-8')]
