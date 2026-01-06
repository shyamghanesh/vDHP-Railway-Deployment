/**
 * Doctor Service
 * Handles doctor profile management and storage
 */

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  experience: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bio: string;
  consultationFee: number;
  availableHours: string;
  hospitalName?: string;
  branch?: string;
  createdAt?: string;
  updatedAt?: string;
  // New fields
  photo?: string;
  gender?: string;
  birthDate?: string;
}

const STORAGE_KEY = 'doctor_profiles';

function readStorage(): Record<string, DoctorProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, DoctorProfile>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStorage(profiles: Record<string, DoctorProfile>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  // Dispatch custom event to notify other components
  window.dispatchEvent(new Event('doctorProfileUpdated'));
}

/**
 * Get doctor profile by ID
 */
export function getDoctorProfile(doctorId: string): DoctorProfile | null {
  const profiles = readStorage();
  return profiles[doctorId] || null;
}

const API_URL = 'http://localhost:8000/api';

/**
 * Save or update doctor profile
 * This function properly merges new data with existing data, ensuring all changes are saved
 */
export async function saveDoctorProfile(doctorId: string, profile: Partial<DoctorProfile>): Promise<void> {
  const profiles = readStorage();
  const existing = profiles[doctorId];

  // Merge existing profile with new profile data
  const updatedProfile: DoctorProfile = {
    id: doctorId,
    name: profile.name !== undefined ? profile.name : (existing?.name || 'Doctor'),
    email: profile.email !== undefined ? profile.email : (existing?.email || ''),
    phone: profile.phone !== undefined ? profile.phone : (existing?.phone || ''),
    specialization: profile.specialization !== undefined ? profile.specialization : (existing?.specialization || ''),
    qualifications: profile.qualifications !== undefined ? profile.qualifications : (existing?.qualifications || ''),
    experience: profile.experience !== undefined ? profile.experience : (existing?.experience || ''),
    address: profile.address !== undefined ? profile.address : (existing?.address || ''),
    city: profile.city !== undefined ? profile.city : (existing?.city || ''),
    state: profile.state !== undefined ? profile.state : (existing?.state || ''),
    zipCode: profile.zipCode !== undefined ? profile.zipCode : (existing?.zipCode || ''),
    bio: profile.bio !== undefined ? profile.bio : (existing?.bio || ''),
    consultationFee: profile.consultationFee !== undefined ? profile.consultationFee : (existing?.consultationFee ?? 0),
    availableHours: profile.availableHours !== undefined ? profile.availableHours : (existing?.availableHours || ''),
    hospitalName: profile.hospitalName !== undefined ? profile.hospitalName : (existing?.hospitalName || ''),
    branch: profile.branch !== undefined ? profile.branch : (existing?.branch || ''),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // New fields
    photo: profile.photo !== undefined ? profile.photo : (existing?.photo || ''),
    gender: profile.gender !== undefined ? profile.gender : (existing?.gender || ''),
    birthDate: profile.birthDate !== undefined ? profile.birthDate : (existing?.birthDate || ''),
  };

  // 1. Save to Local Storage (Immediate UI update)
  profiles[doctorId] = updatedProfile;
  writeStorage(profiles);

  // 2. Sync with Backend
  try {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Map frontend profile to backend DoctorCreate model
    const backendData = {
      name: updatedProfile.name,
      specialty: updatedProfile.specialization,
      email: updatedProfile.email,
      phone: updatedProfile.phone,
      licenseNumber: updatedProfile.qualifications, // Mapping qualifications to licenseNumber for now
      hospital: updatedProfile.hospitalName || "City General Hospital",
      // New fields
      photo: updatedProfile.photo,
      gender: updatedProfile.gender,
      birthDate: updatedProfile.birthDate,
      address: updatedProfile.address,
      bio: updatedProfile.bio
    };

    const response = await fetch(`${API_URL}/doctors/${doctorId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      console.error('Failed to sync profile with backend:', await response.text());
    } else {
      console.log('✅ Backend synced successfully');
    }
  } catch (error) {
    console.error('Error syncing with backend:', error);
  }

  console.log('✅ Doctor profile saved:', {
    doctorId,
    name: updatedProfile.name,
    updatedAt: updatedProfile.updatedAt
  });
}

/**
 * Get current doctor ID from localStorage
 */
export function getCurrentDoctorId(): string {
  const profile = localStorage.getItem('profile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.doctorId || 'doc1';
    } catch {
      return 'doc1';
    }
  }
  return 'doc1';
}

/**
 * Get current doctor profile
 */
export function getCurrentDoctorProfile(): DoctorProfile | null {
  const doctorId = getCurrentDoctorId();
  return getDoctorProfile(doctorId);
}
