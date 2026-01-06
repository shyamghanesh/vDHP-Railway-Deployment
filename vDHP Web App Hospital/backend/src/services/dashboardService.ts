/**
 * Dashboard Service
 * Handles API calls for dashboard statistics
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface DashboardStats {
  totalPatients: number;
  activeCases: number;
  appointmentsToday: number;
  highRiskPatients: number;
  totalDoctors: number;
  totalAppointments: number;
}

/**
 * Get dashboard statistics from the backend
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/providers/dashboard/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

