# 🏋️ FitTrack Mobile

> A production-ready AI-powered fitness tracking app built with React Native (Expo) + Python FastAPI.
> Fully deployable to GitHub and Vercel!

## ⚡ Quick Deployment

### Prerequisites

- Git
- GitHub account
- Vercel account (free)
- Python 3.11+ (for local backend)
- Node.js 18+ (for mobile development)

### 1️⃣ Deploy to GitHub

#### On Windows:

```bash
cd fittrack
.\deploy.bat
```

#### On macOS/Linux:

```bash
cd fittrack
bash deploy.sh
```

#### Manual steps:

```bash
git init
git add .
git commit -m "Initial commit: FitTrack App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fittrack.git
git push -u origin main
```

### 2️⃣ Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository**
3. Choose your `fittrack` GitHub repository
4. Configure:
   - **Root Directory**: `/backend`
   - **Framework Preset**: Select "Other"
   - **Build Command**: `pip install -r requirements.txt`
5. Add Environment Variables:
   - `JWT_SECRET_KEY`: Generate a secure random key
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: Your Expo app URL
6. Click **Deploy**

### 3️⃣ Update Mobile App

After deployment, update the API endpoint:

Edit `mobile/utils/api.js`:

```javascript
export const BASE_URL = "https://your-vercel-deployment.vercel.app";
```

## 📁 Project Structure

```
fittrack/
├── backend/              # FastAPI server
│   ├── main.py
│   ├── routes/           # API endpoints
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── requirements.txt  # Python dependencies
│   └── database.py
├── mobile/               # React Native (Expo)
│   ├── screens/          # App screens
│   ├── navigation/       # Navigation config
│   ├── utils/            # Utilities & API
│   ├── package.json
│   └── app.json
├── .gitignore
├── vercel.json           # Vercel deployment config
├── DEPLOYMENT.md         # Detailed deployment guide
└── README.md
```

## ✨ Features

- ✅ JWT Authentication (Login/Signup)
- ✅ Dashboard with stats, calories, progress charts
- ✅ AI workout recommendations
- ✅ Nutrition tracking with macros
- ✅ Social feed with likes and posts
- ✅ Dark theme with gradient UI
- ✅ Production-ready deployment

## 🚀 Quick Start (Local Development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Update API URL in mobile/utils/api.js (if running on physical device)
# Change: export const BASE_URL = 'http://YOUR_LOCAL_IP:8000';

# Start Expo dev server
npx expo start

# Options:
# - Press 'a' for Android
# - Press 'i' for iOS
# - Press 'w' for Web
```

## 📚 API Endpoints

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/auth/register`      | User registration      |
| POST   | `/auth/login`         | User login             |
| GET    | `/health`             | Health check           |
| GET    | `/workouts`           | Get all workouts       |
| POST   | `/workouts/recommend` | Get AI recommendations |
| POST   | `/workouts/log`       | Log a workout          |
| GET    | `/nutrition`          | Get nutrition logs     |
| POST   | `/nutrition/meal`     | Log a meal             |
| GET    | `/progress`           | Get progress stats     |
| GET    | `/social/feed`        | Get social feed        |
| POST   | `/social/post`        | Create a post          |
| POST   | `/social/like/{id}`   | Like a post            |

## 🛠 Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database
- **SQLite** - Lightweight database (dev), upgrade to PostgreSQL for production
- **JWT** - Secure authentication
- **Pydantic** - Data validation

### Mobile

- **React Native** - Cross-platform mobile development
- **Expo** - React Native framework
- **React Navigation v6** - Navigation management
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **react-native-chart-kit** - Data visualization

## 📝 Environment Variables

### Backend (.env)

```env
# Security
JWT_SECRET_KEY=your-super-secret-key-change-this

# Database
DATABASE_URL=sqlite:///./fittrack.db

# Server
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=production

# CORS
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://your-expo-app.exp.direct
```

### Mobile Config

Update in `mobile/utils/api.js`:

```javascript
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
```

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET_KEY` in production
- [ ] Use strong database credentials
- [ ] Enable HTTPS (automated on Vercel)
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Add rate limiting (optional)
- [ ] Implement API key validation (optional)
- [ ] Set up monitoring/logging

## 📊 Database Setup

### Local Development (SQLite)

```bash
# Database automatically created on first run
# Located at: backend/fittrack.db
```

### Production (Recommended: PostgreSQL)

1. Set up PostgreSQL database (e.g., AWS RDS, Render.com)
2. Update `DATABASE_URL` in Vercel environment variables
3. Update `backend/requirements.txt` to include `psycopg2-binary`
4. Update `backend/database.py` connection string

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**

```bash
# Change port in main.py or use environment variable
export API_PORT=8001
```

**Database errors:**

```bash
# Delete database and restart
rm backend/fittrack.db
```

**CORS errors:**

- Ensure API_URL in mobile app matches backend URL
- Check `ALLOWED_ORIGINS` in backend/main.py

### Mobile Issues

**Cannot connect to backend:**

- Check that backend is running
- Verify API URL is correct
- Check network connectivity
- For physical device: use `http://YOUR_IP:8000` instead of localhost

**Expo errors:**

```bash
expo doctor  # Diagnose issues
npm install  # Reinstall dependencies
```

## 🌐 Deploy as Web Application

To add a web dashboard:

1. Create additional React app in `web/` directory
2. Deploy to Vercel as separate project
3. Configure API endpoint to use backend

## 📦 Build for Production

### Android APK

```bash
cd mobile
eas build --platform android --non-interactive
```

### iOS IPA

```bash
cd mobile
eas build --platform ios --non-interactive
```

## 🚢 CI/CD Pipeline

GitHub Actions workflow configured for:

- ✅ Automatic testing on push
- ✅ Python backend linting
- ✅ Node.js mobile validation
- ✅ Auto-deploy to Vercel on main branch push

Configure in **GitHub** → **Settings** → **Secrets**:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Vercel Python Support](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)
- [React Navigation Guide](https://reactnavigation.org/)

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

Created for fitness enthusiasts by passionate developers!

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
