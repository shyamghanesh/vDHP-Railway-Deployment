# Backend-First Approach with localStorage Fallback

## Overview

The prescription form uses a **backend-first approach** with localStorage as a fallback to ensure patient data is always up-to-date while maintaining offline functionality.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prescription Form Component                    │
│                    (PrescriptionsModule.tsx)                      │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                │ 1. User opens form / selects patient
                                ▼
                    ┌───────────────────────────┐
                    │   loadPatients() Function  │
                    │  or refreshSelectedPatient()│
                    └───────────┬───────────────┘
                                │
                                │ 2. Try Backend First
                                ▼
        ┌───────────────────────────────────────┐
        │   Attempt: getAllPatientsFromBackend() │
        │   or getPatientFromBackend(patientId) │
        └───────────┬───────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   ┌─────────┐          ┌──────────────┐
   │ SUCCESS │          │   FAILURE    │
   │         │          │ (Network     │
   │         │          │  Error,      │
   │         │          │  Timeout,    │
   │         │          │  etc.)       │
   └────┬────┘          └──────┬───────┘
        │                      │
        │ 3a. Convert          │ 3b. Fallback to
        │ Backend Format       │ localStorage
        │ to PatientRecord     │
        │                      │
        ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐
   │ Update State     │  │ getPatients()    │
   │ with Backend     │  │ from localStorage│
   │ Data (Latest)    │  │                  │
   └──────────────────┘  └────────┬─────────┘
                                   │
                                   │ 4. Update State
                                   ▼
                          ┌──────────────────┐
                          │  Update patients │
                          │  state in React  │
                          │  Component       │
                          └──────────────────┘
```

## Detailed Process Flow

### Scenario 1: Backend Available (Ideal Case)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Action                                         │
│ - Opens prescription form                                    │
│ - OR selects a patient                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Backend Request                                     │
│ GET http://127.0.0.1:8000/api/patients                     │
│ OR                                                          │
│ GET http://127..0.1:8000/api/patients/{patientId}          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Backend Response                                    │
│ ✅ Status: 200 OK                                           │
│ 📦 Data: Latest patient data (including prescriptionCount) │
│    {                                                        │
│      id: "PID017",                                          │
│      name: "Adrian Jason",                                  │
│      condition: "Asthma",                                   │
│      ... (all latest fields)                                │
│    }                                                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Data Conversion                                    │
│ Backend Format → PatientRecord Format                       │
│ (Ensures type compatibility)                                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Update React State                                  │
│ setPatients(convertedPatients)                             │
│ ✅ UI shows latest data                                     │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 2: Backend Unavailable (Fallback)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Action                                         │
│ - Opens prescription form                                    │
│ - OR selects a patient                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Backend Request                                     │
│ GET http://127.0.0.1:8000/api/patients                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Backend Response                                    │
│ ❌ Error: Network Error / Timeout / 500 Error               │
│ ⚠️  Backend not running or unreachable                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Catch Error & Log Warning                           │
│ console.warn('Could not fetch from backend,                 │
│              using localStorage')                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Fallback to localStorage                            │
│ getPatients() → Reads from localStorage['patients']         │
│ 📦 Data: Cached patient data                                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Update React State                                  │
│ setPatients(localStorageData)                               │
│ ⚠️  UI shows cached data (may not be latest)                │
└─────────────────────────────────────────────────────────────┘
```

