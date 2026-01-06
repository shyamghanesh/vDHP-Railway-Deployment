# How The Backend Files Work Together

## 📁 File Structure Overview

```
backend/
├── app.py              ← Main entry point (starts everything)
├── models.py           ← Data definitions (what data looks like)
├── data_store.py       ← Storage (where data lives)
└── routers/
    ├── patients.py     ← Patient endpoints
    ├── doctors.py      ← Doctor endpoints
    └── providers.py    ← Provider endpoints
```

---

## 🔄 How Files Connect Together

### The Connection Flow

```
1. app.py
   │
   ├──→ Imports models.py (to understand data structure)
   ├──→ Imports data_store.py (to access shared storage)
   └──→ Imports routers/ (to handle HTTP requests)
       │
       ├──→ routers/patients.py
       │   └──→ Uses data_store (reads/writes patients)
       │
       ├──→ routers/doctors.py
       │   └──→ Uses data_store (reads/writes appointments, prescriptions)
       │
       └──→ routers/providers.py
           └──→ Uses data_store (reads patient history, stats)
```

---

## 📖 Detailed File Explanations

### 1. `models.py` - The Data Blueprint

**Purpose**: Defines what data looks like and validates it.

**How it works**:
- Uses Pydantic to create "schemas" (templates for data)
- Every piece of data must match these templates
- Automatically validates incoming data

**Example**:
```python
# In models.py
class PatientCreate(BaseModel):
    name: str
    age: int
    condition: str
    location: Location
    vitals: Vitals
```

**Used by**:
- `data_store.py` - Knows what patient data should look like
- `routers/*.py` - Validates incoming requests

**Real Example**:
```python
# When someone sends this JSON:
{
  "name": "John Doe",
  "age": 30,
  "condition": "Hypertension"
}

# Pydantic checks:
# ✅ name is a string? Yes
# ✅ age is an integer? Yes
# ✅ condition is a string? Yes
# ✅ location provided? No → ERROR!
```

---

### 2. `data_store.py` - The Shared Storage

**Purpose**: Stores all data in memory. This is the **single source of truth**.

**How it works**:
- Creates a global `DataStore` class instance
- Stores data in Python dictionaries
- Provides methods to create, read, update, delete

**Key Concept**: 
```python
# At the bottom of data_store.py
data_store = DataStore()  # ← ONE instance, shared by everyone!
```

**Used by**:
- `routers/patients.py` - Calls `data_store.create_patient()`
- `routers/doctors.py` - Calls `data_store.create_appointment()`
- `routers/providers.py` - Calls `data_store.get_all_patients()`

**Real Example**:
```python
# In data_store.py
class DataStore:
    def __init__(self):
        self.patients = {}  # Empty dictionary
        self.appointments = {}  # Empty dictionary
    
    def create_patient(self, patient_data):
        patient_id = "123"
        self.patients[patient_id] = patient_data  # Store it!
        return patient_data

# Global instance (shared by ALL routers)
data_store = DataStore()
```

**Why this matters**: 
- Doctor router writes to `data_store`
- Provider router reads from the **same** `data_store`
- They see the same data! ✅

---

### 3. `routers/patients.py` - Patient Endpoints

**Purpose**: Handles HTTP requests for patient operations.

**How it works**:
- Defines endpoints like `GET /api/patients`
- Uses `data_store` to get/save data
- Uses `models.py` to validate data

**Connection Flow**:
```
HTTP Request → patients.py → data_store.py → Returns data
```

**Real Example**:
```python
# In routers/patients.py
from data_store import data_store  # ← Import the shared store
from models import PatientCreate, PatientResponse  # ← Import models

@router.get("/api/patients")
async def get_all_patients():
    # Call the shared data store
    patients = data_store.get_all_patients()  # ← Reads from shared store
    return patients  # Returns to frontend
```

**What happens when called**:
1. Frontend sends: `GET http://localhost:8000/api/patients`
2. `patients.py` receives request
3. Calls `data_store.get_all_patients()`
4. `data_store` returns list of patients
5. `patients.py` sends response back to frontend

