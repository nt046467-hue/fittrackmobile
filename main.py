"""
This is a compatibility wrapper for Vercel deployment.
It exports the FastAPI app as a ASGI handler.
"""

from backend.main import app

# Vercel needs the app to be exported as 'handler'
handler = app
