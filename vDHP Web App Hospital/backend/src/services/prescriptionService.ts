/**
 * Prescription Service
 * Handles all API calls related to prescriptions
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  instructions: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  refills?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PrescriptionCreate {
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  instructions: string;
  startDate?: string;
  endDate?: string;
  refills?: number;
}

/**
 * Get all prescriptions for a specific doctor
 */
export async function getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
  try {
    console.log('Fetching prescriptions for doctor:', doctorId);
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/prescriptions`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    console.log('Get prescriptions by doctor response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    if (!response.ok) {
      let errorMessage = `Failed to fetch prescriptions (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error('Get prescriptions by doctor error details:', errorData);
      } catch {
        const errorText = await response.text().catch(() => response.statusText);
        console.error('Get prescriptions by doctor error (non-JSON):', errorText);
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    console.log(`Fetched ${result.length} prescriptions for doctor ${doctorId}:`, result);
    return result;
  } catch (error: any) {
    console.error('Error fetching prescriptions by doctor:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get all prescriptions for a specific patient
 */
export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  try {
    console.log('Fetching prescriptions for patient:', patientId);
    const response = await fetch(`${API_BASE_URL}/providers/patients/${patientId}/prescriptions`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    console.log('Get prescriptions by patient response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    if (!response.ok) {
      let errorMessage = `Failed to fetch patient prescriptions (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error('Get prescriptions by patient error details:', errorData);
      } catch {
        const errorText = await response.text().catch(() => response.statusText);
        console.error('Get prescriptions by patient error (non-JSON):', errorText);
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    console.log(`Fetched ${result.length} prescriptions for patient ${patientId}:`, result);
    return result;
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get a specific prescription by ID
 */
export async function getPrescriptionById(prescriptionId: string): Promise<Prescription> {
  try {
    console.log('Fetching prescription by ID:', prescriptionId);
    const response = await fetch(`${API_BASE_URL}/doctors/prescriptions/${prescriptionId}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    console.log('Get prescription by ID response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    if (!response.ok) {
      let errorMessage = `Failed to fetch prescription (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error('Get prescription by ID error details:', errorData);
      } catch {
        const errorText = await response.text().catch(() => response.statusText);
        console.error('Get prescription by ID error (non-JSON):', errorText);
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    console.log('Prescription fetched successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error fetching prescription by ID:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Create a new prescription
 */
export async function createPrescription(prescriptionData: PrescriptionCreate): Promise<Prescription> {
  try {
    console.log('Creating prescription with data:', prescriptionData);
    const response = await fetch(`${API_BASE_URL}/doctors/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(prescriptionData),
    });

    console.log('Prescription creation response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorMessage = `Failed to create prescription (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error('Prescription creation error details:', errorData);
      } catch {
        // If JSON parsing fails, use the status text
        const errorText = await response.text().catch(() => response.statusText);
        console.error('Prescription creation error (non-JSON):', errorText);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Prescription created successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    // If it's a network error, provide a more helpful message
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error(`Cannot connect to backend server at http://127.0.0.1:8000. Please ensure the backend is running and CORS is properly configured.`);
    }
    throw error;
  }
}

/**
 * Update a prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  prescriptionData: Partial<PrescriptionCreate>
): Promise<Prescription> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prescriptionData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to update prescription: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
}

/**
 * Delete a prescription
 */
export async function deletePrescription(prescriptionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete prescription: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting prescription:', error);
    throw error;
  }
}

