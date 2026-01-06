import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Bot,
  Calendar,
  FileText,
  Pill,
  Loader2
} from 'lucide-react';
import { VitalsChart } from './VitalsChart';
import { AIAssistant } from './AIAssistant';
import { getPrescriptionsByPatient, type Prescription } from '@/services/prescriptionService';
import { API_ENDPOINT } from '@/config';

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastVisit: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
}

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onShowAI: () => void;
}

const mockVitalsHistory = [
  { date: '2024-01-15', heartRate: 78, systolic: 140, diastolic: 90, temperature: 98.6, oxygenSat: 98 },
  { date: '2024-01-14', heartRate: 80, systolic: 138, diastolic: 88, temperature: 98.4, oxygenSat: 97 },
  { date: '2024-01-13', heartRate: 76, systolic: 142, diastolic: 92, temperature: 98.8, oxygenSat: 98 },
  { date: '2024-01-12', heartRate: 82, systolic: 145, diastolic: 95, temperature: 98.2, oxygenSat: 96 },
  { date: '2024-01-11', heartRate: 79, systolic: 139, diastolic: 89, temperature: 98.5, oxygenSat: 99 },
];

const mockCalorieLogs = [
  { date: '2024-01-15', calories: 1850, protein: 65, carbs: 180, fat: 70 },
  { date: '2024-01-14', calories: 2100, protein: 78, carbs: 220, fat: 85 },
  { date: '2024-01-13', calories: 1950, protein: 72, carbs: 195, fat: 75 },
  { date: '2024-01-12', calories: 2250, protein: 82, carbs: 240, fat: 95 },
  { date: '2024-01-11', calories: 1800, protein: 68, carbs: 175, fat: 65 },
];

