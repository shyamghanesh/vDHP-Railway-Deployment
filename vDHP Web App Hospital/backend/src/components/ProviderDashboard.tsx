import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Activity, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Heart,
  Stethoscope,
  Bot,
  Plus,
  Pill
} from 'lucide-react';
import { PatientProfile } from './PatientProfile';
import { AIAssistant } from './AIAssistant';
import { AppointmentCreation } from './AppointmentCreation';
import { useNavigate } from 'react-router-dom';
import { getPatients, PatientRecord, deletePatientById } from '@/services/patientService';
import { getDashboardStats, type DashboardStats } from '@/services/dashboardService';
import { ensurePatientInBackend, getAllPatientsFromBackend } from '@/services/patientApiService';

type Patient = PatientRecord;

export const ProviderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [patients, setPatients] = useState<Patient[]>(() => getPatients());

  // Track whether we've already synced patients this session
  const hasSyncedRef = React.useRef(false);

  // Sync all localStorage patients to backend (only once per session)
  const syncAllPatientsToBackend = async () => {
    if (hasSyncedRef.current) return;
    const localPatients = getPatients();
    for (const patient of localPatients) {
      try {
        await ensurePatientInBackend(patient);
      } catch (error) {
        console.warn(`Failed to sync patient ${patient.id} to backend:`, error);
        // Continue syncing other patients even if one fails
      }
    }
    hasSyncedRef.current = true;
  };

  // Load dashboard stats and refresh patients list
  const loadDashboardData = React.useCallback(async () => {
    try {
      // First, sync all localStorage patients to backend to ensure they're all there (once)
      await syncAllPatientsToBackend();
      
      // Fetch dashboard stats from backend (now should have all patients)
      const stats = await getDashboardStats().catch(() => null);
      setDashboardStats(stats);
      
      // Always try to fetch patients from backend first (source of truth)
      try {
        const backendPatients = await getAllPatientsFromBackend();
        if (backendPatients && backendPatients.length > 0) {
          // Convert backend patients to PatientRecord format
          const convertedPatients: PatientRecord[] = backendPatients.map(backendPatient => ({
            id: backendPatient.id,
            name: backendPatient.name,
            age: backendPatient.age,
            condition: backendPatient.condition,
            riskLevel: backendPatient.riskLevel,
            lastVisit: backendPatient.lastVisit,
            location: backendPatient.location,
            vitals: backendPatient.vitals,
            prescriptionCount: backendPatient.prescriptionCount || 0,
            medicalHistory: backendPatient.medicalHistory,
            allergies: backendPatient.allergies,
            currentMedications: backendPatient.currentMedications,
            familyHistory: backendPatient.familyHistory,
            emergencyContact: backendPatient.emergencyContact,
            phone: backendPatient.phone,
            email: backendPatient.email,
            dateOfBirth: backendPatient.dateOfBirth,
            gender: backendPatient.gender,
            maritalStatus: backendPatient.maritalStatus,
            occupation: backendPatient.occupation,
            insuranceProvider: backendPatient.insuranceProvider,
            insuranceNumber: backendPatient.insuranceNumber,
            prescriptionImageDataUrl: (backendPatient as any).prescriptionImageDataUrl,
          }));
          setPatients(convertedPatients);
        } else {
          // Fallback to localStorage if backend returns empty
          const updatedPatients = getPatients();
          setPatients(updatedPatients);
        }
      } catch (backendError) {
        // If backend fails, fallback to localStorage
        console.warn('Failed to fetch patients from backend, using localStorage:', backendError);
        const updatedPatients = getPatients();
        setPatients(updatedPatients);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to localStorage on error
      const updatedPatients = getPatients();
      setPatients(updatedPatients);
    }
  }, []);

  // Refresh patients list and dashboard stats whenever component mounts or location changes
  useEffect(() => {
    loadDashboardData();
    
    // Also refresh when window gains focus (user comes back from another tab/window)
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);
    
    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Auto-refresh every 5 seconds to keep stats in sync
    const interval = setInterval(loadDashboardData, 5000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [location.pathname, location.search, loadDashboardData]); // Refresh when route changes

  // Refresh selected patient data when viewing details
  useEffect(() => {
    if (selectedPatient) {
      const updatedPatients = getPatients();
      const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }
    }
  }, [location.pathname, location.search, selectedPatient?.id]);

  // Listen for patient updates (from storage events or custom events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients') {
        // Patient data was updated, refresh the list
        loadDashboardData();
        // If a patient is selected, refresh that patient too
        if (selectedPatient) {
          const updatedPatients = getPatients();
          const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id);
          if (updatedPatient) {
            setSelectedPatient(updatedPatient);
          }
        }
      }
    };

    const handlePatientUpdate = () => {
      // Patient data was updated in same tab
      loadDashboardData();
      if (selectedPatient) {
        const updatedPatients = getPatients();
        const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id);
        if (updatedPatient) {
          setSelectedPatient(updatedPatient);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('patientUpdated', handlePatientUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener);
    };
  }, [loadDashboardData, selectedPatient]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = patient.name.toLowerCase().includes(searchLower);
    const matchesCondition = patient.condition.toLowerCase().includes(searchLower);
    const matchesMedicalHistory = patient.medicalHistory?.some(condition => 
      condition.toLowerCase().includes(searchLower)
    ) || false;
    return matchesName || matchesCondition || matchesMedicalHistory;
  });

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (selectedPatient) {
    return (
      <PatientProfile 
        patient={selectedPatient} 
        onBack={() => setSelectedPatient(null)}
        onShowAI={() => setShowAIAssistant(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-medical-bg">
      <header className="bg-medical-card border-b border-border shadow-soft">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Profile button moved to left corner */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-medical-primary" />
                    <span>Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Profile</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="block">
                      <p className="text-sm text-medical-muted">Hospital</p>
                      <p className="text-sm text-medical-text font-medium">{JSON.parse(localStorage.getItem('profile') || '{"hospitalName":"City General Hospital","branch":"Downtown Campus"}').hospitalName}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="block">
                      <p className="text-sm text-medical-muted">Branch</p>
                      <p className="text-sm text-medical-text font-medium">{JSON.parse(localStorage.getItem('profile') || '{"hospitalName":"City General Hospital","branch":"Downtown Campus"}').branch}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { localStorage.removeItem('auth_token'); window.location.href = '/login'; }}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="p-2 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-lg shadow-glow">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-medical-text">vDHP Care Compass</h1>
                <p className="text-medical-muted">AI-Powered Patient Care Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setShowAIAssistant(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-medical-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">
                {dashboardStats?.totalPatients ?? patients.length}
              </div>
              <p className="text-xs text-medical-muted">Total registered patients</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Active Cases</CardTitle>
              <Activity className="h-4 w-4 text-medical-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">
                {dashboardStats?.activeCases ?? patients.length}
              </div>
              <p className="text-xs text-medical-muted">Patients under care</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">
                {dashboardStats?.appointmentsToday ?? 0}
              </div>
              <p className="text-xs text-medical-muted">Today's schedule</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">
                {patients.filter(p => p.riskLevel === 'high').length}
              </div>
              <p className="text-xs text-medical-muted">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointment Creation */}
        <div className="mb-8">
          <AppointmentCreation 
            onAppointmentCreated={() => {
              // Refresh dashboard data when appointment is created
              loadDashboardData();
            }} 
          />
        </div>

        {/* Patient Search and List */}
        <Card className="bg-medical-card shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-medical-text">Patient Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => navigate('/add-patient')}
                className="bg-gradient-to-r from-medical-primary to-medical-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-muted w-4 h-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border border-border rounded-lg hover:shadow-soft transition-all cursor-pointer bg-gradient-to-r from-medical-card to-secondary/20"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-role="delete"]')) return;
                    setSelectedPatient(patient);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-medical-text">{patient.name}</h3>
                        <p className="text-sm text-medical-muted">
                          <span className="font-medium text-medical-primary">ID: {patient.id}</span> • Age {patient.age} • {patient.condition}
                        </p>
                        <p className="text-xs text-medical-muted">{patient.location.city}, {patient.location.state}</p>
                        {/* Prescription Count */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Pill className="w-3 h-3" />
                            {patient.prescriptionCount !== undefined ? `${patient.prescriptionCount} Prescription${patient.prescriptionCount !== 1 ? 's' : ''}` : '0 Prescriptions'}
                          </Badge>
                        </div>
                        {/* Medical Conditions */}
                        {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {patient.medicalHistory.map((condition, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-medical-text">
                          HR: {patient.vitals.heartRate} bpm
                        </p>
                        <p className="text-xs text-medical-muted">
                          BP: {patient.vitals.bloodPressure}
                        </p>
                      </div>
                      <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>
                        {patient.riskLevel} risk
                      </Badge>
                      <Button
                        data-role="delete"
                        variant="outline"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = confirm(`Delete ${patient.name}? This cannot be undone.`);
                          if (!ok) return;
                          try {
                            await deletePatientById(patient.id);
                            loadDashboardData(); // Refresh both patients and stats
                          } catch (error) {
                            console.error('Error deleting patient:', error);
                            alert('Failed to delete patient. Please try again.');
                          }
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/add-patient?id=${encodeURIComponent(patient.id)}`);
                        }}
                      >
                        Edit
                      </Button>
                      <TrendingUp className="w-5 h-5 text-medical-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAIAssistant && (
        <AIAssistant onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
};