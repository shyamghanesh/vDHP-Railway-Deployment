import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, FileText, Calendar, Phone, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPatients, PatientRecord, getPatientById } from '@/services/patientService';
import { getAllPatientsFromBackend } from '@/services/patientApiService';

export const PatientManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>(() => getPatients());
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Refresh patients list whenever component mounts or location changes (e.g., after adding/editing)
  useEffect(() => {
    const refreshPatients = async () => {
      // Try to fetch from backend first (source of truth)
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
    };
    
    refreshPatients();
    
    // Also refresh when window gains focus (user comes back from another tab/window)
    const handleFocus = () => refreshPatients();
    window.addEventListener('focus', handleFocus);

    // Listen for patient updates (from storage events or custom events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients') {
        // Patient data was updated, refresh the list
        refreshPatients();
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
      refreshPatients();
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
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener);
    };
  }, [location.pathname, location.search, selectedPatient]); // Refresh when route changes

  // Refresh selected patient data when viewing details
  useEffect(() => {
    if (selectedPatient) {
      const refreshSelectedPatient = async () => {
        try {
          const { getPatientFromBackend } = await import('@/services/patientApiService');
          const backendPatient = await getPatientFromBackend(selectedPatient.id);
          if (backendPatient) {
            const updatedPatient: PatientRecord = {
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
            };
            setSelectedPatient(updatedPatient);
            return;
          }
        } catch (error) {
          console.warn('Failed to fetch selected patient from backend, using localStorage:', error);
        }
        // Fallback to localStorage
        const updatedPatient = getPatientById(selectedPatient.id);
        if (updatedPatient) {
          setSelectedPatient(updatedPatient);
        }
      };
      refreshSelectedPatient();
    }
  }, [location.pathname, location.search, selectedPatient?.id]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = patient.name.toLowerCase().includes(searchLower);
    const matchesCondition = patient.condition.toLowerCase().includes(searchLower);
    const matchesId = patient.id.toLowerCase().includes(searchLower);
    const matchesMedicalHistory = patient.medicalHistory?.some(condition => 
      condition.toLowerCase().includes(searchLower)
    ) || false;
    return matchesName || matchesCondition || matchesId || matchesMedicalHistory;
  });

  if (selectedPatient) {
    // Get the latest patient data when viewing details
    const currentPatient = getPatientById(selectedPatient.id) || selectedPatient;
    
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedPatient(null);
            // Refresh the list when going back
            setPatients(getPatients());
          }}
        >
          ← Back to Patients
        </Button>
        <Card className="bg-medical-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-medical-text">Patient Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-medical-text">{currentPatient.name}</h3>
                <p className="text-medical-muted">ID: {currentPatient.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-medical-muted">Age</p>
                  <p className="font-medium">{currentPatient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-medical-muted">Condition</p>
                  <p className="font-medium">{currentPatient.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-medical-muted">Risk Level</p>
                  <Badge>{currentPatient.riskLevel}</Badge>
                </div>
                <div>
                  <p className="text-sm text-medical-muted">Location</p>
                  <p className="font-medium">{currentPatient.location.city}, {currentPatient.location.state}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Vitals</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-medical-muted">Heart Rate</p>
                    <p className="font-medium">{currentPatient.vitals.heartRate} bpm</p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-muted">Blood Pressure</p>
                    <p className="font-medium">{currentPatient.vitals.bloodPressure}</p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-muted">Temperature</p>
                    <p className="font-medium">{currentPatient.vitals.temperature}°F</p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-muted">Oxygen Saturation</p>
                    <p className="font-medium">{currentPatient.vitals.oxygenSat}%</p>
                  </div>
                </div>
              </div>
              
              {/* Medical History Section */}
              {(currentPatient.medicalHistory && currentPatient.medicalHistory.length > 0) ||
               currentPatient.allergies ||
               currentPatient.currentMedications ||
               currentPatient.familyHistory ? (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 text-medical-text">Medical History</h4>
                  <div className="space-y-3">
                    {currentPatient.medicalHistory && currentPatient.medicalHistory.length > 0 && (
                      <div>
                        <p className="text-sm text-medical-muted mb-1">Conditions</p>
                        <div className="flex flex-wrap gap-2">
                          {currentPatient.medicalHistory.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentPatient.allergies && (
                      <div>
                        <p className="text-sm text-medical-muted mb-1">Allergies</p>
                        <p className="font-medium text-sm">{currentPatient.allergies}</p>
                      </div>
                    )}
                    
                    {currentPatient.currentMedications && (
                      <div>
                        <p className="text-sm text-medical-muted mb-1">Current Medications</p>
                        <p className="font-medium text-sm">{currentPatient.currentMedications}</p>
                      </div>
                    )}
                    
                    {currentPatient.familyHistory && (
                      <div>
                        <p className="text-sm text-medical-muted mb-1">Family Medical History</p>
                        <p className="font-medium text-sm">{currentPatient.familyHistory}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              
              {/* Additional Information */}
              {(currentPatient.phone || currentPatient.email || currentPatient.emergencyContact) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 text-medical-text">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {currentPatient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-medical-muted" />
                        <p className="text-sm">{currentPatient.phone}</p>
                      </div>
                    )}
                    {currentPatient.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-medical-muted" />
                        <p className="text-sm">{currentPatient.email}</p>
                      </div>
                    )}
                    {currentPatient.emergencyContact && (
                      <div className="col-span-2">
                        <p className="text-sm text-medical-muted mb-1">Emergency Contact</p>
                        <p className="font-medium text-sm">
                          {currentPatient.emergencyContact.name} ({currentPatient.emergencyContact.relationship})
                        </p>
                        <p className="text-xs text-medical-muted">{currentPatient.emergencyContact.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-medical-text">Patient Management</CardTitle>
            <Button 
              className="bg-gradient-to-r from-medical-primary to-medical-secondary"
              onClick={() => navigate('/add-patient')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-muted w-4 h-4" />
            <Input
              placeholder="Search by name, ID, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 border border-border rounded-lg hover:shadow-soft transition-all cursor-pointer"
                onClick={() => {
                  // Get fresh patient data when selecting
                  const freshPatient = getPatientById(patient.id);
                  setSelectedPatient(freshPatient || patient);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-medical-text">{patient.name}</h3>
                      <p className="text-sm text-medical-muted">ID: {patient.id} • Age: {patient.age}</p>
                      <p className="text-sm text-medical-muted">{patient.condition}</p>
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
                    <Badge variant={patient.riskLevel === 'high' ? 'destructive' : 'default'}>
                      {patient.riskLevel} risk
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

