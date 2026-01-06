
import axios from 'axios';

import { API_BASE_URL as API_URL } from '@/config';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  status?: string; // Backend doesn't return status in AppointmentResponse yet, but FHIR has it.
  createdAt?: string;
  patientName?: string; // Helper for UI
}

export interface CreateAppointmentDTO {
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
}

export const getDoctorAppointments = async (doctorId: string): Promise<Appointment[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/doctors/${doctorId}/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createAppointment = async (appointmentData: CreateAppointmentDTO): Promise<Appointment> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/api/doctors/appointments`, appointmentData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId: string, status: string): Promise<Appointment> => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/api/doctors/appointments/${appointmentId}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/providers/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
