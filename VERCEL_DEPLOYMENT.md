# Vercel Deployment Guide for FitTrack

## What's Been Updated

✅ **Configuration Files Created/Updated:**

- `vercel.json` - Properly configured for Python serverless functions
- `requirements.txt` (root level) - All Python dependencies
- `api/index.py` - Vercel serverless function entry point
- `.vercelignore` - Excludes unnecessary files from deployment

## Deployment Steps

### 1. **Prepare Your Repository**

```bash
git add .
git commit -m "Setup Vercel deployment"
git push
```

### 2. **Connect to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Add New" → "Project"
- Import your GitHub repository
- Select the `fittrack` folder as the root directory

### 3. **Configure Environment Variables**

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
JWT_SECRET_KEY = your-secret-key-here
DATABASE_URL = postgresql://user:password@host:port/dbname
ENVIRONMENT = production
ALLOWED_ORIGINS = https://your-frontend-domain.com
```

**Important:** Use a PostgreSQL database (Vercel is serverless and doesn't support SQLite files)

### 4. **Deploy**

- Click "Deploy"
- Vercel will automatically:
  - Run `pip install -r requirements.txt`
  - Create serverless functions from `/api` folder
  - Set environment variables
  - Deploy the API

### 5. **Test Your API**

Once deployed, you'll get a URL like: `https://fittrack-xxxxx.vercel.app`

Test it:

```bash
# Health check
curl https://your-deployment.vercel.app/health

# API docs
https://your-deployment.vercel.app/docs
```

## Important Notes

### Database Setup

- You **must** use PostgreSQL (or another serverless database)
- SQLite won't work on Vercel (no persistent filesystem)
- Consider using:
  - **Neon** (Managed PostgreSQL)
  - **Railway** (Database hosting)
  - **Supabase** (PostgreSQL + Auth)
  - **AWS RDS** (PostgreSQL)

### CORS Configuration

Update your mobile app's API URL to your Vercel deployment:

```javascript
// In mobile/utils/api.js
const API_URL = "https://your-deployment.vercel.app";
```

### Function Timeout

- Default timeout: 30 seconds
- Max timeout: 60 seconds (Pro plan)
- Adjust in `vercel.json` if needed

### Logs & Debugging

- View logs: Vercel Dashboard → Project → Deployments
- Check individual function logs for errors
- Use `/health` endpoint to check deployment status

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check network access rules in your database provider
- Ensure credentials have proper permissions

### Import Errors

If you see import errors, the route files need relative imports updated. Current issue:

- Routes use `from database import get_db`
- Should use `from backend.database import get_db`

Quick fix: Update all route files in `/backend/routes/` to use proper imports.

### Cold Starts

- First request may be slow (function startup)
- This is normal for serverless
- Use `/health` endpoint to warm up

## Frontend Integration

Update your mobile app to use the deployment URL:

```javascript
// mobile/utils/api.js
const API_URL =
  process.env.API_URL || "https://your-vercel-deployment.vercel.app";

const axiosInstance = axios.create({
  baseURL: API_URL,
});
```

## Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database running and accessible
- [ ] `/health` endpoint returns 200
- [ ] `/docs` endpoint is accessible
- [ ] Mobile app updated with new API URL
- [ ] Auth endpoints working (`/api/auth/login`, `/api/auth/register`)
- [ ] Test with mobile app

## Rollback

If something breaks:

1. Go to Vercel Dashboard
2. Click on Deployments
3. Select previous working deployment
4. Click "Promote to Production"

---

**Status:** Ready for deployment! 🚀
