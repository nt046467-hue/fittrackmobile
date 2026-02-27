# 🏋️ FitTrack Mobile

> A production-ready AI-powered fitness tracking app built with React Native (Expo) + Python FastAPI.

## Features
- JWT Authentication (Login/Signup)
- Dashboard with stats, calories, progress charts
- AI workout recommendations based on goal & level
- Nutrition tracking with macros
- Social feed with likes and posts
- Dark theme with gradient UI

## Quick Start

### Backend
```bash
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile
```bash
cd mobile && npm install
# Set API_URL in constants/theme.js to your local IP
npx expo start
```

## API Endpoints
- POST /auth/register & /auth/login
- GET/POST /workouts, /workouts/recommend, /workouts/log
- GET/POST /nutrition, /nutrition/meal
- GET /progress
- GET/POST /social/feed, /social/post, /social/like/{id}

## Tech Stack
- React Native (Expo) + React Navigation v6
- Python FastAPI + SQLite (SQLAlchemy)
- JWT Auth (python-jose)
- react-native-chart-kit for charts