export const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onBack, onShowAI }) => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [backendPatientId, setBackendPatientId] = useState<string | null>(null);

  // Ensure patient exists in backend and get the backend patient ID
  useEffect(() => {
    const syncPatientToBackend = async () => {
      try {
        console.log('[Provider Portal] Syncing patient to backend:', patient.id);
        console.log('[Provider Portal] Patient data:', {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          condition: patient.condition
        });
        const { ensurePatientInBackend } = await import('@/services/patientApiService');
        const backendId = await ensurePatientInBackend(patient);
        console.log('[Provider Portal] Patient synced to backend, backend ID:', backendId);
        console.log('[Provider Portal] Frontend ID vs Backend ID:', {
          frontend: patient.id,
          backend: backendId,
          match: patient.id === backendId
        });
        setBackendPatientId(backendId);

        // Also fetch debug info to see all prescriptions
        try {
          const debugResponse = await fetch(`${API_ENDPOINT}/providers/debug/prescriptions`);
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('[Provider Portal] Debug - All prescriptions:', debugData);
            console.log('[Provider Portal] Debug - Patient IDs in system:', debugData.patient_ids);
            console.log('[Provider Portal] Debug - Prescription patient IDs:', debugData.prescription_patient_ids);
          }
        } catch (e) {
          console.warn('[Provider Portal] Could not fetch debug info:', e);
        }
      } catch (error) {
        console.error('[Provider Portal] Error syncing patient to backend:', error);
        // If sync fails, try using the frontend ID anyway
        setBackendPatientId(patient.id);
      }
    };

    syncPatientToBackend();
  }, [patient]);

  // Load prescriptions when patient profile is shown
  useEffect(() => {
    if (!backendPatientId) return; // Wait for backend patient ID

    const loadPrescriptions = async () => {
      setLoadingPrescriptions(true);
      try {
        console.log('[Provider Portal] Loading prescriptions for patient:', backendPatientId);
        console.log('[Provider Portal] Frontend patient ID:', patient.id);
        console.log('[Provider Portal] Backend patient ID:', backendPatientId);

        // Try both the backend patient ID and the frontend patient ID
        // This handles cases where prescriptions might have been created with either ID
        let data = await getPrescriptionsByPatient(backendPatientId);

        // If no prescriptions found with backend ID, try frontend ID (in case of mismatch)
        if (data.length === 0 && patient.id !== backendPatientId) {
          console.log('[Provider Portal] No prescriptions found with backend ID, trying frontend ID:', patient.id);
          try {
            const frontendData = await getPrescriptionsByPatient(patient.id);
            if (frontendData.length > 0) {
              console.log('[Provider Portal] Found prescriptions with frontend ID:', frontendData.length);
              data = frontendData;
            }
          } catch (e) {
            console.log('[Provider Portal] No prescriptions found with frontend ID either');
          }
        }

        console.log(`[Provider Portal] Loaded ${data.length} prescriptions for patient ${backendPatientId}:`, data);
        if (data.length > 0) {
          console.log('[Provider Portal] Prescription patient IDs:', data.map(p => p.patientId));
        }
        setPrescriptions(data);
      } catch (error) {
        console.error('Error loading prescriptions:', error);
        setPrescriptions([]); // Set empty array on error
      } finally {
        setLoadingPrescriptions(false);
      }
    };

    loadPrescriptions();

    // Refresh prescriptions more frequently (every 2 seconds) to catch updates quickly
    const interval = setInterval(loadPrescriptions, 2000);

    // Also refresh when window gains focus (user comes back from another tab/window)
    const handleFocus = () => {
      console.log('Window focused, refreshing prescriptions');
      loadPrescriptions();
    };
    window.addEventListener('focus', handleFocus);

    // Also refresh when the tab becomes visible (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab visible, refreshing prescriptions');
        loadPrescriptions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [backendPatientId, patient.id]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-medical-muted';
    }
  };

  const getVitalTrend = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-success" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-medical-bg">
      <header className="bg-medical-card border-b border-border shadow-soft">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-medical-text">{patient.name}</h1>
                  <p className="text-medical-muted">
                    <span className="font-medium text-medical-primary">ID: {patient.id}</span> • Age {patient.age} • {patient.condition}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={patient.riskLevel === 'high' ? 'destructive' : patient.riskLevel === 'medium' ? 'default' : 'secondary'} className="text-sm">
                {patient.riskLevel} risk
              </Badge>
              <Button onClick={() => setShowAIAssistant(true)} className="bg-gradient-to-r from-medical-primary to-medical-secondary">
                <Bot className="w-4 h-4 mr-2" />
                AI Insights
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Current Vitals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Heart Rate</CardTitle>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4 text-red-500" />
                {getVitalTrend(patient.vitals.heartRate, mockVitalsHistory[1]?.heartRate || 0)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">{patient.vitals.heartRate}</div>
              <p className="text-xs text-medical-muted">bpm</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Blood Pressure</CardTitle>
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4 text-medical-primary" />
                {getVitalTrend(140, mockVitalsHistory[1]?.systolic || 0)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">{patient.vitals.bloodPressure}</div>
              <p className="text-xs text-medical-muted">mmHg</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Temperature</CardTitle>
              <div className="flex items-center space-x-1">
                <Thermometer className="h-4 w-4 text-orange-500" />
                {getVitalTrend(patient.vitals.temperature, mockVitalsHistory[1]?.temperature || 0)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">{patient.vitals.temperature}</div>
              <p className="text-xs text-medical-muted">°F</p>
            </CardContent>
          </Card>

          <Card className="bg-medical-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-muted">Oxygen Sat</CardTitle>
              <div className="flex items-center space-x-1">
                <Droplets className="h-4 w-4 text-blue-500" />
                {getVitalTrend(patient.vitals.oxygenSat, mockVitalsHistory[1]?.oxygenSat || 0)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text">{patient.vitals.oxygenSat}</div>
              <p className="text-xs text-medical-muted">%</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="vitals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="care-plan">Care Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="vitals">
            <Card className="bg-medical-card shadow-elevated">
              <CardHeader>
                <CardTitle className="text-medical-text">Vital Signs Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <VitalsChart data={mockVitalsHistory} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card className="bg-medical-card shadow-elevated">
              <CardHeader>
                <CardTitle className="text-medical-text flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPrescriptions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-medical-primary" />
                    <span className="ml-2 text-medical-muted">Loading prescriptions...</span>
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="text-center py-8 text-medical-muted">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No prescriptions found for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="p-4 border border-border rounded-lg hover:shadow-soft transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Pill className="w-4 h-4 text-medical-primary" />
                              <h4 className="font-semibold text-medical-text text-lg">{prescription.medication}</h4>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-medical-muted">Dosage: </span>
                                <span className="font-medium text-medical-text">{prescription.dosage}</span>
                              </div>
                              {prescription.instructions && (
                                <div>
                                  <span className="text-medical-muted">Instructions: </span>
                                  <span className="text-medical-text">{prescription.instructions}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-medical-muted">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  Prescribed: {new Date(prescription.createdAt).toLocaleDateString()}
                                  {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
                                    <span className="ml-2 text-medical-primary">
                                      • Updated: {new Date(prescription.updatedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition">
            <Card className="bg-medical-card shadow-elevated">
              <CardHeader>
                <CardTitle className="text-medical-text">Nutrition & Calorie Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCalorieLogs.map((log, index) => (
                    <div key={log.date} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-medical-text">{new Date(log.date).toLocaleDateString()}</h4>
                        <span className="text-2xl font-bold text-medical-primary">{log.calories} cal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-medical-muted">Protein:</span>
                          <span className="ml-2 font-medium text-medical-text">{log.protein}g</span>
                        </div>
                        <div>
                          <span className="text-medical-muted">Carbs:</span>
                          <span className="ml-2 font-medium text-medical-text">{log.carbs}g</span>
                        </div>
                        <div>
                          <span className="text-medical-muted">Fat:</span>
                          <span className="ml-2 font-medium text-medical-text">{log.fat}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-medical-card shadow-elevated">
              <CardHeader>
                <CardTitle className="text-medical-text">Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-medical-primary mt-1" />
                      <div>
                        <h4 className="font-semibold text-medical-text">Hypertension Diagnosis</h4>
                        <p className="text-sm text-medical-muted mb-2">March 15, 2023</p>
                        <p className="text-sm text-medical-text">Initial diagnosis following elevated blood pressure readings over several visits. Started on ACE inhibitor therapy.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-medical-secondary mt-1" />
                      <div>
                        <h4 className="font-semibold text-medical-text">Medication Review</h4>
                        <p className="text-sm text-medical-muted mb-2">December 10, 2023</p>
                        <p className="text-sm text-medical-text">Current medications: Lisinopril 10mg daily, Hydrochlorothiazide 25mg daily. Patient reports good adherence.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="care-plan">
            <Card className="bg-medical-card shadow-elevated">
              <CardHeader>
                <CardTitle className="text-medical-text">Current Care Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-medical-primary/10 to-medical-secondary/10 rounded-lg border border-medical-primary/20">
                    <h4 className="font-semibold text-medical-text mb-2">AI Recommendations</h4>
                    <ul className="space-y-2 text-sm text-medical-text">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-medical-primary rounded-full mt-2"></div>
                        <span>Blood pressure shows concerning upward trend - consider medication adjustment</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-medical-secondary rounded-full mt-2"></div>
                        <span>Recommend increased dietary monitoring and sodium restriction counseling</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                        <span>Schedule follow-up appointment within 2 weeks for BP reassessment</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h5 className="font-semibold text-medical-text mb-3">Next Actions</h5>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-medical-text">Schedule cardiology consult</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-medical-text">Order comprehensive metabolic panel</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-medical-text">Provide dietary counseling materials</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h5 className="font-semibold text-medical-text mb-3">Patient Goals</h5>
                      <ul className="space-y-2 text-sm text-medical-text">
                        <li>• Target BP: &lt;130/80 mmHg</li>
                        <li>• Daily sodium: &lt;2300mg</li>
                        <li>• Exercise: 150min/week</li>
                        <li>• Weight loss: 5-10 lbs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showAIAssistant && (
        <AIAssistant
          onClose={() => setShowAIAssistant(false)}
          patient={patient}
        />
      )}
    </div>
  );
};