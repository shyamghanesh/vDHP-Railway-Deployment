# vDHP Care Compass 🏥

A comprehensive patient mobile application for healthcare management, built with Expo (React Native) and FastAPI.

## Features

- 🔐 Secure invitation-based registration
- 📋 Care plan and task management
- 💬 Secure messaging with healthcare providers
- 👤 Patient profile management
- ♿ Accessibility features for elderly users
- 🎨 Beautiful dark theme UI
- 🔒 HIPAA-compliant data handling

## Tech Stack

**Frontend:**
- React Native (Expo)
- TypeScript
- Expo Router (file-based routing)
- AsyncStorage for local data
- Axios for API calls

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite database
- JWT authentication
- FHIR-compliant data models

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- npm or yarn

### Installation

1. **Install frontend dependencies:**

   ```bash
   npm install
   ```

2. **Install backend dependencies:**

   ```bash
   pip install fastapi uvicorn sqlalchemy passlib python-jose python-multipart
   ```

3. **Seed the database with test data:**

   ```bash
   python backend/seed_data.py
   ```

   This will create:
   - Test invitation code: `TEST2024`
   - Demo account: `demo@vdhp.com` / `password123`
   - Sample care plans, tasks, and messages

### Running the Application

1. **Start the backend server:**

   ```bash
   python backend/main.py
   ```

   Backend will run on `http://localhost:8000`

2. **Start the Expo app:**

   ```bash
   npx expo start
   ```

3. **Open the app:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your phone

## Test Credentials

### Option 1: Use Demo Account
- **Email:** `demo@vdhp.com`
- **Password:** `password123`

### Option 2: Register New Account
- **Invitation Code:** `TEST2024`
- Follow the registration flow to create a new account

## Project Structure

```
vDHP/
├── app/                    # Expo app screens
│   ├── (auth)/            # Authentication screens
│   │   ├── welcome.tsx
│   │   ├── invitation.tsx
│   │   ├── register.tsx
│   │   ├── login.tsx
│   │   └── consent.tsx
│   ├── (app)/             # Main app screens
│   │   ├── dashboard.tsx
│   │   ├── tasks.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   └── _layout.tsx        # Root layout
├── backend/               # FastAPI backend
│   ├── config/           # Database & auth config
│   ├── models/           # SQLAlchemy models
│   ├── routers/          # API endpoints
│   ├── schemas/          # Pydantic schemas
│   ├── main.py           # FastAPI app
│   └── seed_data.py      # Database seeding
├── components/           # Reusable UI components
│   └── ui/              # UI components
├── constants/           # Colors & typography
├── services/            # API service layer
└── assets/              # Images & fonts
```

## API Endpoints

### Authentication
- `POST /auth/validate-invitation` - Validate invitation code
- `POST /auth/register` - Register new patient
- `POST /auth/login` - Login with email/password

### Patient
- `GET /patients/me` - Get patient profile
- `PUT /patients/me` - Update patient profile
- `POST /patients/me/consents` - Create consent

### Care Plans
- `GET /care-plans` - Get care plans
- `GET /care-plans/tasks` - Get tasks
- `PUT /care-plans/tasks/{id}/complete` - Complete task

### Messages
- `GET /messages` - Get messages
- `POST /messages` - Send message

## Development

### Backend Development

```bash
# Run with auto-reload
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
# Start with clear cache
npx expo start -c

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./vdhp_care_compass.db
```

## Accessibility Features

- Large, readable fonts (18px base)
- High contrast dark theme
- Voice guidance support (configurable)
- Adjustable font sizes
- Clear visual hierarchy
- Touch-friendly UI elements (64px minimum)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- HTTPS recommended for production
- HIPAA-compliant data handling
- Secure token storage

## License

MIT License

## Support

For issues or questions, please contact the development team.
