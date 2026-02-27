@echo off
REM FitTrack Deployment Setup Script for Windows

echo 🚀 FitTrack Deployment Setup
echo =============================

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    exit /b 1
)

REM Initialize Git if not already done
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git config user.email "your-email@example.com"
    git config user.name "Your Name"
) else (
    echo ✅ Git repository already initialized
)

REM Add all files
echo 📝 Adding files to Git...
git add .

REM Create initial commit
echo 💾 Creating initial commit...
git commit -m "Initial commit: FitTrack - AI-powered fitness tracking app"

REM Guide for remote
echo.
echo 📌 Next Steps:
echo ==============
echo.
echo 1. Create a repository on GitHub:
echo    - Go to https://github.com/new
echo    - Repository name: fittrack
echo    - Do NOT initialize with README, .gitignore, or license
echo.
echo 2. After creating, add remote and push:
echo    git remote add origin https://github.com/YOUR_USERNAME/fittrack.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy to Vercel:
echo    - Go to https://vercel.com/new
echo    - Import your GitHub repository
echo    - Select 'backend' as root directory
echo    - Add environment variables in Vercel dashboard
echo    - Deploy!
echo.
echo 4. Update mobile app API endpoint:
echo    - Edit mobile/utils/api.js
echo    - Change BASE_URL to your Vercel deployment URL
echo.
