# vDHP Care Compass - Architecture Documentation

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│                    (React Native/Expo)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │Dashboard │  │  Tasks   │  │ Messages │   │
│  │ Screens  │  │  Screen  │  │  Screen  │  │  Screen  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           API Service Layer (Axios)                   │  │
│  │         AsyncStorage for Token Management             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                        │
│                      (FastAPI/Python)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Patients │  │CarePlans │  │ Messages │   │
│  │  Router  │  │  Router  │  │  Router  │  │  Router  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQLAlchemy ORM Layer                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Postgres Database                           │
│  Users | Patients | CarePlans | Tasks | Messages            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Frontend Architecture (React Native/Expo)

### Directory Structure

```
app/
├── (auth)/              # Authentication flow
│   ├── welcome.tsx      # Landing page
│   ├── invitation.tsx   # Invitation code validation
│   ├── register.tsx     # User registration
│   ├── login.tsx        # User login
│   └── consent.tsx      # Privacy consent
├── (app)/               # Main application
│   ├── dashboard.tsx    # Home dashboard
│   ├── tasks.tsx        # Task management
│   ├── messages.tsx     # Messaging
│   └── profile.tsx      # User profile
├── (tabs)/              # Tab navigation (unused in current flow)
├── index.tsx            # Entry point with auth check
└── _layout.tsx          # Root layout configuration
```

### Key Components

#### 1. **Authentication Flow**

**welcome.tsx** → **invitation.tsx** → **register.tsx** → **consent.tsx** → **dashboard.tsx**

Or: **welcome.tsx** → **login.tsx** → **dashboard.tsx**

```typescript
// Entry point checks authentication
const checkAuth = async () => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    router.replace('/(app)/dashboard');
  } else {
    router.replace('/(auth)/welcome');
  }
};
```

#### 2. **API Service Layer** (`services/api.ts`)

Centralized API communication with:
- Axios instance with base URL
- Request interceptor for JWT tokens
- Service modules: auth, patient, carePlan, message

```typescript
// Automatic token injection
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### 3. **UI Components** (`components/ui/`)

**Card.tsx** - Container with elevation and borders
```typescript
<Card elevated style={styles.card}>
  {children}
</Card>
```

**GradientButton.tsx** - Primary action button with gradients
```typescript
<GradientButton
  title="Log In"
  onPress={handleLogin}
  loading={loading}
  variant="primary"
/>
```

**Input.tsx** - Form input with label and error handling
```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>
```

#### 4. **Design System** (`constants/`)

**Colors.ts** - Dark theme palette
- Primary: #4A9FFF (Blue)
- Secondary: #00D9C0 (Teal)
- Background: #0A0E27 (Dark Navy)
- Text: #F5F7FA (Light Gray)

**Typography.ts** - Accessible font sizes
- Base: 18px (elderly-friendly)
- Large touch targets: 64px minimum
- Line heights: 1.75 (relaxed)

---

## 🔧 Backend Architecture (FastAPI/Python)

### Directory Structure

```
backend/
├── config/
│   ├── database.py      # SQLAlchemy setup
│   └── auth.py          # JWT authentication
├── models/
│   ├── user.py          # User & Invitation models
│   ├── patient.py       # Patient & Consent models
│   ├── care_plan.py     # CarePlan & Task models
│   └── communication.py # Message model
├── routers/
│   ├── auth.py          # Auth endpoints
│   ├── patients.py      # Patient endpoints
│   ├── care_plans.py    # Care plan endpoints
│   └── messages.py      # Message endpoints
├── schemas/
│   ├── auth.py          # Auth request/response schemas
│   ├── patient.py       # Patient schemas
│   └── care_plan.py     # Care plan schemas
├── main.py              # FastAPI application
└── seed_data.py         # Database seeding
```

### Database Models

#### 1. **User Model** (`models/user.py`)

```python
class User(Base):
    id: UUID
    email: str (unique, indexed)
    phone: str
    hashed_password: str
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    created_at: datetime
    last_login: datetime
