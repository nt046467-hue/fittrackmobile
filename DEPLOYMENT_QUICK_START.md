# 🚀 Quick Vercel Deployment Checklist

## What's Done ✅

- [x] Created `/api/index.py` - Vercel serverless function handler
- [x] Updated `/vercel.json` - Proper Vercel configuration
- [x] Created `/requirements.txt` - Root-level dependencies
- [x] Created `/.vercelignore` - Exclude unnecessary files
- [x] Fixed all route imports - Now fully-qualified for serverless
- [x] Fixed database imports - Compatible with package structure

## Next Steps (3 Steps)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Setup Vercel deployment"
git push
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. **Important:** Set root directory to `fittrack`
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
JWT_SECRET_KEY = your-secret-key-here
DATABASE_URL = postgresql://user:password@host:port/db
ENVIRONMENT = production
ALLOWED_ORIGINS = https://your-frontend-url.com
```

## Database Setup

You MUST use PostgreSQL. Options:

- **Neon** (easiest): https://neon.tech
- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **AWS RDS**: https://aws.amazon.com/rds

## Test Your Deployment

After deployment completes:

```
https://your-deployment.vercel.app/health → should return {"status": "healthy"}
https://your-deployment.vercel.app/docs → API documentation
```

## Update Mobile App

In `mobile/utils/api.js`, add:

```javascript
const API_URL = "https://your-deployment.vercel.app";
```

## Troubleshooting

**Error: "Module not found"**
→ Check that `DATABASE_URL` env variable is set

**Error: "Database connection failed"**
→ Verify PostgreSQL database is running and `DATABASE_URL` is correct

**Error: "CORS error"**
→ Add your frontend URL to `ALLOWED_ORIGINS` env variable

**First request is slow**
→ Normal for serverless (cold start). This goes away after a few requests.

## Useful Links

- View Logs: https://vercel.com/dashboard → Deployments → View Details
- Docs: https://your-deployment.vercel.app/docs
- Health Check: https://your-deployment.vercel.app/health

---

**You're all set! Deploy now and your API will be live in seconds!** 🎉
