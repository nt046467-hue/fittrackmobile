# 📋 Complete Deployment Checklist

## Phase 1: Preparation ✓

- [x] Project structure organized
- [x] .gitignore configured
- [x] Environment variables documented (.env.example)
- [x] Backend optimized for Vercel
- [x] API CORS configured for production
- [x] Dependencies listed in requirements.txt

## Phase 2: GitHub Deployment

### Step 1: Create GitHub Repository

```bash
# Open https://github.com/new
# Repository name: fittrack
# Make sure to NOT initialize with README/gitignore/license
```

### Step 2: Initialize & Push Code

```bash
cd fittrack

# On Windows:
.\deploy.bat

# On macOS/Linux:
bash deploy.sh

# OR manually:
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: FitTrack - AI Fitness Tracking App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fittrack.git
git push -u origin main
```

### Verification

- [ ] Code appears on GitHub
- [ ] All files visible (check .gitignore is working)
- [ ] No sensitive data (.env files) committed
- [ ] README.md displays correctly

## Phase 3: Vercel Backend Deployment

### Step 1: Sign Up / Log In

- Go to [vercel.com](https://vercel.com)
- Sign in with GitHub account

### Step 2: Create New Project

1. Click **New Project**
2. Click **Import Git Repository**
3. Search for and select `fittrack`
4. Click **Import**

### Step 3: Configure Project Settings

**General Settings:**

- **Project Name**: `fittrack` (or your preference)
- **Framework**: Select **Other**
- **Root Directory**: `backend` (use dropdown or type)

**Build & Development Settings:**

- **Build Command**: `pip install -r requirements.txt`
- **Install Command**: `pip install -r requirements.txt`
- **Development Command**: (leave blank)
- **Output Directory**: (leave blank)

### Step 4: Environment Variables

Click **Environment Variables** and add:

```
JWT_SECRET_KEY = [Generate secure random string: use https://generate-secret.vercel.app]
ENVIRONMENT = production
ALLOWED_ORIGINS = https://your-expo-domain.exp.direct
```

**Optional but recommended:**

```
DATABASE_URL = [if using external database like Supabase]
SENTRY_DSN = [if setting up error tracking]
```

### Step 5: Deploy

1. Click **Deploy**
2. Wait for build to complete (1-2 minutes)
3. You'll see deployment URL like: `https://fittrack-xxxxx.vercel.app`

### Verification

- [ ] Deployment successful (blue checkmark)
- [ ] API health check works: `https://your-deployment.vercel.app/health`
- [ ] Docs accessible: `https://your-deployment.vercel.app/docs`

## Phase 4: Mobile App Configuration

### Update API Endpoint

Edit `mobile/utils/api.js`:

```javascript
// Before:
export const BASE_URL = "http://localhost:8000";

// After:
export const BASE_URL = "https://your-deployment.vercel.app";
```

### Test Connection

```bash
cd mobile
npx expo start

# Scan QR code with Expo app
# Test login/signup functionality
```

## Phase 5: Mobile App Deployment (Optional)

### Build APK (Android)

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Build APK
eas build --platform android

# Test with:
# adb install app-release.apk
```

### Build IPA (iOS)

```bash
cd mobile

# Build IPA
eas build --platform ios

# Submit to App Store (requires Apple Developer account)
```

### Publish via Expo

```bash
cd mobile
eas update  # Publish update
npx expo-cli publish  # If using classic Expo
```

## Phase 6: Advanced Configuration

### Custom Domain (Optional)

1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update DNS records
4. HTTPS certificate auto-generated

### Database Upgrade (Recommended for Production)

**From SQLite to PostgreSQL:**

1. Create PostgreSQL database:
   - [Supabase](https://supabase.com) (Free tier available)
   - [Render.com](https://render.com)
   - AWS RDS

2. Update `requirements.txt`:

   ```
   psycopg2-binary==2.9.9
   ```

3. Update Vercel environment:

   ```
   DATABASE_URL = postgresql://user:password@host:port/database
   ```

4. Run migrations in `backend/database.py`

### Monitoring & Logging

1. **Vercel Logs**: Dashboard → Deployments → Logs
2. **Optional: Sentry**:
   ```bash
   pip install sentry-sdk
   ```
   Add to `backend/main.py`:
   ```python
   import sentry_sdk
   sentry_sdk.init("your-sentry-dsn")
   ```

## Phase 7: Security Hardening

- [x] CORS configured
- [ ] JWT_SECRET_KEY is cryptographically secure
- [ ] Database backups configured
- [ ] API rate limiting implemented (optional)
- [ ] Input validation in place
- [ ] SQL injection protection (via SQLAlchemy ORM)
- [ ] HTTPS enforced (automatic on Vercel)

## Phase 8: CI/CD Pipeline

GitHub Actions configured to:

- Run on every push to `main` and `develop`
- Test Python backend
- Validate React Native code
- Auto-deploy to Vercel on main branch

View workflows:

```
.github/workflows/
├── ci-cd.yml          # Testing & linting
└── deploy-vercel.yml  # Auto-deployment
```

To enable auto-deployment, configure secrets:

1. Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `VERCEL_TOKEN`: Get from Vercel account settings
   - `VERCEL_ORG_ID`: Get from Vercel project settings
   - `VERCEL_PROJECT_ID`: Get from Vercel project URL

## Troubleshooting

### Vercel Deployment Fails

```bash
# Check locally first
cd backend
pip install -r requirements.txt
python main.py

# Check logs
vercel logs  # If Vercel CLI installed
```

### CORS Errors

```python
# In backend/main.py, verify:
- ALLOWED_ORIGINS includes your Expo URL
- Mobile app uses correct BASE_URL
```

### Database Connection Issues

```bash
# Check DATABASE_URL format
# Verify database is accessible from Vercel region
# Consider using cloud database instead of SQLite
```

### Mobile App Connection

```bash
# Test API endpoint
curl https://your-deployment.vercel.app/health

# Check Mobile app logs:
expo logs
```

## Useful Commands

```bash
# Local development
cd backend && uvicorn main:app --reload
cd mobile && npx expo start

# Git operations
git add .
git commit -m "message"
git push

# Vercel CLI (if installed)
npm install -g vercel
vercel login
vercel deploy
vercel logs

# Database
sqlite3 backend/fittrack.db ".tables"

# Environment
cp .env.example .env
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

## Post-Deployment

### Monitor Performance

- Check Vercel Analytics
- Monitor API response times
- Track user engagement (if added)

### Plan Updates

- Regular security patches
- Feature releases
- Bug fixes

### Backup Data

- Configure database backups
- Export user data periodically
- Maintain git history

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Native Docs](https://reactnative.dev)
- [GitHub Docs](https://docs.github.com)
- [Expo Docs](https://docs.expo.dev)

---

**Congratulations!** Your FitTrack app is now deployed to GitHub and Vercel! 🎉
