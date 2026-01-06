# Patient Data Synchronization & Pre-filling

## Overview

This document explains how patient data pre-filling and synchronization works across the application. When a patient is edited, the form is pre-filled with existing data, and when saved, the changes are automatically reflected everywhere in the application.

## Pre-filling Process

### When Editing a Patient

When you navigate to the Add Patient form with an `id` parameter (e.g., `/add-patient?id=PID017`), the form automatically pre-fills with the patient's existing data.

#### Data Loading Priority

```
┌─────────────────────────────────────────┐
│  User opens edit form with ?id=PID017  │
└──────────────────┬──────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 1: Try Backend  │
        │  getPatientFromBackend│
        │  (Most up-to-date)    │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   ┌─────────┐          ┌──────────────┐
   │ SUCCESS │          │   FAILURE    │
   └────┬────┘          └──────┬───────┘
        │                       │
        │  Step 2a: Use         │  Step 2b: Fallback
        │  Backend Data         │  to localStorage
        │                       │  getPatientById()
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 3: Parse & Fill │
        │  - Split name         │
        │  - Parse blood        │
        │    pressure           │
        │  - Map all fields     │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Form Pre-filled!     │
        │  Ready for editing    │
        └───────────────────────┘
```

#### Fields Pre-filled

All patient fields are automatically pre-filled:

- **Basic Demographics**: First Name, Last Name, Date of Birth, Gender, Phone, Email
- **Location**: Address, City, State, Zip Code, Country
- **Medical History**: Conditions, Allergies, Current Medications, Family History
- **Emergency Contact**: Name, Relationship, Phone
- **Additional Info**: Marital Status, Occupation, Insurance Provider, Insurance Number
- **Vitals**: Heart Rate, Blood Pressure (systolic/diastolic), Temperature, Oxygen Saturation
- **Files**: Prescription images (if any)

## Data Synchronization After Save

### Update Flow

When a patient is saved (created or updated), the changes propagate throughout the application:

```
┌─────────────────────────────────────────┐
│  User saves patient in AddPatient form │
└──────────────────┬──────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 1: Update       │
        │  Backend API          │
        │  PUT /api/patients/ID │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 2: Update       │
        │  localStorage         │
        │  writeStorage()       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 3: Dispatch     │
        │  'patientUpdated'     │
        │  Event                │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 4: All          │
        │  Components Listen    │
        │  & Refresh            │
        └───────────────────────┘
```

### Components That Auto-Refresh

The following components automatically refresh when patient data is updated:

1. **PrescriptionsModule** (`/doctor/prescriptions`)
   - Refreshes patient list when form opens
   - Refreshes selected patient when patient is selected
   - Listens for `patientUpdated` events

2. **ProviderDashboard** (`/provider`)
   - Refreshes patient list
   - Refreshes selected patient details
   - Listens for storage and custom events

3. **PatientManagement** (`/doctor/patients`)
   - Refreshes patient list
   - Refreshes selected patient details
   - Listens for storage and custom events

4. **DashboardOverview** (`/doctor/dashboard`)
   - Refreshes dashboard stats
   - Refreshes patient data used in activities
   - Listens for storage and custom events

5. **PatientProfile** (when viewing patient details)
   - Refreshes patient information
   - Refreshes prescriptions list

### Event System

#### Storage Events (Cross-Tab)

When patient data is updated in one browser tab, other tabs are notified via the `storage` event:

```typescript
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === 'patients') {
    // Refresh patient data
    loadPatients();
  }
});
```

#### Custom Events (Same Tab)

When patient data is updated in the same tab, components are notified via a custom `patientUpdated` event:

```typescript
// In patientService.ts
function writeStorage(patients: PatientRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  // Dispatch custom event
  window.dispatchEvent(new Event('patientUpdated'));
}

// In components
window.addEventListener('patientUpdated', () => {
  // Refresh patient data
  loadPatients();
});
```

## Implementation Details

### Pre-filling Code

Located in `src/pages/AddPatient.tsx`:

```typescript
React.useEffect(() => {
  if (!editingId) return;
  
  const loadPatientData = async () => {
    let patient: any = null;
    
    // Try backend first
    try {
      patient = await getPatientFromBackend(editingId);
    } catch (error) {
      console.warn('Failed to fetch from backend, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    if (!patient) {
      patient = getPatientById(editingId);
    }
    
    if (!patient) {
      alert('Patient not found. Redirecting...');
      navigate('/');
      return;
    }
    
    // Parse and set form data
    const nameParts = (patient.name || '').split(' ');
    const [sys, dia] = (patient.vitals?.bloodPressure || '120/80').split('/');
    
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      // ... all other fields
      heartRate: String(patient.vitals?.heartRate || ''),
      systolic: sys || '',
      diastolic: dia || '',
      temperature: String(patient.vitals?.temperature || ''),
      oxygenSat: String(patient.vitals?.oxygenSat || ''),
      // ... etc
    });
  };
  
  loadPatientData();
}, [editingId, navigate]);
```

### Update Propagation Code

Located in `src/services/patientService.ts`:

```typescript
export async function updatePatient(updated: PatientRecord): Promise<void> {
  // 1. Update backend
  const backendPatient = await updatePatientInBackend(updated.id, patientData);
  
  // 2. Update localStorage
  const patients = readStorage();
  const idx = patients.findIndex(p => p.id === updated.id);
  patients[idx] = updatedPatient;
  writeStorage(patients); // This dispatches 'patientUpdated' event
}
```

### Component Refresh Code

Each component listens for updates:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'patients' && showForm) {
      loadPatients();
      if (formData.patientId) {
        refreshSelectedPatient(formData.patientId);
      }
    }
  };

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

## Benefits

✅ **Automatic Pre-filling**: No manual data entry when editing  
✅ **Real-time Updates**: Changes reflect immediately across all components  
✅ **Cross-Tab Sync**: Updates work across multiple browser tabs  
✅ **Backend-First**: Always tries to get latest data from backend  
✅ **Offline Support**: Falls back to localStorage if backend unavailable  
✅ **No Manual Refresh**: Everything updates automatically  

## Testing

To test the synchronization:

1. **Open two browser tabs** with the application
2. **Edit a patient** in one tab (e.g., change name from "Sarah Johnson" to "Sarah Smith")
3. **Save the patient**
4. **Check the other tab** - patient data should update automatically
5. **Open prescription form** - patient name should show updated value
6. **Check patient list** - updated name should appear everywhere

## Summary

- ✅ Pre-filling works automatically when editing (fetches from backend first, then localStorage)
- ✅ All form fields are pre-filled correctly
- ✅ Updates propagate to all components automatically
- ✅ Works across browser tabs via storage events
- ✅ Works in same tab via custom events
- ✅ Backend-first approach ensures latest data
- ✅ Graceful fallback to localStorage if backend unavailable

The system ensures that patient data is always up-to-date and synchronized across the entire application!

