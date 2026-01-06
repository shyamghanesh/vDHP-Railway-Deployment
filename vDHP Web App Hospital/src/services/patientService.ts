export type RiskLevel = 'low' | 'medium' | 'high';

export interface Vitals {
  heartRate: number;
  bloodPressure: string; // e.g., "120/80"
  temperature: number; // Fahrenheit
  oxygenSat: number; // percentage
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  condition: string;
  riskLevel: RiskLevel;
  lastVisit: string; // YYYY-MM-DD
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  vitals: Vitals;
  prescriptionImageDataUrl?: string; // optional uploaded prescription image
  prescriptionCount?: number; // number of prescriptions for this patient
  // Medical History Fields
  medicalHistory?: string[];
  allergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  emergencyContact?: EmergencyContact;
  // Additional Demographics
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

const STORAGE_KEY = 'patients';

function readStorage(): PatientRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PatientRecord[];
    return [];
  } catch {
    return [];
  }
}

function writeStorage(patients: PatientRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  // Dispatch custom event to notify other components in the same tab
  window.dispatchEvent(new Event('patientUpdated'));
}

function generatePatientId(patients: PatientRecord[]): string {
  // Extract numeric parts from existing PIDs
  let maxNum = 0;
  for (const patient of patients) {
    if (patient.id.startsWith('PID')) {
      try {
        const num = parseInt(patient.id.substring(3), 10);
        if (!isNaN(num)) {
          maxNum = Math.max(maxNum, num);
        }
      } catch {
        // If it's not a valid PID format, ignore it
      }
    }
  }

  // Generate next PID
  const nextNum = maxNum + 1;
  return `PID${nextNum.toString().padStart(3, '0')}`; // Format as PID001, PID002, etc.
}

export function getPatients(): PatientRecord[] {
  const patients = readStorage();
  if (patients.length === 0) {
    const seeded = seedDefaults();
    writeStorage(seeded);
    return seeded;
  }
  return patients;
}

export function addPatient(newPatient: PatientRecord): void {
  const patients = readStorage();

  // Only generate a PID if the patient doesn't have an ID
  if (!newPatient.id) {
    newPatient.id = generatePatientId(patients);
  }

  patients.unshift(newPatient);
  writeStorage(patients);
}

export async function deletePatientById(patientId: string): Promise<void> {
  // Delete from backend first
  try {
    const { deletePatientFromBackend } = await import('./patientApiService');
    await deletePatientFromBackend(patientId);
  } catch (error) {
    console.warn('Failed to delete patient from backend, deleting from localStorage only:', error);
    // Continue with local deletion even if backend fails
  }

  // Delete from localStorage
  const patients = readStorage();
  const next = patients.filter(p => p.id !== patientId);
  writeStorage(next);
}

export function getPatientById(patientId: string): PatientRecord | undefined {
  return readStorage().find(p => p.id === patientId);
}

export async function updatePatient(updated: PatientRecord): Promise<void> {
  // Update in backend first
  try {
    const { updatePatientInBackend } = await import('./patientApiService');
    const patientData = {
      name: updated.name,
      age: updated.age,
      condition: updated.condition,
      location: updated.location,
      vitals: updated.vitals,
      medicalHistory: updated.medicalHistory,
      allergies: updated.allergies,
      currentMedications: updated.currentMedications,
      familyHistory: updated.familyHistory,
      emergencyContact: updated.emergencyContact,
      phone: updated.phone,
      email: updated.email,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      maritalStatus: updated.maritalStatus,
      occupation: updated.occupation,
      insuranceProvider: updated.insuranceProvider,
      insuranceNumber: updated.insuranceNumber,
    };
    // Get the updated patient from backend (includes prescription count and any backend changes)
    const backendPatient = await updatePatientInBackend(updated.id, patientData);

    // Update local storage with the backend response (backend is source of truth)
    const patients = readStorage();
    const idx = patients.findIndex(p => p.id === updated.id);
    const updatedPatient: PatientRecord = {
      id: backendPatient.id,
      name: backendPatient.name,
      age: backendPatient.age,
      condition: backendPatient.condition,
      riskLevel: backendPatient.riskLevel,
      lastVisit: backendPatient.lastVisit,
      location: backendPatient.location,
      vitals: backendPatient.vitals,
      prescriptionCount: backendPatient.prescriptionCount,
      medicalHistory: backendPatient.medicalHistory,
      allergies: backendPatient.allergies,
      currentMedications: backendPatient.currentMedications,
      familyHistory: backendPatient.familyHistory,
      emergencyContact: backendPatient.emergencyContact,
      phone: backendPatient.phone,
      email: backendPatient.email,
      dateOfBirth: backendPatient.dateOfBirth,
      gender: backendPatient.gender,
      maritalStatus: backendPatient.maritalStatus,
      occupation: backendPatient.occupation,
      insuranceProvider: backendPatient.insuranceProvider,
      insuranceNumber: backendPatient.insuranceNumber,
      prescriptionImageDataUrl: (backendPatient as any).prescriptionImageDataUrl,
    };

    if (idx === -1) {
      patients.unshift(updatedPatient);
    } else {
      patients[idx] = updatedPatient;
    }
    writeStorage(patients);
    return;
  } catch (error) {
    console.warn('Failed to update patient in backend, updating localStorage only:', error);
    // Continue with local update even if backend fails
  }

  // Fallback: Update in localStorage only if backend update failed
  const patients = readStorage();
  const idx = patients.findIndex(p => p.id === updated.id);
  if (idx === -1) {
    // If not found, generate a PID and add it (upsert behavior)
    if (!updated.id || !updated.id.startsWith('PID')) {
      updated.id = generatePatientId(patients);
    }
    patients.unshift(updated);
  } else {
    patients[idx] = updated;
  }
  writeStorage(patients);
}

function seedDefaults(): PatientRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 'PID001',
      name: 'Sarah Johnson',
      age: 45,
      condition: 'Hypertension',
      riskLevel: 'medium',
      lastVisit: today,
      location: {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      },
      vitals: {
        heartRate: 78,
        bloodPressure: '140/90',
        temperature: 98.6,
        oxygenSat: 98,
      },
    },
    {
      id: 'PID002',
      name: 'Michael Chen',
      age: 32,
      condition: 'Diabetes Type 2',
      riskLevel: 'high',
      lastVisit: today,
      location: {
        address: '456 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'United States',
      },
      vitals: {
        heartRate: 82,
        bloodPressure: '135/85',
        temperature: 98.4,
        oxygenSat: 97,
      },
    },
    {
      id: 'PID003',
      name: 'Emma Davis',
      age: 28,
      condition: 'Asthma',
      riskLevel: 'low',
      lastVisit: today,
      location: {
        address: '789 Lakeview Ave',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'United States',
      },
      vitals: {
        heartRate: 70,
        bloodPressure: '120/80',
        temperature: 98.2,
        oxygenSat: 99,
      },
    },
  ];
}


