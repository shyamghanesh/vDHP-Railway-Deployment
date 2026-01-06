# 👨‍💻 Developer Guide - vDHP Care Compass

## 🎯 Quick Reference

### Test Credentials
```
Demo Account:
  Email: demo@vdhp.com
  Password: password123

Invitation Code: TEST2024
```

### Start Commands
```bash
# Backend
python backend/seed_data.py  # First time only
python backend/main.py       # Runs on :8000

# Frontend
npx expo start               # Opens Expo DevTools
```

---

## 📁 Project Structure Explained

```
vDHP/
├── app/                     # React Native screens
│   ├── (auth)/             # Auth flow: welcome → invitation → register → login → consent
│   ├── (app)/              # Main app: dashboard → tasks → messages → profile
│   ├── index.tsx           # Entry point (auth check)
│   └── _layout.tsx         # Route configuration
│
├── backend/
│   ├── config/             # Database & JWT setup
│   ├── models/             # SQLAlchemy ORM models
│   ├── routers/            # API endpoints
│   ├── schemas/            # Pydantic request/response schemas
│   ├── main.py             # FastAPI app
│   └── seed_data.py        # Test data generator
│
├── components/ui/          # Reusable UI components
│   ├── Card.tsx            # Container with elevation
│   ├── GradientButton.tsx  # Primary action button
│   └── Input.tsx           # Form input with validation
│
├── constants/              # Design system
│   ├── Colors.ts           # Color palette
│   └── Typography.ts       # Font sizes & weights
│
├── services/
│   └── api.ts              # Axios API client
│
└── Documentation/
    ├── README.md           # Project overview
    ├── QUICKSTART.md       # 5-minute setup
    ├── ARCHITECTURE.md     # System design
    ├── CODE_SUMMARY.md     # Complete code explanation
    └── DEVELOPER_GUIDE.md  # This file
```

---

## 🔧 Development Workflow

### 1. Initial Setup

```bash
# Clone and navigate
cd vDHP

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt

# Create database with test data
python backend/seed_data.py

# Verify setup
python verify_setup.py
```

### 2. Daily Development

**Terminal 1 - Backend:**
```bash
python backend/main.py
# Or with auto-reload:
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
npx expo start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

### 3. Clear Cache (if needed)
```bash
npx expo start -c
```

---

## 🎨 Adding New Features

### Add a New Screen

**1. Create screen file:**
```typescript
// app/(app)/appointments.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AppointmentsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <Text style={{ color: Colors.dark.text }}>Appointments</Text>
    </View>
  );
}
```

**2. Add route to layout:**
```typescript
// app/_layout.tsx
<Stack.Screen name="(app)/appointments" />
```

**3. Navigate to screen:**
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(app)/appointments');
```

### Add a New API Endpoint

**1. Create Pydantic schema:**
```python
# backend/schemas/appointment.py
from pydantic import BaseModel
from datetime import datetime

class AppointmentCreate(BaseModel):
    provider_id: str
    appointment_date: datetime
    reason: str

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    provider_id: str
    appointment_date: datetime
    status: str
    
    class Config:
        from_attributes = True
```

**2. Create database model:**
```python
# backend/models/appointment.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from backend.config.database import Base
import uuid

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"))
    provider_id = Column(String(36))
    appointment_date = Column(DateTime)
    status = Column(String(50), default="scheduled")
```

**3. Create router:**
```python
# backend/routers/appointments.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.config.auth import get_current_patient
from backend.models import Appointment
from backend.schemas.appointment import AppointmentCreate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=list[AppointmentResponse])
async def get_appointments(
    current_patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == current_patient.id
    ).all()
    return appointments

@router.post("", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    current_patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    new_appointment = Appointment(
        patient_id=current_patient.id,
        provider_id=appointment.provider_id,
        appointment_date=appointment.appointment_date,
        reason=appointment.reason
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return new_appointment
```

**4. Register router:**
```python
# backend/main.py
from backend.routers import appointments

app.include_router(appointments.router)
```

**5. Add frontend service:**
```typescript
// services/api.ts
export const appointmentService = {
  getAppointments: async (patientId: string) => {
    const response = await api.get('/appointments');
    return response.data;
  },
  
  createAppointment: async (patientId: string, data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  }
};
```

---

## 🎨 Styling Guidelines

### Use Design System

```typescript
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    padding: 24,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  button: {
    height: 64,  // Touch-friendly
    borderRadius: 16,
  }
});
```

### Component Patterns

**Card Container:**
```typescript
<Card elevated style={{ marginBottom: 16 }}>
  <Text style={styles.title}>Title</Text>
  <Text style={styles.content}>Content</Text>
</Card>
```

**Gradient Button:**
```typescript
<GradientButton
  title="Submit"
  onPress={handleSubmit}
  loading={loading}
  variant="primary"  // or 'secondary', 'success'
/>
```

**Form Input:**
```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="your@email.com"
  keyboardType="email-address"
  error={errors.email}
/>
```

---

## 🔐 Authentication Patterns

### Protected Route
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ProtectedScreen() {
  const router = useRouter();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      router.replace('/(auth)/login');
    }
  };
  
  return <View>...</View>;
}
```

### API Call with Auth
```typescript
// Automatic - token added by interceptor
const data = await patientService.getProfile(patientId);

