# vDHP Platform - Virtual Digital Health Platform

A comprehensive healthcare management platform consisting of a **Patient Mobile App** and a **Hospital Web Portal**, designed for seamless data synchronization, FHIR compliance, and HIPAA-ready security.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    vDHP Cloud Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │  📱 Patient Mobile   │    │  🏥 Hospital Web     │             │
│  │     App (Expo)       │    │     Portal (React)   │             │
│  └──────────┬──────────┘    └──────────┬──────────┘             │
│             │                           │                         │
│  ┌──────────▼──────────┐    ┌──────────▼──────────┐             │
│  │  Patient Backend     │    │  Hospital Backend    │             │
│  │  (FastAPI)           │    │  (FastAPI + ML)      │             │
│  └──────────┬──────────┘    └──────────┬──────────┘             │
│             │                           │                         │
│             └───────────┬───────────────┘                         │
│                         │                                         │
│             ┌───────────▼───────────────┐                         │
│             │   PostgreSQL (Shared)      │                         │
│             │   FHIR-Compliant Schema    │                         │
│             └───────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
vDHP Deployment/
├── vDHP Mobile App Patient/    # React Native (Expo) Patient App
│   ├── app/                    # Expo Router screens
│   ├── backend/                # FastAPI backend
│   ├── components/             # UI components
│   └── services/               # API services
│
├── vDHP Web App Hospital/      # React + Vite Hospital Portal
│   ├── src/                    # React frontend
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   └── services/           # API services
│   └── backend/                # FastAPI backend with ML
│
├── database/                   # Shared database resources
│   ├── migrations/sql/         # Flyway migrations
│   ├── flyway.conf             # Flyway configuration
│   └── seed_data.py            # Database seeding script
│
├── shared/                     # Shared modules
│   ├── database.py             # Database configuration
│   └── auth.py                 # Authentication utilities
│
├── railway.json                # Railway deployment config
└── DEPLOYMENT.md               # Deployment guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL (or use Railway's managed PostgreSQL)

### Local Development

#### 1. Set Up Database

```bash
# Option A: Use local PostgreSQL
createdb vdhp_care_compass

# Option B: Use Docker
docker run -d --name vdhp-postgres \
  -e POSTGRES_DB=vdhp_care_compass \
  -e POSTGRES_USER=vdhp \
  -e POSTGRES_PASSWORD=vdhp123 \
  -p 5432:5432 postgres:16
```

#### 2. Start Hospital Backend

```bash
cd "vDHP Web App Hospital/backend"
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env with your DATABASE_URL

uvicorn app:app --reload --port 8000
```

#### 3. Start Patient Backend

```bash
cd "vDHP Mobile App Patient"
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env with your DATABASE_URL

python backend/main.py
```

#### 4. Seed Database

```bash
cd database
python seed_data.py
```

#### 5. Start Frontends

```bash
# Hospital Web Portal
cd "vDHP Web App Hospital"
npm install
npm run dev

# Patient Mobile App
cd "vDHP Mobile App Patient"
npm install
npx expo start
```

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vdhp.com | Admin@123 |
| Doctor | doctor@vdhp.com | Doctor@123 |
| Provider | provider@vdhp.com | Provider@123 |
| Patient | demo@vdhp.com | password123 |

**Invitation Codes**: `TEST2024`, `WELCOME2024`

## ☁️ Cloud Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full Railway deployment instructions.

### Quick Deploy to Railway

1. Push to GitHub
2. Create Railway project with PostgreSQL
3. Deploy both backends with shared `DATABASE_URL` and `JWT_SECRET_KEY`
4. Update frontend configs with backend URLs

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET_KEY` | JWT signing secret (same for both) | ✅ |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | No |
| `ENVIRONMENT` | development/production | No |
| `CORS_ORIGINS` | Allowed frontend origins | No |

## 📊 Features

### Patient Mobile App
- 📱 Invitation-based registration
- 📋 Care plan viewing
- ✅ Task completion
- 💓 Vitals logging
- 💬 Secure messaging
- ♿ Accessibility features

### Hospital Web Portal
- 👨‍⚕️ Doctor dashboard
- 🏢 Provider portal
- ➕ Patient management
- 📅 Appointments
- 💊 Prescriptions
- 🤖 AI risk prediction
- ✅ Consent workflows

## 🏥 FHIR Compliance

The platform uses FHIR R4 resources:
- Patient
- Practitioner
- Organization
- Appointment
- Observation
- MedicationRequest
- Consent

## 🔒 Security

- JWT authentication with bcrypt password hashing
- Role-based access control (patient/doctor/provider/admin)
- HIPAA-ready audit logging
- SSL/TLS database connections
- CORS protection

## 📝 License

MIT License

---

*Built with ❤️ for better healthcare*