```

#### 2. **Invitation Model** (`models/user.py`)

```python
class Invitation(Base):
    id: UUID
    invitation_code: str (unique, indexed)
    email: str
    phone: str
    hospital_id: str
    patient_mrn: str
    is_used: bool
    expires_at: datetime
```

#### 3. **Patient Model** (`models/patient.py`)

```python
class Patient(Base):
    id: UUID
    user_id: UUID (FK to User)
    mrn: str (Medical Record Number)
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    address: dict
    emergency_contact: dict
    insurance: dict
    accessibility_preferences: dict
    fhir_patient_resource: JSON
```

#### 4. **CarePlan Model** (`models/care_plan.py`)

```python
class CarePlan(Base):
    id: UUID
    patient_id: UUID (FK to Patient)
    title: str
    description: str
    status: str (active/completed/cancelled)
    start_date: datetime
    end_date: datetime
    created_by: str
```

#### 5. **Task Model** (`models/care_plan.py`)

```python
class Task(Base):
    id: UUID
    care_plan_id: UUID (FK to CarePlan)
    patient_id: UUID (FK to Patient)
    title: str
    description: str
    task_type: str
    status: enum (pending/in_progress/completed/cancelled)
    priority: str (low/medium/high)
    due_date: datetime
    completed_at: datetime
    response_data: JSON
```

#### 6. **Message Model** (`models/communication.py`)

```python
class Message(Base):
    id: UUID
    patient_id: UUID (FK to Patient)
    sender_type: str (patient/provider)
    sender_id: UUID
    sender_name: str
    recipient_type: str
    recipient_id: UUID
    subject: str
    message_text: str
    is_read: bool
    created_at: datetime
```

### API Endpoints

#### Authentication (`/auth`)

```
POST /auth/validate-invitation
  Request: { invitation_code: str }
  Response: { valid: bool, message: str, email?: str }

POST /auth/register
  Request: { invitation_code, email, password, first_name, last_name, date_of_birth }
  Response: { access_token, user_id, patient_id }

POST /auth/login
  Request: { email, password }
  Response: { access_token, user_id, patient_id }
```

#### Patient (`/patients`)

```
GET /patients/me
  Headers: Authorization: Bearer <token>
  Response: PatientResponse

PUT /patients/me
  Headers: Authorization: Bearer <token>
  Request: PatientProfileUpdate
  Response: PatientResponse

POST /patients/me/consents
  Headers: Authorization: Bearer <token>
  Request: ConsentCreate
  Response: ConsentResponse
```

#### Care Plans (`/care-plans`)

```
GET /care-plans?page=1
  Headers: Authorization: Bearer <token>
  Response: List[CarePlanResponse]

GET /care-plans/tasks?status=pending&page=1
  Headers: Authorization: Bearer <token>
  Response: List[TaskResponse]

PUT /care-plans/tasks/{task_id}/complete
  Headers: Authorization: Bearer <token>
  Request: { response_data?: dict }
  Response: TaskResponse
```

#### Messages (`/messages`)

```
GET /messages?page=1
  Headers: Authorization: Bearer <token>
  Response: List[MessageResponse]

POST /messages
  Headers: Authorization: Bearer <token>
  Request: { recipient_id, message_text, subject? }
  Response: MessageResponse
```

---

## 🔐 Authentication & Security

### JWT Token Flow

1. **Login/Register** → Backend generates JWT token
2. **Token Storage** → AsyncStorage saves token locally
3. **API Requests** → Interceptor adds token to headers
4. **Token Validation** → Backend verifies token on each request
5. **Logout** → Token removed from AsyncStorage

```typescript
// Token generation (backend)
def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"sub": email, "user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

// Token validation (backend)
def get_current_user(credentials: HTTPAuthorizationCredentials):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("user_id")
    return db.query(User).filter(User.id == user_id).first()
```

### Password Security

- **Hashing**: Bcrypt with automatic salt
- **Minimum Length**: 8 characters
- **Storage**: Only hashed passwords stored

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(password)
is_valid = pwd_context.verify(password, hashed_password)
```

---

## 📊 Data Flow Examples

### 1. User Login Flow

