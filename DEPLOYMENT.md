# FitTrack Deployment Guide

## GitHub Setup

### Prerequisites

- GitHub account
- Git installed locally
- Git configured with your credentials

### Steps

1. **Create a new repository on GitHub**
   - Go to github.com/new
   - Name it `fittrack` (or your preferred name)
   - Add description: "AI-powered fitness tracking app with React Native & FastAPI"
   - Make it Public or Private
   - Don't initialize with README (we already have one)

2. **Initialize local git repository**

   ```bash
   cd fittrack
   git init
   git add .
   git commit -m "Initial commit: Full-stack fitness tracking app"
   ```

3. **Add remote and push**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fittrack.git
   git push -u origin main
   ```

## Vercel Deployment (Backend Only)

### Prerequisites

- Vercel account (free tier available)
- GitHub repository connected

### Steps

1. **Backend Setup (Python FastAPI)**

   a. Update `backend/requirements.txt` to include Vercel requirements:

   ```
   fastapi==0.104.1
   uvicorn[standard]==0.24.0
   sqlalchemy==2.0.23
   pydantic==2.5.0
   python-jose[cryptography]==3.3.0
   python-multipart==0.0.6
   ```

   b. Ensure `backend/main.py` is properly configured:
   - Set CORS for your Vercel domain
   - Use environment variables for secrets

2. **Vercel Configuration**

   a. Go to vercel.com and sign in with GitHub

   b. Click "New Project" → "Import Git Repository"
   - Select your fittrack repository

   c. Configure Project Settings:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: Leave blank
   - **Install Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0`

3. **Environment Variables in Vercel**

   In Vercel Project Settings → Environment Variables, add:

   ```
   JWT_SECRET_KEY = your-production-secret-key
   DATABASE_URL = your-database-url
   ENVIRONMENT = production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your backend
   - Get your API URL from the deployment (e.g., `https://fittrack-backend.vercel.app`)

### Update Mobile App

In `mobile/utils/api.js` or wherever API_URL is defined, update:

```javascript
const API_URL = "https://fittrack-backend.vercel.app";
```

## Mobile App Distribution

The React Native mobile app can be distributed via:

1. **Expo** (Recommended for testing)

   ```bash
   cd mobile
   npx expo publish
   ```

2. **Build APK/IPA**

   ```bash
   # For Android APK
   eas build --platform android --non-interactive

   # For iOS IPA
   eas build --platform ios --non-interactive
   ```

3. **App Stores**
   - Google Play Store (Android)
   - Apple App Store (iOS)
   - Follow EAS Build documentation for submission

## Production Checklist

- [ ] GitHub repository created and code pushed
- [ ] Backend environment variables configured in Vercel
- [ ] Database connection configured
- [ ] JWT secret key set (production grade)
- [ ] CORS properly configured for Vercel domain
- [ ] Mobile app points to correct API_URL
- [ ] .env files added to .gitignore
- [ ] README updated with deployment info
- [ ] Database migrations handled
- [ ] Error logging configured
- [ ] Monitoring/Analytics set up (optional)

## Troubleshooting

### Vercel Backend Errors

- Check logs: `vercel logs fittrack-backend`
- Ensure all dependencies in requirements.txt
- SQLite database must use relative path or environment-specific solution

### Mobile App API Errors

- Verify API_URL matches Vercel deployment URL
- Check CORS settings in FastAPI backend
- Test with curl: `curl https://your-vercel-url/health`

### Git Push Issues

- Verify GitHub remote: `git remote -v`
- Check git credentials: `git config user.email`
- For authentication issues, use GitHub token or SSH keys

## Additional Resources

- [FastAPI Vercel Deployment](https://vercel.com/guides/using-express-with-vercel)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Guide](https://reactnavigation.org/)
