import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '@/services/dashboardService';
import { getDoctorAppointments, type Appointment } from '@/services/appointmentService';
import { getPatients, type PatientRecord } from '@/services/patientService';
import { getPrescriptionsByDoctor } from '@/services/prescriptionService';
import { getAllPatientsFromBackend, ensurePatientInBackend } from '@/services/patientApiService';

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMessages, setPendingMessages] = useState(0); // Placeholder - no backend endpoint yet
  const [newReports, setNewReports] = useState(0); // Placeholder - using medical records count

  // Get doctor ID from localStorage
  const getDoctorId = (): string => {
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
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const doctorId = getDoctorId();
      const today = new Date().toISOString().split('T')[0];

      // First, sync all localStorage patients to backend to ensure they're all there
      const localPatients = getPatients();
      for (const patient of localPatients) {
        try {
          await ensurePatientInBackend(patient);
        } catch (error) {
          console.warn(`Failed to sync patient ${patient.id} to backend:`, error);
          // Continue syncing other patients even if one fails
        }
      }

      // Fetch all data in parallel
      const [dashboardStats, appointments, backendPatients, prescriptions] = await Promise.all([
        getDashboardStats().catch(() => null),
        getDoctorAppointments(doctorId).catch(() => []),
        getAllPatientsFromBackend().catch(() => []),
        getPrescriptionsByDoctor(doctorId).catch(() => []),
      ]);

      setStats(dashboardStats);

      // Map backend patients to PatientRecord format
      const mappedPatients: PatientRecord[] = backendPatients.map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        condition: p.condition,
        riskLevel: p.riskLevel,
        lastVisit: p.lastVisit,
        location: p.location,
        vitals: p.vitals,
        prescriptionCount: p.prescriptionCount,
        medicalHistory: p.medicalHistory,
        email: p.email,
        phone: p.phone
      }));
      setPatients(mappedPatients);

      // Filter upcoming appointments (today and future)
      const upcoming = appointments
        .filter(apt => apt.scheduledDate >= today)
        .sort((a, b) => {
          const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
          if (dateCompare !== 0) return dateCompare;
          return a.scheduledTime.localeCompare(b.scheduledTime);
        })
        .slice(0, 5); // Show only next 5
      setUpcomingAppointments(upcoming);

      // Create recent activities from prescriptions and appointments
      const activities: any[] = [];

      // Add recent prescriptions
      prescriptions.slice(0, 3).forEach(prescription => {
        const patient = mappedPatients.find(p => p.id === prescription.patientId);
        const createdAt = new Date(prescription.createdAt);
        const timeAgo = getTimeAgo(createdAt);
        activities.push({
          type: 'prescription',
          patient: patient?.name || prescription.patientId,
          time: timeAgo,
          date: createdAt,
        });
      });

      // Add recent appointments
      appointments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach(appointment => {
          const patient = mappedPatients.find(p => p.id === appointment.patientId);
          const createdAt = new Date(appointment.createdAt);
          const timeAgo = getTimeAgo(createdAt);
          activities.push({
            type: 'appointment',
            patient: patient?.name || appointment.patientId,
            time: timeAgo,
            date: createdAt,
          });
        });

      // Sort by date and take most recent
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivities(activities.slice(0, 5));

      // Set new reports count (using medical records - placeholder)
      // In the future, this should come from a dedicated reports endpoint
      setNewReports(0); // Placeholder until reports endpoint is created
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 seconds to keep stats in sync
    const interval = setInterval(loadDashboardData, 5000);

    // Refresh when window gains focus
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for patient updates (from storage events or custom events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients') {
        // Patient data was updated, refresh the dashboard
        loadDashboardData();
      }
    };

    const handlePatientUpdate = () => {
      // Patient data was updated in same tab
      loadDashboardData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('patientUpdated', handlePatientUpdate as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener);
    };
  }, []);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getPatientName = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  };

  const formatTime = (time: string): string => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-medical-primary" />
        <span className="ml-3 text-medical-muted">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-medical-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">
              {stats?.activeCases ?? 0}
            </div>
            <p className="text-xs text-medical-muted mt-1">Patients under care</p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-medical-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">
              {stats?.appointmentsToday ?? 0}
            </div>
            <p className="text-xs text-medical-muted mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Pending Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">{pendingMessages}</div>
            <p className="text-xs text-medical-muted mt-1">Unread messages</p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">New Reports</CardTitle>
            <FileText className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">{newReports}</div>
            <p className="text-xs text-medical-muted mt-1">Reports to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-medical-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-medical-text">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-medical-muted text-center py-4">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-medical-primary" />
                      <div>
                        <p className="font-medium text-medical-text">{getPatientName(appointment.patientId)}</p>
                        <p className="text-sm text-medical-muted">
                          {new Date(appointment.scheduledDate).toLocaleDateString()} at {formatTime(appointment.scheduledTime)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {appointment.scheduledDate === new Date().toISOString().split('T')[0] ? 'Today' : 'Upcoming'}
                    </Badge>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full">View All Appointments</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-medical-text">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-medical-muted text-center py-4">No recent activity</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    {activity.type === 'prescription' && <FileText className="w-5 h-5 text-medical-primary" />}
                    {activity.type === 'report' && <FileText className="w-5 h-5 text-medical-secondary" />}
                    {activity.type === 'appointment' && <Calendar className="w-5 h-5 text-warning" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-medical-text">
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} for {activity.patient}
                      </p>
                      <p className="text-xs text-medical-muted">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center space-y-2 h-auto py-4">
              <Calendar className="w-6 h-6" />
              <span>New Appointment</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center space-y-2 h-auto py-4">
              <FileText className="w-6 h-6" />
              <span>Add Prescription</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center space-y-2 h-auto py-4">
              <MessageSquare className="w-6 h-6" />
              <span>Send Message</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center space-y-2 h-auto py-4">
              <FileText className="w-6 h-6" />
              <span>Upload Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
