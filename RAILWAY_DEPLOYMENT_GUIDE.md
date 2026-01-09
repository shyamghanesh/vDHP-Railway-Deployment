# vDHP Platform - Complete Railway Deployment Guide 🚀

> **Step-by-step instructions to deploy the complete vDHP (Virtual Digital Health Platform) to Railway cloud and build the mobile app APK**

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Architecture Overview](#-architecture-overview)
3. [Phase 1: Prepare Your Code](#-phase-1-prepare-your-code)
4. [Phase 2: Create Railway Project](#-phase-2-create-railway-project)
5. [Phase 3: Deploy PostgreSQL Database](#-phase-3-deploy-postgresql-database)
6. [Phase 4: Deploy Hospital Web App Backend](#-phase-4-deploy-hospital-web-app-backend)
7. [Phase 5: Deploy Patient Mobile App Backend](#-phase-5-deploy-patient-mobile-app-backend)
8. [Phase 6: Run Database Migrations](#-phase-6-run-database-migrations)
9. [Phase 7: Verify Backend Deployments](#-phase-7-verify-backend-deployments)
10. [Phase 8: Deploy Hospital Web Frontend (Optional)](#-phase-8-deploy-hospital-web-frontend-optional)
11. [Phase 9: Build Mobile App APK](#-phase-9-build-mobile-app-apk)
12. [Troubleshooting](#-troubleshooting)

---

## 📌 Prerequisites

Before starting, ensure you have:

| Requirement | Description | How to Get |
|-------------|-------------|------------|
| **Railway Account** | Free tier available | [railway.app](https://railway.app) |
| **GitHub Account** | To connect your repository | [github.com](https://github.com) |
| **Code Pushed to GitHub** | Your vDHP project on GitHub | See [Push to GitHub](#step-11-push-code-to-github) |
| **Node.js 18+** | For building the mobile app | [nodejs.org](https://nodejs.org) |
| **JDK 17** | For Android APK builds | [Adoptium](https://adoptium.net) |
| **Android SDK** | For APK builds | [Android Studio](https://developer.android.com/studio) |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Railway Cloud Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────┐      ┌─────────────────────┐                │
│  │  Hospital Web App  │      │  Patient Mobile App │                │
│  │     (Frontend)     │      │      Backend        │                │
│  │  Vite + React      │      │     (FastAPI)       │                │
│  │  Static Hosting    │      │     Port: $PORT     │                │
│  └─────────┬──────────┘      └──────────┬──────────┘                │
│            │                             │                           │
│            │    ┌────────────────────┐   │                           │
│            └────►  Hospital Web App  ◄───┘                           │
│                 │     (Backend)      │                               │
│                 │    (FastAPI)       │                               │
│                 │    Port: $PORT     │                               │
│                 └─────────┬──────────┘                               │
│                           │                                           │
│               ┌───────────▼───────────┐                              │
│               │   PostgreSQL Database │                              │
│               │   (Shared Instance)   │                              │
│               └───────────────────────┘                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────┐
                            │  Patient Mobile App │
                            │    (APK Built       │
                            │     Locally)        │
                            │   Connects to       │
                            │   Patient Backend   │
                            └─────────────────────┘
```

**Services to Deploy:**
1. **PostgreSQL Database** - Shared database for both backends
2. **Hospital Web App Backend** - FastAPI backend for hospital staff
3. **Patient Mobile App Backend** - FastAPI backend for patients
4. **Hospital Web Frontend** (Optional) - React/Vite frontend

**Built Locally:**
- **Patient Mobile App APK** - Built after backend URLs are known

---

## 📦 Phase 1: Prepare Your Code

### Step 1.1: Push Code to GitHub

If not already done, push your code to GitHub:

```powershell
# Navigate to your project
cd "C:\Users\Shyam\Desktop\Virtusa\vDHP Deployment"

# Initialize git if needed
git init

# Add your remote
git remote add origin https://github.com/YOUR_USERNAME/vDHP-Deployment.git

# Add all files and commit
git add .
git commit -m "Initial commit for Railway deployment"

# Push to GitHub
git push -u origin main
```

### Step 1.2: Generate JWT Secret Key

You'll need a secure secret key for authentication. Generate one:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

> **📝 Save this key!** You'll need it for both backends. Example output:
> ```
> a3f8b7c9d2e4f6a8b0c1d3e5f7a9b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6
> ```

---

## 🚂 Phase 2: Create Railway Project

### Step 2.1: Sign in to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → Sign in with GitHub
3. Authorize Railway to access your GitHub account

### Step 2.2: Create New Project

1. Click **"+ New Project"** (top right)
2. Select **"Empty Project"**
3. Click on the project name (top left) → Rename it to: `vDHP Platform`

![Railway Dashboard](https://railway.app/brand/logotype-dark.png)

---

## 🗄️ Phase 3: Deploy PostgreSQL Database

### Step 3.1: Add PostgreSQL Service

1. In your Railway project, click **"+ New"**
2. Click **"Database"**
3. Select **"Add PostgreSQL"**
4. Wait for the database to provision (takes ~30 seconds)

### Step 3.2: Get Database Connection Details

1. Click on the **PostgreSQL** service card
2. Go to the **"Data"** tab to verify it's running
3. Go to the **"Variables"** tab
4. Find and copy **`DATABASE_URL`** (you'll need this later)

> **Example DATABASE_URL:**
> ```
> postgresql://postgres:PASSWORD@HOST.railway.internal:5432/railway
> ```

### Step 3.3: Enable Public Networking (Optional)

If you need to connect from outside Railway (e.g., for local testing):

1. Click on the PostgreSQL service
2. Go to **"Settings"** tab
3. Under **"Networking"** → Click **"Generate Domain"**
4. Use this public URL for external connections

---

## 🏥 Phase 4: Deploy Hospital Web App Backend

### Step 4.1: Add Backend Service from GitHub

1. Click **"+ New"** in your Railway project
2. Click **"GitHub Repo"**
3. Select your repository: `vDHP-Deployment`
4. Railway will detect your code

### Step 4.2: Configure Service Settings

1. Click on the newly created service
2. Go to **"Settings"** tab
3. Configure:

| Setting | Value |
|---------|-------|
| **Service Name** | `hospital-backend` |
| **Root Directory** | `vDHP Web App Hospital/backend` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

### Step 4.3: Configure Environment Variables

1. Go to the **"Variables"** tab
2. Click **"+ New Variable"** for each:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET_KEY` | Your generated secret from Step 1.2 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `ENVIRONMENT` | `production` |
| `AUTO_CREATE_TABLES` | `true` |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `*` |

> **💡 Tip:** Use `${{Postgres.DATABASE_URL}}` to automatically link to your PostgreSQL service.

### Step 4.4: Generate Public Domain

1. Go to **"Settings"** tab
2. Under **"Networking"** section
3. Click **"Generate Domain"**
4. Note down your URL: `https://hospital-backend-xxxxxx.railway.app`

### Step 4.5: Trigger Deployment

1. Railway auto-deploys from GitHub
2. Click the **"Deployments"** tab to watch progress
3. Wait for the deployment to show **"Success"** ✅

---

## 📱 Phase 5: Deploy Patient Mobile App Backend

### Step 5.1: Add Another Service from GitHub

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the **same repository**: `vDHP-Deployment`

### Step 5.2: Configure Service Settings

1. Go to **"Settings"** tab
2. Configure:

| Setting | Value |
|---------|-------|
| **Service Name** | `patient-backend` |
| **Root Directory** | `vDHP Mobile App Patient` |
| **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |

### Step 5.3: Configure Environment Variables

1. Go to the **"Variables"** tab
2. Add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET_KEY` | **SAME as hospital-backend!** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `ENVIRONMENT` | `production` |
| `AUTO_CREATE_TABLES` | `true` |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `*` |

> ⚠️ **CRITICAL:** The `JWT_SECRET_KEY` **MUST be identical** to the Hospital Backend! This ensures authentication tokens work across both services.

### Step 5.4: Generate Public Domain

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Note down your URL: `https://patient-backend-xxxxxx.railway.app`

### Step 5.5: Wait for Deployment

Watch the **"Deployments"** tab for success status.

---

## 🔧 Phase 6: Run Database Migrations

The backends are configured to auto-create tables (`AUTO_CREATE_TABLES=true`), but you may want to seed initial data.

### Option A: Use Auto-Create (Recommended for First Deploy)

Both backends will automatically create required tables on startup. Check the deployment logs to confirm tables were created.

### Option B: Run Seed Data Script

1. Clone your repo locally
2. Install dependencies:

```powershell
cd "vDHP Deployment\database"
pip install psycopg2-binary python-dotenv
```

3. Create a `.env` file with your DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@your-host.railway.app:5432/railway
```

4. Run the seed script:

```powershell
python seed_data.py
```

### Option C: Connect via Railway CLI

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway connect postgres
```

Then run SQL commands:

```sql
-- In the PostgreSQL shell
\i database/migrations/sql/V1__Initial_Schema.sql
\i database/migrations/sql/V2__Seed_Data.sql
```

---

## ✅ Phase 7: Verify Backend Deployments

### Step 7.1: Test Health Endpoints

Test both backends are running:

```powershell
# Test Hospital Backend
curl https://your-hospital-backend.railway.app/health

# Test Patient Backend
curl https://your-patient-backend.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### Step 7.2: Test Authentication

```powershell
# Create a test doctor account
curl -X POST https://your-hospital-backend.railway.app/auth/signup `
  -H "Content-Type: application/json" `
  -d '{\"email\": \"testdoctor@hospital.com\", \"password\": \"Test@123456\", \"name\": \"Dr. Test\", \"role\": \"doctor\"}'
```

### Step 7.3: Check API Documentation

Visit these URLs in your browser:
- Hospital API Docs: `https://your-hospital-backend.railway.app/docs`
- Patient API Docs: `https://your-patient-backend.railway.app/docs`

---

## 🌐 Phase 8: Deploy Hospital Web Frontend (Optional)

If you want to host the web frontend on Railway:

### Step 8.1: Update Frontend Configuration

Edit `vDHP Web App Hospital/src/config.ts`:

```typescript
// Update the production URL
if (import.meta.env.PROD) {
    return 'https://your-hospital-backend.railway.app';  // Your actual URL
}
```

Commit and push changes:

```powershell
git add .
git commit -m "Update production API URL"
git push
```

### Step 8.2: Add Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Service Name** | `hospital-frontend` |
| **Root Directory** | `vDHP Web App Hospital` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npx serve dist -s -l $PORT` |

4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://your-hospital-backend.railway.app` |

5. Generate domain and deploy

---

## 📲 Phase 9: Build Mobile App APK

> **⚠️ IMPORTANT:** Build the APK **AFTER** deploying backends, as you need the production URLs.

### Step 9.1: Update API Configuration

Edit `vDHP Mobile App Patient/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-patient-backend.railway.app
```

Or create the file if it doesn't exist:

```powershell
cd "vDHP Mobile App Patient"
echo "EXPO_PUBLIC_API_URL=https://your-patient-backend.railway.app" > .env
```

### Step 9.2: Install Dependencies

```powershell
cd "vDHP Mobile App Patient"
npm install
```

### Step 9.3: Pre-Build Setup

```powershell
# Generate native Android project
npx expo prebuild --platform android
```

### Step 9.4: Build APK

#### Option A: Using EAS Build (Recommended - No local Android SDK needed)

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

Configuration for `eas.json` (create if needed):

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### Option B: Local Build (Requires Android SDK + JDK 17)

1. Set up environment:

```powershell
# Set JAVA_HOME to JDK 17
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

2. Build:

```powershell
cd android
./gradlew assembleRelease
```

3. Find APK at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 9.5: Test the APK

1. Transfer APK to your Android device
2. Enable "Install from unknown sources"
3. Install and launch the app
4. Login with test credentials:

| Email | Password |
|-------|----------|
| `demo@vdhp.com` | `password123` |

---

## 🔍 Troubleshooting

### Database Connection Errors

**Symptom:** Backend fails with "connection refused"

**Solutions:**
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
2. Ensure PostgreSQL service is running (check Railway dashboard)
3. Try regenerating the database service

### JWT Authentication Failures

**Symptom:** Login works on one backend but tokens don't work on the other

**Solution:** Ensure both backends have **identical** `JWT_SECRET_KEY` values

### Build Failures

**Symptom:** Railway build fails

**Solutions:**
1. Check deployment logs in Railway
2. Verify `requirements.txt` exists in the root directory
3. Ensure `Root Directory` is set correctly

### Mobile App Can't Connect

**Symptom:** App shows network errors

**Solutions:**
1. Verify `EXPO_PUBLIC_API_URL` is set correctly in `.env`
2. Rebuild the app after changing `.env`
3. Check if the backend URL is accessible in a browser
4. Ensure CORS is configured (`CORS_ORIGINS=*`)

### Health Check Failures

**Symptom:** Railway shows service as unhealthy

**Solutions:**
1. Verify the `/health` endpoint exists
2. Check the `healthcheckPath` in settings
3. Increase `healthcheckTimeout` to 60 seconds

---

## 📊 Quick Reference

### Your Railway URLs (Fill in after deployment)

| Service | URL |
|---------|-----|
| Hospital Backend | `https://______________________________.railway.app` |
| Patient Backend | `https://______________________________.railway.app` |
| Hospital Frontend | `https://______________________________.railway.app` |
| PostgreSQL (internal) | `${{Postgres.DATABASE_URL}}` |

### Test Credentials (After seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@vdhp.com` | `Admin@123` |
| Doctor | `doctor@vdhp.com` | `Doctor@123` |
| Provider | `provider@vdhp.com` | `Provider@123` |
| Patient | `demo@vdhp.com` | `password123` |

**Invitation Code:** `TEST2024`

---

## ✨ Summary Checklist

- [ ] **Phase 1:** Code pushed to GitHub
- [ ] **Phase 2:** Railway project created
- [ ] **Phase 3:** PostgreSQL database deployed
- [ ] **Phase 4:** Hospital backend deployed and verified
- [ ] **Phase 5:** Patient backend deployed and verified
- [ ] **Phase 6:** Database seeded with initial data
- [ ] **Phase 7:** Both health endpoints return "healthy"
- [ ] **Phase 8:** Hospital frontend deployed (optional)
- [ ] **Phase 9:** Mobile APK built with production URL

---

*Last updated: January 2026*
