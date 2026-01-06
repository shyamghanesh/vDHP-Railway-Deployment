# Code Connections - How Files Import and Use Each Other

## 🔗 The Import Chain

Let me show you the **actual code** that connects everything together:

---

## 1. The Foundation: `data_store.py`

**Location**: `backend/data_store.py` (line 373)

```python
# At the bottom of data_store.py
data_store = DataStore()  # ← ONE global instance
```

**This is the shared storage** that everyone uses!

---

## 2. Routers Import the Data Store

### `routers/patients.py` (line 18)

```python
from data_store import data_store  # ← Imports the shared instance

@router.get("")
async def get_all_patients():
    return data_store.get_all_patients()  # ← Uses it!
```

### `routers/doctors.py` (line 18)

```python
from data_store import data_store  # ← Same instance!

@router.post("/appointments")
async def create_appointment(appointment_data):
    return data_store.create_appointment(appointment_data)  # ← Uses it!
```

### `routers/providers.py` (line 18)

```python
from data_store import data_store  # ← Same instance!

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    patients = data_store.get_all_patients()  # ← Uses it!
    appointments = data_store.get_all_appointments()  # ← Uses it!
```

**Key Point**: All three routers import the **SAME** `data_store` object!

---

## 3. Routers Import Models

### `routers/patients.py` (line 17)

```python
from models import PatientResponse, PatientCreate, PatientUpdate
# ↑ These define what data looks like

@router.post("", response_model=PatientResponse)
#                      ↑ Uses PatientResponse from models.py
async def create_patient(patient_data: PatientCreate):
    #                            ↑ Uses PatientCreate from models.py
    patient = data_store.create_patient(patient_data)
    return patient  # Returns PatientResponse
```

### `routers/doctors.py` (line 7-12)

```python
from models import (
    DoctorResponse, DoctorCreate,
    AppointmentResponse, AppointmentCreate,
    PrescriptionResponse, PrescriptionCreate,
    MedicalRecordResponse, MedicalRecordCreate
)
# ↑ All these come from models.py
```

---

## 4. App.py Imports Routers

### `app.py` (line 24)

```python
from routers import patients, doctors, providers
# ↑ Imports all three router modules
```

### `app.py` (lines 53-59)

```python
# Connect routers to the app
app.include_router(patients.router)   # Now /api/patients/* works
app.include_router(doctors.router)    # Now /api/doctors/* works
app.include_router(providers.router)  # Now /api/providers/* works
```

---

## 5. Data Store Uses Models

### `data_store.py` (lines 15-23)

```python
from models import (
    PatientResponse, PatientCreate, PatientUpdate,
    DoctorResponse, DoctorCreate,
    ProviderResponse, ProviderCreate,
    AppointmentResponse, AppointmentCreate,
    PrescriptionResponse, PrescriptionCreate,
    MedicalRecordResponse, MedicalRecordCreate,
    RiskLevel, Vitals
)
# ↑ Imports models to know what data structure to use
```

### `data_store.py` (line 129)

```python
def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
    #                      ↑ Uses PatientCreate from models.py
    #                                        ↑ Returns PatientResponse
    patient_dict = {
        "id": patient_id,
        **patient_data.dict(),  # Converts Pydantic model to dict
        # ...
    }
    return PatientResponse(**patient_dict)  # Converts dict to Pydantic model
```

---

## 📊 Complete Import Map

```
┌─────────────────────────────────────────────────────────┐
│                        app.py                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ from routers import patients, doctors, providers  │   │
│  │                                                  │   │
│  │ app.include_router(patients.router)             │   │
│  │ app.include_router(doctors.router)              │   │
│  │ app.include_router(providers.router)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
             │                    │                    │
             │                    │                    │
             ▼                    ▼                    ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ patients.py  │    │ doctors.py   │    │ providers.py │
    │              │    │              │    │              │
    │ from models  │    │ from models  │    │ from models  │
    │ from         │    │ from         │    │ from         │
    │ data_store   │    │ data_store   │    │ data_store   │
    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
           │                   │                   │
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                               │ All import the same instance
                               ▼
                    ┌──────────────────────┐
                    │   data_store.py      │
                    │                      │
                    │ from models import * │
                    │                      │
                    │ data_store =         │
                    │   DataStore()        │
                    └──────────────────────┘
                               │
                               │ Uses
                               ▼
                    ┌──────────────────────┐
                    │     models.py        │
                    │                      │
                    │ Pydantic models      │
                    │ (no imports)         │
                    └──────────────────────┘
```

---

## 🔄 Real Example: Creating a Patient

Let's trace through what happens when you create a patient:

### Step 1: Request Arrives
```http
POST http://localhost:8000/api/patients
Content-Type: application/json

{
  "name": "John Doe",
  "age": 30,
  "condition": "Hypertension",
  "location": {...},
  "vitals": {...}
}
```

