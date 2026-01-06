# FastAPI Backend Guide - Doctor & Provider Portal Sync

## Overview

This backend keeps both the **Doctor Portal** and **Provider Portal** in perfect sync by using a shared data store. When a doctor creates an appointment, the provider sees it immediately. When a provider updates patient info, doctors see it right away.

## Architecture: How It Stays in Sync

```
┌─────────────────┐         ┌─────────────────┐
│  Doctor Portal  │────────▶│                 │
│   (Frontend)    │         │   FastAPI       │
└─────────────────┘         │   Backend       │
                             │                 │
┌─────────────────┐         │   ┌───────────┐ │
│ Provider Portal │────────▶│   │ DataStore │ │
│   (Frontend)    │         │   │ (Shared)  │ │
└─────────────────┘         │   └───────────┘ │
                             └─────────────────┘
```

**Key Point**: Both portals read from and write to the **same DataStore instance**. This ensures instant synchronization!

---

## Step-by-Step Breakdown

### Step 1: Data Models (`models.py`)

**What it does**: Defines the structure of all data using Pydantic models.

**Why it matters**: 
- Validates incoming data automatically
- Ensures data consistency
- Provides clear documentation of what data looks like

**Key Models**:
- `PatientResponse`, `PatientCreate`, `PatientUpdate` - Patient data
- `DoctorResponse`, `DoctorCreate` - Doctor profiles
- `ProviderResponse`, `ProviderCreate` - Provider (hospital/clinic) info
- `AppointmentResponse`, `AppointmentCreate` - Appointments
- `PrescriptionResponse`, `PrescriptionCreate` - Prescriptions
- `MedicalRecordResponse`, `MedicalRecordCreate` - Medical records
- `DashboardStats` - Analytics data

**Example**:
```python
class PatientCreate(BaseModel):
    name: str
    age: int
    condition: str
    location: Location
    vitals: Vitals
```

---

### Step 2: Data Store (`data_store.py`)

**What it does**: Acts as our temporary "database" using Python dictionaries stored in memory.

**Why it matters**:
- **Single source of truth** - Both portals use the same instance
- All changes are immediately visible to both portals
- Easy to replace with a real database later

**Key Methods**:
- `create_patient()` - Add new patient
- `get_all_patients()` - Get all patients
- `update_patient()` - Update patient info
- `create_appointment()` - Create appointment
- `get_appointments_by_doctor()` - Get doctor's schedule
- `get_appointments_by_patient()` - Get patient's history

**Synchronization Magic**:
```python
# Global instance - shared by ALL routers
data_store = DataStore()

# When doctor creates appointment:
data_store.create_appointment(...)  # ✅ Stored in shared store

# When provider fetches appointments:
data_store.get_appointments_by_patient(...)  # ✅ Gets same data!
```

---

### Step 3: Patient Router (`routers/patients.py`)

**What it does**: Handles patient CRUD operations that **both portals can use**.

**Endpoints**:
- `GET /api/patients` - Get all patients
- `GET /api/patients/{id}` - Get specific patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

**Sync Example**:
1. Provider creates patient via `POST /api/patients`
2. Data stored in shared `data_store`
3. Doctor immediately sees it via `GET /api/patients`

---

### Step 4: Doctor Router (`routers/doctors.py`)

**What it does**: Handles doctor-specific operations (appointments, prescriptions, records).

**Key Endpoints**:
- `POST /api/doctors/appointments` - Create appointment
- `GET /api/doctors/{doctor_id}/appointments` - Get doctor's schedule
- `POST /api/doctors/prescriptions` - Create prescription
- `POST /api/doctors/medical-records` - Create medical record

**Sync Example**:
1. Doctor creates appointment via `POST /api/doctors/appointments`
2. Appointment stored in shared `data_store.appointments`
3. Provider sees it via `GET /api/providers/patients/{id}/appointments`

---

### Step 5: Provider Router (`routers/providers.py`)

**What it does**: Handles provider-specific operations (dashboard, analytics, patient overview).

**Key Endpoints**:
- `GET /api/providers/dashboard/stats` - Dashboard statistics
- `GET /api/providers/patients/{id}/appointments` - Patient's appointments
- `GET /api/providers/patients/{id}/prescriptions` - Patient's prescriptions
- `GET /api/providers/patients/{id}/complete-history` - Full patient history
- `GET /api/providers/patients/search` - Search/filter patients

