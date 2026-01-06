/**
 * Patient API Service
 * Handles API calls to sync patients with backend
 */

import { API_ENDPOINT as API_BASE_URL, API_BASE_URL as BACKEND_BASE_URL } from '@/config';

/**
 * Check if backend is running and accessible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
  }
}

export interface PatientApiResponse {
  id: string;
  name: string;
  age: number;
  condition: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastVisit: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
  medicalHistory?: string[];
  allergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  prescriptionCount?: number;
}

export interface PatientApiCreate {
  name: string;
  age: number;
  condition: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
  medicalHistory?: string[];
  allergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  prescriptionCount?: number; // number of prescriptions for this patient
}

/**
 * Get all patients from the backend (includes prescription counts)
 */
export async function getAllPatientsFromBackend(): Promise<PatientApiResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching patients from backend:', error);
    // If it's a network error, return empty array
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Cannot connect to backend server. Returning empty array.');
      return [];
    }
    throw error;
  }
}

/**
 * Get a patient from the backend by ID
 */
export async function getPatientFromBackend(patientId: string): Promise<PatientApiResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching patient from backend:', error);
    // If it's a network error, re-throw it so ensurePatientInBackend can handle it
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please ensure the backend is running.');
    }
    // For other errors, return null (patient doesn't exist)
    return null;
  }
}

/**
 * Create a patient in the backend
 */
export async function createPatientInBackend(patientData: PatientApiCreate & { id?: string }): Promise<PatientApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create patient: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating patient in backend:', error);
    throw error;
  }
}

/**
 * Update a patient in the backend
 */
export async function updatePatientInBackend(patientId: string, patientData: Partial<PatientApiCreate>): Promise<PatientApiResponse> {
  try {
    // Convert PatientRecord format to PatientUpdate format
    const updateData: any = {};

    if (patientData.name) updateData.name = patientData.name;
    if (patientData.age !== undefined) updateData.age = patientData.age;
    if (patientData.condition) updateData.condition = patientData.condition;
    if (patientData.location) updateData.location = patientData.location;
    if (patientData.vitals) updateData.vitals = patientData.vitals;
    if (patientData.medicalHistory) updateData.medicalHistory = patientData.medicalHistory;
    if (patientData.allergies !== undefined) updateData.allergies = patientData.allergies;
    if (patientData.currentMedications !== undefined) updateData.currentMedications = patientData.currentMedications;
    if (patientData.familyHistory !== undefined) updateData.familyHistory = patientData.familyHistory;
    if (patientData.emergencyContact) updateData.emergencyContact = patientData.emergencyContact;
    if (patientData.phone !== undefined) updateData.phone = patientData.phone;
    if (patientData.email !== undefined) updateData.email = patientData.email;
    if (patientData.dateOfBirth !== undefined) updateData.dateOfBirth = patientData.dateOfBirth;
    if (patientData.gender !== undefined) updateData.gender = patientData.gender;
    if (patientData.maritalStatus !== undefined) updateData.maritalStatus = patientData.maritalStatus;
    if (patientData.occupation !== undefined) updateData.occupation = patientData.occupation;
    if (patientData.insuranceProvider !== undefined) updateData.insuranceProvider = patientData.insuranceProvider;
    if (patientData.insuranceNumber !== undefined) updateData.insuranceNumber = patientData.insuranceNumber;

    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update patient: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating patient in backend:', error);
    throw error;
  }
}

/**
 * Delete a patient from the backend
 */
export async function deletePatientFromBackend(patientId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to delete patient: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting patient from backend:', error);
    throw error;
  }
}

/**
 * Ensure patient exists in backend, create if it doesn't
 */