### Step 2: `app.py` Routes It
```python
# app.py has:
app.include_router(patients.router)

# FastAPI sees: POST /api/patients
# Matches: patients.router with prefix="/api/patients"
# Routes to: routers/patients.py
```

### Step 3: `routers/patients.py` Handles It
```python
# In routers/patients.py (line 17-18)
from models import PatientResponse, PatientCreate  # ← Import models
from data_store import data_store  # ← Import shared store

# Line 40-47
@router.post("", response_model=PatientResponse)
async def create_patient(patient_data: PatientCreate):
    # FastAPI automatically:
    # 1. Takes JSON from request
    # 2. Validates it against PatientCreate (from models.py)
    # 3. If valid → passes to this function
    # 4. If invalid → returns error automatically
    
    patient = data_store.create_patient(patient_data)
    # ↑ Calls data_store.py
    return patient
```

### Step 4: `data_store.py` Stores It
```python
# In data_store.py (line 129)
def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
    # patient_data is already validated by Pydantic (from models.py)
    
    patient_id = str(uuid.uuid4())
    now = datetime.now()
    
    # Calculate risk level
    risk_level = self._calculate_risk_level(patient_data.vitals)
    
    # Create patient dict
    patient_dict = {
        "id": patient_id,
        **patient_data.dict(),  # Convert Pydantic model to dict
        "riskLevel": risk_level,
        "lastVisit": date.today(),
        "createdAt": now,
        "updatedAt": now
    }
    
    # Store in shared dictionary
    self.patients[patient_id] = patient_dict
    # ↑ This is the shared storage!
    
    # Return as Pydantic model
    return PatientResponse(**patient_dict)
```

### Step 5: Response Sent Back
```python
# patients.py returns PatientResponse
# FastAPI converts it to JSON
# Frontend receives:
{
  "id": "abc-123",
  "name": "John Doe",
  "age": 30,
  "condition": "Hypertension",
  "riskLevel": "medium",
  ...
}
```

---

## 🔄 Real Example: Synchronization

### Doctor Creates Appointment

**Request**:
```http
POST /api/doctors/appointments
{
  "patientId": "1",
  "doctorId": "doc1",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00",
  "reason": "Checkup"
}
```

**Code Flow**:
```python
# 1. app.py routes to doctors.router
# 2. routers/doctors.py receives it
@router.post("/appointments")
async def create_appointment(appointment_data: AppointmentCreate):
    appointment = data_store.create_appointment(appointment_data)
    # ↑ Stores in: data_store.appointments["appt-123"] = {...}
    return appointment
```

**What Happens in Data Store**:
```python
# In data_store.py
def create_appointment(self, appointment_data):
    appointment_id = "appt-123"
    self.appointments[appointment_id] = {
        "id": appointment_id,
        "patientId": "1",
        "doctorId": "doc1",
        "scheduledDate": "2024-01-15",
        ...
    }
    # ↑ Stored in shared dictionary!
    return AppointmentResponse(**self.appointments[appointment_id])
```

### Provider Reads Appointments

**Request**:
```http
GET /api/providers/patients/1/appointments
```

**Code Flow**:
```python
# 1. app.py routes to providers.router
# 2. routers/providers.py receives it
@router.get("/patients/{patient_id}/appointments")
async def get_patient_appointments(patient_id: str):
    appointments = data_store.get_appointments_by_patient(patient_id)
    # ↑ Reads from: data_store.appointments (same dictionary!)
    return appointments
```

**What Happens in Data Store**:
```python
# In data_store.py
def get_appointments_by_patient(self, patient_id):
    return [
        AppointmentResponse(**appt) 
        for appt in self.appointments.values() 
        if appt.get("patientId") == patient_id
    ]
    # ↑ Reads from the SAME self.appointments dictionary!
    # Returns the appointment created above!
```

**Result**: Provider sees the appointment immediately! ✅

---

## 🎯 Key Takeaways

1. **`data_store = DataStore()`** is created **once** in `data_store.py`
2. **All routers import the same instance**: `from data_store import data_store`
3. **When doctor writes**: `data_store.create_appointment()` → stored in shared dict
4. **When provider reads**: `data_store.get_appointments_by_patient()` → reads from same dict
5. **They stay in sync** because they use the same object!

---

## 🔍 Check It Yourself

You can verify this by looking at the imports:

```bash
# In routers/patients.py (line 18)
grep "from data_store" routers/patients.py

# In routers/doctors.py (line 18)  
grep "from data_store" routers/doctors.py

# In routers/providers.py (line 18)
grep "from data_store" routers/providers.py
```

All three import the **same** `data_store` instance! That's the synchronization magic! ✨

