# vDHP Platform - Railway Cloud Deployment Guide

## 🚀 Overview

This guide covers deploying the complete vDHP (Virtual Digital Health Platform) to Railway cloud with a shared PostgreSQL database.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Railway Cloud Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Patient Mobile  │    │  Hospital Web   │                     │
│  │  App Backend     │    │  App Backend    │                     │
│  │  (FastAPI)       │    │  (FastAPI)      │                     │
│  │  Port: $PORT     │    │  Port: $PORT    │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                       │                               │
│           └───────────┬───────────┘                               │
│                       │                                           │
│           ┌───────────▼───────────┐                               │
│           │   PostgreSQL Database  │                              │
│           │   (Shared)             │                              │
│           └───────────────────────┘                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Railway CLI** (optional): `npm install -g @railway/cli`

## 🗄️ Step 1: Create PostgreSQL Database

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create a new project
3. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
4. Wait for the database to provision
5. Click on the PostgreSQL service → **"Variables"** tab
6. Copy the `DATABASE_URL` value (you'll need this for both backends)

## 🏥 Step 2: Deploy Hospital Web App Backend

### Option A: Deploy from GitHub

1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Configure the service:
   - **Root Directory**: `vDHP Web App Hospital/backend`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Option B: Deploy via CLI

```bash
cd "vDHP Web App Hospital/backend"
railway login
railway link  # Select your project
railway up
```

### Configure Environment Variables

In Railway, go to the service's **"Variables"** tab and add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET_KEY=your-secure-secret-key-minimum-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
AUTO_CREATE_TABLES=true
DEBUG=false
CORS_ORIGINS=https://your-frontend-domain.railway.app
```

> ⚠️ **Important**: Generate a secure JWT secret with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

## 📱 Step 3: Deploy Patient Mobile App Backend

1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository (same repo, different root)
3. Configure the service:
   - **Root Directory**: `vDHP Mobile App Patient`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Configure Environment Variables

Add the **SAME** values as Hospital Backend:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET_KEY=<same-as-hospital-backend>
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
AUTO_CREATE_TABLES=true
DEBUG=false
CORS_ORIGINS=*
```

> ⚠️ **Critical**: Use the **SAME `JWT_SECRET_KEY`** as the Hospital Backend!

## 🔧 Step 4: Run Database Migrations

### Option A: Auto-create Tables

Both backends will automatically create tables if `AUTO_CREATE_TABLES=true`.

### Option B: Use Flyway Migrations

```bash
# Install Flyway
brew install flyway  # macOS
# or download from https://flywaydb.org/

# Run migrations
cd database
flyway -url="$DATABASE_URL" migrate
```

### Option C: Manual SQL

Connect to your Railway PostgreSQL and run:
```bash
railway connect postgres
\i database/migrations/sql/V1__Initial_Schema.sql
\i database/migrations/sql/V2__Seed_Data.sql
```

## ✅ Step 5: Verify Deployment

### Health Checks

```bash
# Hospital Backend
curl https://your-hospital-backend.railway.app/health

# Patient Backend
curl https://your-patient-backend.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "hospital-backend"
}
```

### Test Authentication

```bash
# Create a doctor account
curl -X POST https://your-hospital-backend.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@test.com", "password": "Test123!", "name": "Dr. Test", "role": "doctor"}'
```

## 🌐 Step 6: Configure Frontend URLs

### Hospital Web App Frontend

Update `src/config.ts` or `.env`:
```typescript
export const API_URL = "https://your-hospital-backend.railway.app";
```

### Patient Mobile App

Update the API base URL in `services/api.ts`:
```typescript
const API_URL = "https://your-patient-backend.railway.app";
```

## 🔒 Security Checklist

- [ ] Generate strong `JWT_SECRET_KEY` (64+ characters)
- [ ] Set `DEBUG=false` in production
- [ ] Configure specific `CORS_ORIGINS` (not `*`)
- [ ] Enable `DB_SSL_MODE=require`
- [ ] Review and restrict API access
- [ ] Set up Railway's DDoS protection

## 📊 Monitoring

Railway provides built-in monitoring:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Health checks**: Automatic restart on failure

### View Logs

```bash
railway logs --tail
```

## 🔄 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET_KEY` | JWT signing secret (same for both) | ✅ | `your-64-char-secret` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | No | `30` |
| `ENVIRONMENT` | Runtime environment | No | `production` |
| `DEBUG` | Enable debug mode | No | `false` |
| `AUTO_CREATE_TABLES` | Auto-create DB tables | No | `true` |
| `DB_SSL_MODE` | PostgreSQL SSL mode | No | `require` |
| `CORS_ORIGINS` | Allowed CORS origins | No | `https://frontend.railway.app` |

## 🧪 Test Credentials

After running seed data:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vdhp.com | Admin@123 |
| Doctor | doctor@vdhp.com | Doctor@123 |
| Provider | provider@vdhp.com | Provider@123 |
| Patient | demo@vdhp.com | password123 |

**Invitation Code**: `TEST2024`

## 🆘 Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` format: `postgresql://...`
2. Ensure SSL is enabled: `?sslmode=require`
3. Verify PostgreSQL service is running

### Authentication Errors

1. Verify `JWT_SECRET_KEY` is the same on both backends
2. Check token expiration settings
3. Ensure CORS is configured correctly

### 500 Internal Server Errors

1. Check Railway logs: `railway logs`
2. Enable `DEBUG=true` temporarily
3. Verify all environment variables are set

---

*Last updated: January 2026*
