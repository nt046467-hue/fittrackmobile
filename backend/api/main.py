"""
FastAPI Vercel Serverless Function Wrapper
This file is required for Vercel deployment of FastAPI apps
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

# Vercel serverless function handler
handler = app