// Manual token access
const token = await AsyncStorage.getItem('access_token');
```

---

## 🗄️ Database Operations

### Add New Table

**1. Create model:**
```python
# backend/models/vitals.py
class VitalSign(Base):
    __tablename__ = "vital_signs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"))
    measurement_type = Column(String(50))  # blood_pressure, heart_rate, etc.
    value = Column(String(100))
    unit = Column(String(20))
    measured_at = Column(DateTime, default=datetime.utcnow)
```

**2. Import in models/__init__.py:**
```python
from backend.models.vitals import VitalSign

__all__ = [..., "VitalSign"]
```

**3. Create tables:**
```python
# In Python shell or seed script
from backend.config.database import Base, engine
Base.metadata.create_all(bind=engine)
```

### Query Patterns

**Simple query:**
```python
patients = db.query(Patient).all()
patient = db.query(Patient).filter(Patient.id == patient_id).first()
```

**Join query:**
```python
from sqlalchemy.orm import joinedload

patient_with_tasks = db.query(Patient).options(
    joinedload(Patient.tasks)
).filter(Patient.id == patient_id).first()
```

**Pagination:**
```python
page = 1
page_size = 10
skip = (page - 1) * page_size

tasks = db.query(Task).offset(skip).limit(page_size).all()
```

---

## 🧪 Testing

### Frontend Testing

```typescript
// __tests__/login.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';

test('login with valid credentials', async () => {
  const { getByPlaceholderText, getByText } = render(<LoginScreen />);
  
  fireEvent.changeText(getByPlaceholderText('Email'), 'demo@vdhp.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Log In'));
  
  await waitFor(() => {
    expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/dashboard');
  });
});
```

### Backend Testing

```python
# backend/tests/test_auth.py
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/auth/login", json={
        "email": "demo@vdhp.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials():
    response = client.post("/auth/login", json={
        "email": "demo@vdhp.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
```

---

## 🐛 Debugging

### Frontend Debugging

**Console logs:**
```typescript
console.log('User data:', userData);
console.error('API error:', error);
```

**React DevTools:**
```bash
# Install
npm install -g react-devtools

# Run
react-devtools
```

**Network debugging:**
```typescript
// In services/api.ts
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.config.url, error.response?.data);
    return Promise.reject(error);
  }
);
```

### Backend Debugging

**Logging:**
```python
import logging
logger = logging.getLogger(__name__)

@router.post("/login")
async def login(request: LoginRequest):
    logger.info(f"Login attempt for: {request.email}")
    # ... rest of code
```

**Interactive debugging:**
```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use debugger in VS Code
```

**API docs:**
```
http://localhost:8000/docs  # Swagger UI
http://localhost:8000/redoc # ReDoc
```

---

## 📦 Common Tasks

### Reset Database
```bash
# Delete database
del vdhp_care_compass.db  # Windows
rm vdhp_care_compass.db   # Mac/Linux

# Re-seed
python backend/seed_data.py
```

### Add New Test User
```python
# In Python shell or seed script
from backend.models import User, Patient
from backend.config.database import SessionLocal
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])
db = SessionLocal()

user = User(
    email="newuser@test.com",
    hashed_password=pwd_context.hash("password123")
)
db.add(user)
db.flush()

patient = Patient(
    user_id=user.id,
    first_name="Jane",
    last_name="Smith",
    date_of_birth="1970-01-01"
)
db.add(patient)
db.commit()
```

### Update API URL
```typescript
// services/api.ts
const API_URL = 'http://192.168.1.100:8000';  // Your local IP
```

### Clear AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all
await AsyncStorage.clear();

// Clear specific keys
await AsyncStorage.removeItem('access_token');
await AsyncStorage.removeItem('patient_id');
```

---

## 🚀 Deployment

### Frontend (Expo)

**Build for production:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform android
eas build --platform ios
```

### Backend (Production)

**1. Update environment:**
```bash
# .env.production
JWT_SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:pass@host/db
```

**2. Use production server:**
```bash
# Install gunicorn
pip install gunicorn

# Run with workers
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

**3. Use PostgreSQL:**
```python
# Update DATABASE_URL
DATABASE_URL=postgresql://user:password@localhost/vdhp_care_compass
```

---

## 📚 Resources

### Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **Expo**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **SQLAlchemy**: https://docs.sqlalchemy.org/

### Tools
- **Postman**: API testing
- **React DevTools**: Component inspection
- **VS Code**: Recommended IDE
- **Expo Go**: Mobile testing app

### Community
- **Stack Overflow**: Questions & answers
- **GitHub Issues**: Bug reports
- **Discord**: Real-time help

---

## 💡 Tips & Best Practices

1. **Always use TypeScript types** for better code quality
2. **Follow the design system** for consistent UI
3. **Use async/await** instead of promises
4. **Handle errors gracefully** with try/catch
5. **Test on real devices** not just simulators
6. **Keep components small** and focused
7. **Use environment variables** for configuration
8. **Document complex logic** with comments
9. **Follow REST conventions** for API design
10. **Keep dependencies updated** regularly

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check backend is running on port 8000
- Update API_URL in services/api.ts
- Check firewall settings

### "Token expired"
- Tokens expire after 30 minutes
- Re-login to get new token
- Implement token refresh logic

### "Database locked"
- SQLite doesn't support concurrent writes
- Close other database connections
- Consider PostgreSQL for production

### "Expo won't start"
- Clear cache: `npx expo start -c`
- Delete node_modules and reinstall
- Check Node.js version (18+)

---

*Happy coding! 🎉*
