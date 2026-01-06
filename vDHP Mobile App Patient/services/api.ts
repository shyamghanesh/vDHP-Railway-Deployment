import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve API base URL priority:
// 1) EXPO_PUBLIC_API_URL (set this in app config or env)
// 2) Expo hostUri-derived LAN IP
// 3) Emulator/simulator defaults
const ENV_API = process.env.EXPO_PUBLIC_API_URL as string | undefined;
const hostFromExpo = (() => {
  const hostUri = (Constants as any)?.expoConfig?.hostUri as string | undefined;
  if (!hostUri) return undefined;
  const host = hostUri.split(':')[0];
  if (!host) return undefined;
  return `http://${host}:8001`;
})();
const platformLocalhost =
  Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://127.0.0.1:8001';
const API_URL = (ENV_API || hostFromExpo || platformLocalhost).trim();
// eslint-disable-next-line no-console
console.log('[API] Base URL:', API_URL);
// In services/api.ts, add this to your patientService object

// Assuming you have a separate instance of Axios for FHIR or can use the main one
const fhirApi = axios.create({
  baseURL: 'https://hapi.fhir.org/baseR4',
  headers: {
    'Content-Type': 'application/fhir+json',
  },
});

// createFhirConsent moved into patientService, using fhirApi

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // eslint-disable-next-line no-console
    console.log('[API] Error:', {
      url: error?.config?.url,
      method: error?.config?.method,
      baseURL: error?.config?.baseURL,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

export const authService = {
  validateInvitation: async (invitationCode: string) => {
    const response = await api.post('/auth/validate-invitation', { invitation_code: invitationCode });
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      await AsyncStorage.setItem('patient_name', `${response.data.first_name} ${response.data.last_name}`);
    }
    return response.data;
  },
  
  registerSimple: async (data: any) => {
    const response = await api.post('/auth/register-simple', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      await AsyncStorage.setItem('patient_name', `${response.data.first_name} ${response.data.last_name}`);
    }
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      await AsyncStorage.setItem('patient_name', `${response.data.first_name} ${response.data.last_name}`);
    }
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('patient_id');
    await AsyncStorage.removeItem('patient_fhir_id');
    await AsyncStorage.removeItem('patient_name');
  },
};

export const patientService = {
  getProfile: async (patientId: string) => {
    const response = await api.get('/patients/me');
    return response.data;
  },
  
  updateProfile: async (patientId: string, data: any) => {
    const response = await api.put('/patients/me', data);
    return response.data;
  },
  
  createConsent: async (consent: any) => {
    const response = await api.post('/patients/me/consents', consent);
    return response.data;
  },

  createFhirConsent: async (fhirConsentPayload: any) => {
    const response = await fhirApi.post('/Consent', fhirConsentPayload);
    return response.data;
  },

  getFhirConsent: async (patientFhirId: string) => {
    const response = await fhirApi.get(`/Consent?patient=Patient/${patientFhirId}`);
    return response.data;
  },
  
  getTasks: async (patientId: string, status?: string, page = 1) => {
    const url = `/care-plans/tasks?page=${page}${status ? `&status=${status}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  completeTask: async (taskId: string, patientId: string, responseData?: any) => {
    const response = await api.put(`/care-plans/tasks/${taskId}/complete`, {
      response_data: responseData,
    });
    return response.data;
  },
};

export const messageService = {
  getMessages: async (patientId: string, page = 1) => {
    const response = await api.get(`/messages?page=${page}`);
    return response.data;
  },
  
  sendMessage: async (patientId: string, message: any) => {
    const response = await api.post('/messages', message);
    return response.data;
  },
};

export const vitalsService = {
  createVitals: async (vitalsData: any) => {
    const response = await api.post('/vitals', vitalsData);
    return response.data;
  },
  
  getVitals: async (vitalsType?: string, days: number = 30) => {
    const url = `/vitals?days=${days}${vitalsType ? `&vitals_type=${vitalsType}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getLatestVitals: async () => {
    const response = await api.get('/vitals/latest');
    return response.data;
  },
  
  deleteVitals: async (vitalsId: string) => {
    const response = await api.delete(`/vitals/${vitalsId}`);
    return response.data;
  },
};

export default api;