export async function ensurePatientInBackend(patient: any): Promise<string> {
  // Validate required fields before attempting sync
  if (!patient) {
    throw new Error('Patient data is missing');
  }

  // Debug: Log patient object to help diagnose issues
  console.log('Syncing patient to backend:', {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    condition: patient.condition,
    hasLocation: !!patient.location,
    hasVitals: !!patient.vitals
  });

  // Check for required fields with better validation
  if (!patient.name || typeof patient.name !== 'string' || patient.name.trim().length === 0) {
    throw new Error(`Patient name is missing or invalid (got: ${JSON.stringify(patient.name)}). Please ensure the patient has a valid name.`);
  }

  if (typeof patient.age !== 'number' || isNaN(patient.age) || patient.age < 0 || patient.age > 150) {
    throw new Error(`Patient age is missing or invalid (got: ${JSON.stringify(patient.age)}). Please ensure the patient has a valid age (0-150).`);
  }

  if (!patient.condition || typeof patient.condition !== 'string' || patient.condition.trim().length === 0) {
    throw new Error(`Patient condition is missing or invalid (got: ${JSON.stringify(patient.condition)}). Please ensure the patient has a valid medical condition.`);
  }

  if (!patient.location || !patient.location.address || !patient.location.city ||
    !patient.location.state || !patient.location.zipCode) {
    throw new Error('Patient location information is incomplete. Please ensure address, city, state, and zip code are provided.');
  }

  if (!patient.vitals) {
    throw new Error('Patient vital signs are missing. Please ensure all vitals are provided.');
  }

  // Validate vitals with reasonable value ranges
  if (typeof patient.vitals.heartRate !== 'number' || patient.vitals.heartRate <= 0 || patient.vitals.heartRate > 250) {
    throw new Error('Invalid heart rate. Please provide a valid heart rate (1-250 BPM).');
  }

  if (!patient.vitals.bloodPressure || typeof patient.vitals.bloodPressure !== 'string') {
    throw new Error('Invalid blood pressure. Please provide blood pressure in format "systolic/diastolic" (e.g., "120/80").');
  }

  if (typeof patient.vitals.temperature !== 'number' || patient.vitals.temperature < 80 || patient.vitals.temperature > 120) {
    throw new Error('Invalid temperature. Please provide a valid temperature (80-120°F).');
  }

  if (typeof patient.vitals.oxygenSat !== 'number' || patient.vitals.oxygenSat < 0 || patient.vitals.oxygenSat > 100) {
    throw new Error('Invalid oxygen saturation. Please provide a valid oxygen saturation (0-100%).');
  }

  // Check if backend is accessible first
  const backendAvailable = await checkBackendHealth();
  if (!backendAvailable) {
    throw new Error('Backend server is not running or not accessible. Please start the backend server (run: uvicorn app:app --reload --port 8000 in the backend directory).');
  }

  // First check if patient exists in backend
  const existing = await getPatientFromBackend(patient.id);
  if (existing) {
    return existing.id;
  }

  // If not found, create it in backend
  try {
    const patientData: PatientApiCreate & { id?: string } = {
      id: patient.id || undefined, // Always pass the existing frontend ID to avoid duplicates
      name: patient.name,
      age: patient.age,
      condition: patient.condition,
      location: {
        address: patient.location.address,
        city: patient.location.city,
        state: patient.location.state,
        zipCode: patient.location.zipCode,
        country: patient.location.country || 'United States',
      },
      vitals: {
        heartRate: patient.vitals.heartRate,
        bloodPressure: patient.vitals.bloodPressure,
        temperature: patient.vitals.temperature,
        oxygenSat: patient.vitals.oxygenSat,
      },
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      familyHistory: patient.familyHistory,
      emergencyContact: patient.emergencyContact,
      phone: patient.phone,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      maritalStatus: patient.maritalStatus,
      occupation: patient.occupation,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
    };

    const created = await createPatientInBackend(patientData);
    return created.id;
  } catch (error: any) {
    console.error('Error ensuring patient in backend:', error);
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please ensure the backend is running.');
    }
    // Re-throw the original error message if available
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to sync patient to backend: ${error?.toString() || 'Unknown error'}`);
  }
}

