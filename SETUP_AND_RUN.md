# 🚀 FitTrack Setup & Run Guide

Your project is now workable! Here's how to get it running.

## Prerequisites

Make sure you have installed:

- **Node.js** (v14+): Download from [nodejs.org](https://nodejs.org)
- **Python** (v3.8+): Download from [python.org](https://www.python.org) (for backend only)
- **Git**: Download from [git-scm.com](https://git-scm.com)

## Quick Start (Local Development)

### 1. Backend Setup (Python)

```bash
# Navigate to backend directory
cd fittrack/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**

```
Uvicorn running on http://0.0.0.0:8000
API docs available at http://localhost:8000/docs
```

### 2. Mobile App Setup (React Native/Expo)

In a **NEW terminal**:

```bash
# Navigate to mobile directory
cd fittrack/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Then:**

- Press `w` for web preview (browser)
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo app to run on physical device

### 3. Test the Setup

- **Backend API:** Open http://localhost:8000/docs
- **Mobile App:** Press `w` in the Expo terminal to view in browser

## Configuration

### Environment Variables (Backend)

File: `fittrack/backend/.env` (already created)

```env
JWT_SECRET_KEY=fittrack-dev-secret-key-change-in-production
DATABASE_URL=sqlite:///./fittrack.db
ENVIRONMENT=development
```

For production (e.g., Vercel):

```env
JWT_SECRET_KEY=your-super-secret-key
DATABASE_URL=postgresql://user:password@host/dbname
ENVIRONMENT=production
```

### Mobile API URL

File: `fittrack/mobile/utils/api.js`

For **local development:**

```javascript
export const BASE_URL = "http://localhost:8000";
```

For **local on physical device** (replace with your machine IP):

```javascript
export const BASE_URL = "http://192.168.1.100:8000";
```

Find your IP with:

```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

## Project Structure

```
fittrack/
├── backend/           # Python FastAPI backend
│   ├── main.py       # Entry point
│   ├── database.py   # Database configuration
│   ├── models.py     # SQLAlchemy models
│   ├── routes/       # API endpoints
│   ├── auth_utils.py # JWT & password utilities
│   ├── ai_engine.py  # Workout recommendations
│   └── requirements.txt
├── mobile/           # React Native/Expo app
│   ├── App.js        # Entry point
│   ├── screens/      # UI screens
│   ├── navigation/   # React Navigation setup
│   ├── utils/        # API client & theme
│   ├── package.json
│   └── app.json      # Expo configuration
└── api/              # Vercel deployment wrapper
```

## API Endpoints

Once backend is running, visit: **http://localhost:8000/docs**

### Main Endpoints:

- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /workouts` - Get workout history
- `POST /workouts/recommend` - Get AI recommendations
- `GET /nutrition/foods` - Search foods
- `GET /progress/summary` - View progress

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check if port 8000 is available
# If not, use: uvicorn main:app --port 8001
```

### Mobile app won't load

```bash
# Clear cache
cd fittrack/mobile
rm -rf node_modules package-lock.json
npm install

# Restart Expo
npx expo start --clear
```

### API connection issues

1. Check backend is running on http://localhost:8000
2. For physical device, use your machine's IP address instead of localhost
3. Check firewall isn't blocking port 8000

## Deployment

### Deploy Backend to Vercel

1. Push code to GitHub
2. Go to **vercel.com/new**
3. Import your repository
4. Set **Root Directory** to `backend`
5. Add environment variables
6. Deploy!

### Deploy Mobile to Expo

```bash
cd fittrack/mobile
npx expo publish
```

## Making Changes

### Backend Changes

- Edit files in `fittrack/backend/routes/`
- Server auto-reloads with `--reload` flag

### Mobile Changes

- Edit files in `fittrack/mobile/screens/` or `utils/`
- Expo hot-reloads automatically

## Next Steps

- [ ] Test authentication (Signup/Login)
- [ ] Try AI workout recommendations
- [ ] Log a workout
- [ ] Check dashboard statistics
- [ ] Deploy to Vercel (backend)
- [ ] Upgrade database to PostgreSQL for production

---

**Need help?** Check the API documentation at http://localhost:8000/docs

**Happy coding! 🎉**