**Sync Example**:
1. Doctor creates prescription
2. Provider fetches `GET /api/providers/patients/{id}/prescriptions`
3. Provider sees the new prescription immediately!

---

### Step 6: Main App (`app.py`)

**What it does**: Brings everything together - creates FastAPI app and includes all routers.

**Key Components**:
```python
# Create app
app = FastAPI(title='CareAI Backend')

# Enable CORS (so frontend can call backend)
app.add_middleware(CORSMiddleware, ...)

# Include all routers
app.include_router(patients.router)   # Shared endpoints
app.include_router(doctors.router)    # Doctor portal
app.include_router(providers.router) # Provider portal
```

**Result**: All endpoints are now available at:
- `/api/patients/*` - Patient operations
- `/api/doctors/*` - Doctor operations
- `/api/providers/*` - Provider operations

---

## How Synchronization Works

### Scenario: Doctor Creates Appointment

1. **Doctor Portal** calls: `POST /api/doctors/appointments`
   ```json
   {
     "patientId": "123",
     "doctorId": "456",
     "scheduledDate": "2024-01-15",
     "scheduledTime": "10:00",
     "reason": "Follow-up"
   }
   ```

2. **Backend** receives request → `doctors.py` router handles it

3. **Data Store** creates appointment:
   ```python
   data_store.create_appointment(appointment_data)
   # Stores in: data_store.appointments[appointment_id] = {...}
   ```

4. **Provider Portal** calls: `GET /api/providers/patients/123/appointments`

5. **Backend** reads from same store:
   ```python
   data_store.get_appointments_by_patient("123")
   # Returns the appointment just created!
   ```

6. **Result**: Provider sees the appointment immediately! ✅

---

## API Endpoints Summary

### Patient Endpoints (Shared)
- `GET /api/patients` - List all patients
- `GET /api/patients/{id}` - Get patient details
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Doctor Endpoints
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/{id}` - Get doctor details
- `POST /api/doctors` - Create doctor profile
- `GET /api/doctors/{id}/appointments` - Doctor's schedule
- `POST /api/doctors/appointments` - Create appointment
- `POST /api/doctors/prescriptions` - Create prescription
- `POST /api/doctors/medical-records` - Create medical record

### Provider Endpoints
- `GET /api/providers/dashboard/stats` - Dashboard statistics
- `GET /api/providers/patients/{id}/appointments` - Patient appointments
- `GET /api/providers/patients/{id}/prescriptions` - Patient prescriptions
- `GET /api/providers/patients/{id}/medical-records` - Patient records
- `GET /api/providers/patients/{id}/complete-history` - Full history
- `GET /api/providers/patients/search` - Search patients

---

## Testing the Backend

### 1. Start the Server
```bash
cd vDHP-POC/backend
uvicorn app:app --reload --port 8000
```

### 2. View API Documentation
Open: `http://localhost:8000/docs`
- Interactive API documentation
- Test endpoints directly
- See all available endpoints

### 3. Test Synchronization

**Terminal 1** (Doctor creates appointment):
```bash
curl -X POST "http://localhost:8000/api/doctors/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "1",
    "doctorId": "doc1",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00",
    "reason": "Checkup"
  }'
```

**Terminal 2** (Provider sees it):
```bash
curl "http://localhost:8000/api/providers/patients/1/appointments"
```

You'll see the appointment in both! ✅

---

## Next Steps (Future)

1. **Add Database**: Replace `data_store.py` with PostgreSQL/MongoDB
2. **Add Authentication**: JWT tokens, user roles
3. **Add Real-time Updates**: WebSockets for live sync
4. **Add Validation**: More business rules
5. **Add Logging**: Track all changes

---

## Key Takeaways

✅ **Single Data Store** = Both portals stay in sync automatically
✅ **Separate Routers** = Clean, organized code
✅ **Pydantic Models** = Automatic validation
✅ **RESTful Design** = Easy to understand and use
✅ **No Database Yet** = Simple in-memory storage (easy to replace later)

The backend is ready! Both portals can now communicate with it and stay perfectly synchronized! 🎉