---

### 4. `routers/doctors.py` - Doctor Endpoints

**Purpose**: Handles doctor-specific operations (appointments, prescriptions).

**How it works**:
- Similar to `patients.py` but for doctor operations
- Uses the **same** `data_store` instance
- Creates appointments that providers can see

**Real Example**:
```python
# In routers/doctors.py
from data_store import data_store  # ← Same shared store!

@router.post("/api/doctors/appointments")
async def create_appointment(appointment_data: AppointmentCreate):
    # Store in shared data store
    appointment = data_store.create_appointment(appointment_data)
    return appointment
```

**Synchronization Magic**:
```
Doctor Portal:
  POST /api/doctors/appointments
    ↓
  data_store.create_appointment()  ← Stores in shared store
    ↓
Provider Portal:
  GET /api/providers/patients/123/appointments
    ↓
  data_store.get_appointments_by_patient()  ← Reads from same store!
    ↓
  Provider sees the appointment! ✅
```

---

### 5. `routers/providers.py` - Provider Endpoints

**Purpose**: Handles provider-specific operations (dashboard, analytics).

**How it works**:
- Uses the **same** `data_store` to read data
- Provides aggregated views (stats, history)
- Can see everything doctors create

**Real Example**:
```python
# In routers/providers.py
from data_store import data_store  # ← Same shared store!

@router.get("/api/providers/dashboard/stats")
async def get_dashboard_stats():
    patients = data_store.get_all_patients()  # ← Reads from shared store
    appointments = data_store.get_all_appointments()  # ← Same store!
    
    return {
        "totalPatients": len(patients),
        "totalAppointments": len(appointments)
    }
```

---

### 6. `app.py` - The Main Orchestrator

**Purpose**: Brings everything together and starts the server.

**How it works**:
1. Creates FastAPI application
2. Imports all routers
3. Connects routers to the app
4. Starts the web server

**Real Example**:
```python
# In app.py
from fastapi import FastAPI
from routers import patients, doctors, providers  # ← Import routers
# (data_store is imported by routers, not directly here)

app = FastAPI()

# Connect routers to app
app.include_router(patients.router)   # Now /api/patients/* works
app.include_router(doctors.router)    # Now /api/doctors/* works
app.include_router(providers.router) # Now /api/providers/* works
```

**What happens when server starts**:
```
1. Python runs: uvicorn app:app --reload
2. Python loads app.py
3. app.py imports routers
4. routers import data_store
5. data_store creates DataStore() instance
6. All routers share the same data_store instance
7. Server starts, ready to handle requests!
```

---

## 🔄 Complete Request Flow Example

### Scenario: Doctor Creates an Appointment

**Step 1**: Frontend sends request
```javascript
// Doctor Portal (Frontend)
fetch('http://localhost:8000/api/doctors/appointments', {
  method: 'POST',
  body: JSON.stringify({
    patientId: "1",
    doctorId: "doc1",
    scheduledDate: "2024-01-15",
    scheduledTime: "10:00",
    reason: "Checkup"
  })
})
```

**Step 2**: Request arrives at `app.py`
```python
# app.py has included doctors.router
# FastAPI routes the request to doctors.py
```

**Step 3**: `routers/doctors.py` handles it
```python
# In routers/doctors.py
@router.post("/api/doctors/appointments")
async def create_appointment(appointment_data: AppointmentCreate):
    # appointment_data is automatically validated by Pydantic (models.py)
    # If invalid, FastAPI returns error automatically
    
    # Store in shared data store
    appointment = data_store.create_appointment(appointment_data)
    # ↑ Calls data_store.py
    return appointment
```

**Step 4**: `data_store.py` stores it
```python
# In data_store.py
def create_appointment(self, appointment_data):
    appointment_id = "appt-123"
    self.appointments[appointment_id] = {
        "id": appointment_id,
        "patientId": "1",
        "doctorId": "doc1",
        # ... rest of data
    }
    return appointment
```

**Step 5**: Response sent back
```python
# doctors.py returns the appointment
# FastAPI converts it to JSON
# Frontend receives the response
```

