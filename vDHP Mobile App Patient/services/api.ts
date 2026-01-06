import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API Configuration for vDHP Patient Mobile App
 * 
 * Priority for API URL resolution:
 * 1) EXPO_PUBLIC_API_URL environment variable (for production/Railway)
 * 2) Expo hostUri-derived LAN IP (for local development)
 * 3) Emulator/simulator defaults
 */

// Get environment variable (set this to Railway URL in production)
const ENV_API = process.env.EXPO_PUBLIC_API_URL as string | undefined;

// Extract LAN IP from Expo host URI for development
const hostFromExpo = (() => {
  const hostUri = (Constants as any)?.expoConfig?.hostUri as string | undefined;
  if (!hostUri) return undefined;
  const host = hostUri.split(':')[0];
  if (!host) return undefined;
  return `http://${host}:8001`;
})();

// Platform-specific localhost for emulators
const platformLocalhost =
  Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://127.0.0.1:8001';

// Resolved API URL with priority fallback
const API_URL = (ENV_API || hostFromExpo || platformLocalhost).trim();

// Log the resolved URL for debugging
console.log('[API] Base URL:', API_URL);
console.log('[API] Environment:', ENV_API ? 'production' : 'development');

// FHIR API for standard FHIR operations
const fhirApi = axios.create({
  baseURL: 'https://hapi.fhir.org/baseR4',
  headers: {
    'Content-Type': 'application/fhir+json',
  },
});

// Main API client
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API] Error:', {
      url: error?.config?.url,
      method: error?.config?.method,
      baseURL: error?.config?.baseURL,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      // Could trigger logout here if needed
      console.log('[API] Unauthorized - token may be expired');
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  validateInvitation: async (invitationCode: string) => {
    const response = await api.post('/auth/validate-invitation', { invitation_code: invitationCode });
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user_id', response.data.user_id);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      if (response.data.patient_fhir_id) {
        await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      }
    }
    return response.data;
  },

  registerSimple: async (data: any) => {
    const response = await api.post('/auth/register-simple', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user_id', response.data.user_id);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      if (response.data.patient_fhir_id) {
        await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      }
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user_id', response.data.user_id);
      await AsyncStorage.setItem('patient_id', response.data.patient_id);
      if (response.data.patient_fhir_id) {
        await AsyncStorage.setItem('patient_fhir_id', response.data.patient_fhir_id);
      }
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      'access_token',
      'user_id',
      'patient_id',
      'patient_fhir_id',
      'patient_name',
    ]);
  },

  getToken: async () => {
    return await AsyncStorage.getItem('access_token');
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
};

// ============================================================================
// PATIENT SERVICE
// ============================================================================

export const patientService = {
  getProfile: async () => {
    const response = await api.get('/patients/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
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
};

// ============================================================================
// CARE PLAN SERVICE
// ============================================================================

export const carePlanService = {
  getCarePlans: async (page = 1) => {
    const response = await api.get(`/care-plans?page=${page}`);
    return response.data;
  },

  getTasks: async (status?: string, page = 1) => {
    const url = `/care-plans/tasks?page=${page}${status ? `&status=${status}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  completeTask: async (taskId: string, responseData?: any) => {
    const response = await api.put(`/care-plans/tasks/${taskId}/complete`, {
      response_data: responseData,
    });
    return response.data;
  },
};

// ============================================================================
// MESSAGE SERVICE
// ============================================================================

export const messageService = {
  getMessages: async (page = 1) => {
    const response = await api.get(`/messages?page=${page}`);
    return response.data;
  },

  sendMessage: async (message: any) => {
    const response = await api.post('/messages', message);
    return response.data;
  },

  markAsRead: async (messageId: string) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },
};

// ============================================================================
// VITALS SERVICE
// ============================================================================

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

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