## Update Propagation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Patient Update Event                      │
│  (User updates patient in AddPatient.tsx or elsewhere)       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Update Backend                                      │
│ PUT /api/patients/{patientId}                               │
│ ✅ Backend updated (source of truth)                        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Update localStorage                                 │
│ writeStorage(updatedPatients)                               │
│ - Saves to localStorage['patients']                         │
│ - Dispatches 'patientUpdated' event                         │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Event Propagation                                   │
│ ┌────────────────────────────────────────┐                  │
│ │ Storage Event (other tabs)             │                  │
│ │ OR                                     │                  │
│ │ Custom Event 'patientUpdated' (same   │                  │
│ │   tab)                                 │                  │
│ └────────────────────────────────────────┘                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Prescription Form Listens                           │
│ useEffect hook detects event                                │
│ - Calls loadPatients()                                       │
│ - Calls refreshSelectedPatient() if patient selected        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Refresh Data                                        │
│ Backend-first approach kicks in again                       │
│ ✅ Form shows updated patient data                          │
└──────────────────────────────────────────────────────────────┘
```

## Code Implementation Flow

### 1. Initial Load (Component Mount)

```typescript
useEffect(() => {
  loadData();  // Loads both prescriptions and patients
}, []);

// When form opens
useEffect(() => {
  if (showForm) {
    loadPatients();  // Refresh patient list
  }
}, [showForm]);
```

### 2. Patient Selection

```typescript
// When patient is selected
onSelect={() => {
  setFormData({ ...formData, patientId: patient.id });
  refreshSelectedPatient(patient.id);  // Immediate refresh
}}

// Also via useEffect
useEffect(() => {
  if (formData.patientId && showForm) {
    refreshSelectedPatient(formData.patientId);
  }
}, [formData.patientId, showForm]);
```

### 3. Real-time Updates

```typescript
// Listen for updates
useEffect(() => {
  // Storage event (other tabs)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'patients' && showForm) {
      loadPatients();
      if (formData.patientId) {
        refreshSelectedPatient(formData.patientId);
      }
    }
  };
  
  // Custom event (same tab)
  const handlePatientUpdate = () => {
    if (showForm) {
      loadPatients();
      if (formData.patientId) {
        refreshSelectedPatient(formData.patientId);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('patientUpdated', handlePatientUpdate);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('patientUpdated', handlePatientUpdate);
  };
}, [showForm, formData.patientId]);
```

## Benefits of This Approach

### ✅ Advantages

1. **Always Fresh Data**: When backend is available, always gets latest data
2. **Offline Support**: Falls back to localStorage when backend is down
3. **Real-time Updates**: Automatically refreshes when patient data changes
4. **User Experience**: No manual refresh needed
5. **Resilient**: Works even if backend is temporarily unavailable

### ⚠️ Trade-offs

1. **Network Dependency**: Requires backend for latest data
2. **Potential Staleness**: localStorage data may be outdated if backend unavailable
3. **Complexity**: More code to handle both paths

## Data Sources Priority

```
Priority 1: Backend API (http://127.0.0.1:8000/api/patients)
   ↓ (if unavailable)
Priority 2: localStorage (cached data)
   ↓ (if unavailable)
Priority 3: Default/Seeded data
```

## Example: Patient Update Flow

```
User updates "Adrian Jason" → Asthma → Diabetes
   │
   ├─→ Backend: PUT /api/patients/PID017
   │   └─→ Backend stores: { condition: "Diabetes" }
   │
   ├─→ localStorage: writeStorage()
   │   └─→ localStorage['patients'] = [...updated data...]
   │   └─→ window.dispatchEvent('patientUpdated')
   │
   └─→ Prescription Form (if open):
       ├─→ Listens to 'patientUpdated' event
       ├─→ Calls loadPatients()
       ├─→ Fetches from backend (Priority 1)
       │   └─→ Gets: { condition: "Diabetes" } ✅
       └─→ Updates UI: "Adrian Jason • PID017 • Diabetes"
```

## Summary

The **backend-first approach** ensures:
- 📡 **Primary**: Always try backend for latest data
- 💾 **Fallback**: Use localStorage if backend unavailable
- 🔄 **Auto-refresh**: Listen for updates and refresh automatically
- 🎯 **Result**: Patient details always stay current in prescription form

This creates a robust, user-friendly system that keeps data synchronized across the application while maintaining offline functionality.

