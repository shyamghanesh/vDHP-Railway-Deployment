/**
 * Doctor API Service
 * Handles API calls to fetch doctors from backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface DoctorApiResponse {
  id: string;
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  hospital?: string;
  createdAt: string;
}

/**
 * Get all doctors from the backend
 */
export async function getAllDoctorsFromBackend(): Promise<DoctorApiResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`);
    if (!response.ok) {
      throw new Error(`Failed to fetch doctors: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching doctors from backend:', error);
    // If it's a network error, return empty array
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Cannot connect to backend server. Returning empty array.');
      return [];
    }
    throw error;
  }
}

/**
 * Get a doctor from the backend by ID
 */
export async function getDoctorFromBackend(doctorId: string): Promise<DoctorApiResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch doctor: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching doctor from backend:', error);
    // If it's a network error, re-throw it
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please ensure the backend is running.');
    }
    // For other errors, return null (doctor doesn't exist)
    return null;
  }
}

