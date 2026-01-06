/**
 * Appointment Service
 * Handles API calls related to appointments
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  reason: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all appointments for a specific doctor
 */
export async function getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/appointments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

/**
 * Get all appointments for a specific patient
 */
export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/providers/patients/${patientId}/appointments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patient appointments: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    throw error;
  }
}

export interface AppointmentCreate {
  patientId: string;
  doctorId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  reason: string;
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointmentData: AppointmentCreate): Promise<Appointment> {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create appointment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