```
User enters credentials
    ↓
Frontend: authService.login(email, password)
    ↓
POST /auth/login
    ↓
Backend: Verify credentials
    ↓
Backend: Generate JWT token
    ↓
Backend: Return { access_token, user_id, patient_id }
    ↓
Frontend: Save token to AsyncStorage
    ↓
Frontend: Navigate to dashboard
```

### 2. Task Completion Flow

```
User clicks "Mark as Complete"
    ↓
Frontend: carePlanService.completeTask(taskId, patientId)
    ↓
PUT /care-plans/tasks/{taskId}/complete
    ↓
Backend: Verify user owns task
    ↓
Backend: Update task status to "completed"
    ↓
Backend: Set completed_at timestamp
    ↓
Backend: Return updated task
    ↓
Frontend: Remove task from list
    ↓
Frontend: Show success feedback
```

### 3. Message Sending Flow

```
User types message and clicks send
    ↓
Frontend: messageService.sendMessage(patientId, messageData)
    ↓
POST /messages
    ↓
Backend: Create message record
    ↓
Backend: Set sender info from authenticated user
    ↓
Backend: Return created message
    ↓
Frontend: Add message to list
    ↓
Frontend: Clear input field
```

---

## 🎨 Design Principles

### 1. **Elderly-Friendly Design**
- Large fonts (18px base)
- High contrast colors
- Touch-friendly targets (64px minimum)
- Simple navigation
- Clear visual hierarchy

### 2. **Accessibility**
- WCAG 2.1 AA compliance
- Screen reader support
- Haptic feedback
- Voice guidance (configurable)
- Adjustable font sizes

### 3. **HIPAA Compliance**
- Encrypted data transmission (HTTPS)
- Secure token storage
- Password hashing
- Audit logging (timestamps)
- Consent management

### 4. **FHIR Standards**
- Patient resource structure
- CarePlan resource structure
- Task resource structure
- Communication resource structure
- Extensible JSON fields for FHIR data

---

## 🔄 State Management

### Local State (React useState)
- Form inputs
- Loading states
- Error messages
- UI toggles

### Persistent State (AsyncStorage)
- JWT access token
- Patient ID
- User preferences

### Server State (API calls)
- Patient profile
- Care plans
- Tasks
- Messages

---

## 🚀 Deployment Considerations

### Frontend (Expo)
- Build for iOS: `eas build --platform ios`
- Build for Android: `eas build --platform android`
- Web deployment: `npx expo export:web`

### Backend (FastAPI)
- Production server: Gunicorn + Uvicorn workers
- Database: PostgreSQL (replace SQLite)
- Environment variables: Use .env file
- HTTPS: Use reverse proxy (Nginx)
- Monitoring: Sentry, DataDog

### Database Migration
```bash
# Switch from SQLite to PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost/vdhp_care_compass
```

---

## 📈 Scalability

### Current Limitations (SQLite)
- Single-file database
- No concurrent writes
- Limited to local deployment

### Production Recommendations
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session management
- **File Storage**: S3 for profile photos/attachments
- **API Gateway**: Rate limiting and load balancing
- **CDN**: CloudFront for static assets

---

## 🧪 Testing Strategy

### Frontend Testing
```bash
npm test  # Jest + React Testing Library
```

### Backend Testing
```bash
pytest backend/tests/  # Pytest
```

### E2E Testing
- Detox for mobile
- Playwright for web

---

## 📝 Code Quality

### Linting
```bash
npm run lint  # ESLint for TypeScript
```

### Type Checking
```bash
npx tsc --noEmit  # TypeScript compiler
```

### Code Formatting
- Prettier for consistent formatting
- EditorConfig for cross-editor consistency

---

## 🔍 Monitoring & Logging

### Backend Logging
```python
import logging
logger = logging.getLogger(__name__)
logger.info(f"User {user_id} logged in")
```

### Error Tracking
- Sentry for error monitoring
- Custom error handlers in FastAPI

### Analytics
- User engagement metrics
- Feature usage tracking
- Performance monitoring

---

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Expo Docs**: https://docs.expo.dev/
- **FHIR Standards**: https://www.hl7.org/fhir/
- **HIPAA Guidelines**: https://www.hhs.gov/hipaa/

---

*Last updated: 2024*
