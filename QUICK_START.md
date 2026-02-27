# ⚡ Quick Start: 5-Minute Deployment

## For the Impatient Developer

### 1. GitHub (2 minutes)

```bash
cd fittrack-mobile/fittrack

# Initialize git
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "FitTrack App"

# Create repo on https://github.com/new (don't initialize it)
# Then run:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fittrack.git
git push -u origin main
```

### 2. Vercel (2 minutes)

1. Go to **vercel.com/new**
2. Click **Import Git Repository** → Select **fittrack**
3. Set **Root Directory** → `backend`
4. Add Environment Variables:
   ```
   JWT_SECRET_KEY = your-secret-here
   ENVIRONMENT = production
   ```
5. Click **Deploy** ✅

**Your API is live at:** `https://fittrack-xxxxx.vercel.app`

### 3. Update Mobile (1 minute)

Edit `mobile/utils/api.js`:

```javascript
export const BASE_URL = "https://fittrack-xxxxx.vercel.app";
```

Done! 🎉

---

## Testing

```bash
# Test API
curl https://fittrack-xxxxx.vercel.app/health

# Test mobile
cd mobile
npx expo start
```

---

## Next Steps (Optional)

- [ ] Add GitHub Secrets for auto-deployment
- [ ] Upgrade database to PostgreSQL
- [ ] Set up custom domain
- [ ] Deploy mobile app to stores

See **DEPLOYMENT_CHECKLIST.md** for detailed instructions.