**Step 6**: Provider Portal sees it
```javascript
// Provider Portal (Frontend)
fetch('http://localhost:8000/api/providers/patients/1/appointments')
```

**Step 7**: `routers/providers.py` handles it
```python
# In routers/providers.py
@router.get("/api/providers/patients/{patient_id}/appointments")
async def get_patient_appointments(patient_id: str):
    # Read from the SAME data store
    appointments = data_store.get_appointments_by_patient(patient_id)
    # ↑ Gets the appointment just created!
    return appointments
```

**Step 8**: `data_store.py` returns it
```python
# In data_store.py
def get_appointments_by_patient(self, patient_id):
    # Filter appointments for this patient
    return [appt for appt in self.appointments.values() 
            if appt["patientId"] == patient_id]
    # ↑ Returns the appointment created in Step 4!
```

**Result**: Provider sees the appointment immediately! ✅

---

## 🎯 Key Concepts

### 1. Single Data Store = Synchronization
```python
# All routers import the SAME instance
from data_store import data_store  # ← Same object!

# Doctor writes
data_store.create_appointment(...)

# Provider reads
data_store.get_appointments_by_patient(...)  # ← Sees it!
```

### 2. Models = Validation
```python
# models.py defines structure
class AppointmentCreate(BaseModel):
    patientId: str
    scheduledDate: date

# FastAPI automatically validates
# If invalid → returns error
# If valid → passes to router
```

### 3. Routers = Endpoints
```python
# Each router handles specific endpoints
patients.router  → /api/patients/*
doctors.router    → /api/doctors/*
providers.router  → /api/providers/*
```

### 4. App = Orchestrator
```python
# app.py connects everything
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(providers.router)
```

---

## 🔍 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                    │
│  Doctor Portal              Provider Portal              │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
             │ HTTP Requests        │ HTTP Requests
             │                      │
             ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                      app.py                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  FastAPI Application                             │   │
│  │  - Includes all routers                          │   │
│  │  - Handles CORS                                 │   │
│  │  - Routes requests                              │   │
│  └──────────────────────────────────────────────────┘   │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
             │ Routes to            │ Routes to
             ▼                      ▼
    ┌──────────────┐      ┌──────────────┐
    │ doctors.py   │      │ providers.py │
    │              │      │              │
    │ Creates      │      │ Reads        │
    │ appointments  │      │ appointments │
    └──────┬───────┘      └──────┬───────┘
           │                     │
           │ Both use            │
           │                     │
           ▼                     ▼
    ┌─────────────────────────────────┐
    │      data_store.py               │
    │                                  │
    │  data_store = DataStore()       │
    │  ┌──────────────────────────┐   │
    │  │ self.patients = {}       │   │
    │  │ self.appointments = {}   │   │
    │  │ self.prescriptions = {} │   │
    │  └──────────────────────────┘   │
    │                                  │
    │  ← Single shared instance        │
    │    used by ALL routers           │
    └──────────────────────────────────┘
           │
           │ Uses
           ▼
    ┌──────────────┐
    │  models.py   │
    │              │
    │  Defines     │
    │  data        │
    │  structure   │
    └──────────────┘
```

---

## 💡 Summary

1. **`models.py`** = Defines what data looks like (blueprint)
2. **`data_store.py`** = Stores data (shared by everyone)
3. **`routers/*.py`** = Handle HTTP requests (endpoints)
4. **`app.py`** = Connects everything together (orchestrator)

**The Magic**: All routers use the **same** `data_store` instance, so:
- Doctor creates appointment → stored in `data_store`
- Provider reads appointments → reads from **same** `data_store`
- They stay in sync automatically! ✅

---

## 🧪 Try It Yourself

1. Start the server: `uvicorn app:app --reload`
2. Open: `http://localhost:8000/docs`
3. Try creating a patient via `/api/patients` (POST)
4. Try reading patients via `/api/patients` (GET)
5. See how both portals would see the same data!

The files work together like a well-orchestrated team, each with a specific role, all sharing the same data storage! 🎉

