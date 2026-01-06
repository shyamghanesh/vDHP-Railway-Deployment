import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, FileText, Download, Trash2, Edit, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getPrescriptionsByDoctor, 
  createPrescription, 
  updatePrescription,
  deletePrescription,
  type Prescription 
} from '@/services/prescriptionService';
import { getPatients, type PatientRecord } from '@/services/patientService';
import { ensurePatientInBackend, getAllPatientsFromBackend, getPatientFromBackend } from '@/services/patientApiService';
import { useToast } from '@/hooks/use-toast';

export const PrescriptionsModule: React.FC = () => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    medicines: [{ name: '', dosage: '', duration: '' }],
    instructions: '',
  });
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchValue, setPatientSearchValue] = useState('');

  // Get doctor ID from localStorage (set during login)
  const getDoctorId = (): string => {
    // For now, use a default doctor ID. In production, get from auth context
    const profile = localStorage.getItem('profile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        return parsed.doctorId || 'doc1'; // Default doctor ID
      } catch {
        return 'doc1';
      }
    }
    return 'doc1'; // Default doctor ID
  };

  // Load prescriptions and patients on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh patient data when form is opened
  useEffect(() => {
    if (showForm) {
      loadPatients();
    }
  }, [showForm]);

  // Refresh selected patient details when patient is selected
  useEffect(() => {
    if (formData.patientId && showForm) {
      refreshSelectedPatient(formData.patientId);
    }
  }, [formData.patientId, showForm]);

  // Listen for storage changes (when patient data is updated in other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'patients' && showForm) {
        // Patient data was updated, refresh the list
        loadPatients();
        // If a patient is selected, refresh that patient too
        if (formData.patientId) {
          refreshSelectedPatient(formData.patientId);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handlePatientUpdate = () => {
      if (showForm) {
        loadPatients();
        if (formData.patientId) {
          refreshSelectedPatient(formData.patientId);
        }
      }
    };

    window.addEventListener('patientUpdated', handlePatientUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener);
    };
  }, [showForm, formData.patientId]);

  const loadPatients = async () => {
    try {
      // Try to get from backend first (most up-to-date)
      try {
        const backendPatients = await getAllPatientsFromBackend();
        if (backendPatients.length > 0) {
          // Convert backend format to PatientRecord format
          const convertedPatients: PatientRecord[] = backendPatients.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            condition: p.condition,
            riskLevel: p.riskLevel,
            lastVisit: p.lastVisit,
            location: p.location,
            vitals: p.vitals,
            prescriptionCount: (p as any).prescriptionCount,
            medicalHistory: p.medicalHistory,
            allergies: p.allergies,
            currentMedications: p.currentMedications,
            familyHistory: p.familyHistory,
            emergencyContact: p.emergencyContact,
            phone: p.phone,
            email: p.email,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            maritalStatus: p.maritalStatus,
            occupation: p.occupation,
            insuranceProvider: p.insuranceProvider,
            insuranceNumber: p.insuranceNumber,
          }));
          setPatients(convertedPatients);
          return;
        }
      } catch (error) {
        console.warn('Could not fetch patients from backend, using localStorage:', error);
      }
      
      // Fallback to localStorage
      const patientsData = getPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      // Fallback to localStorage on error
      const patientsData = getPatients();
      setPatients(patientsData);
    }
  };

  const refreshSelectedPatient = async (patientId?: string) => {
    const idToRefresh = patientId || formData.patientId;
    if (!idToRefresh) return;
    
    try {
      // Try to get latest patient data from backend
      try {
        const backendPatient = await getPatientFromBackend(idToRefresh);
        if (backendPatient) {
          // Update the patient in the patients array
          setPatients(prevPatients => {
            const updated = [...prevPatients];
            const index = updated.findIndex(p => p.id === idToRefresh);
            const convertedPatient: PatientRecord = {
              id: backendPatient.id,
              name: backendPatient.name,
              age: backendPatient.age,
              condition: backendPatient.condition,
              riskLevel: backendPatient.riskLevel,
              lastVisit: backendPatient.lastVisit,
              location: backendPatient.location,
              vitals: backendPatient.vitals,
              prescriptionCount: (backendPatient as any).prescriptionCount,
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
            };
            
            if (index >= 0) {
              updated[index] = convertedPatient;
            } else {
              updated.push(convertedPatient);
            }
            return updated;
          });
          return;
        }
      } catch (error) {
        console.warn('Could not fetch patient from backend, using localStorage:', error);
      }
      
      // Fallback to localStorage
      const patient = getPatients().find(p => p.id === idToRefresh);
      if (patient) {
        setPatients(prevPatients => {
          const updated = [...prevPatients];
          const index = updated.findIndex(p => p.id === idToRefresh);
          if (index >= 0) {
            updated[index] = patient;
          } else {
            updated.push(patient);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error refreshing selected patient:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const doctorId = getDoctorId();
      const [prescriptionsData, patientsData] = await Promise.all([
        getPrescriptionsByDoctor(doctorId).catch(() => []), // Return empty array on error
        Promise.resolve(getPatients()), // Get from localStorage
      ]);
      setPrescriptions(prescriptionsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prescriptions. Please check if the backend is running.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { name: '', dosage: '', duration: '' }],
    });
  };

  const handleRemoveMedicine = (index: number) => {
    if (formData.medicines.length > 1) {
      setFormData({
        ...formData,
        medicines: formData.medicines.filter((_, i) => i !== index),
      });
    }
  };

  const handleEdit = (prescription: Prescription) => {
    // Parse dosage to extract dosage and duration
    const dosageParts = prescription.dosage.split(' • ');
    const dosage = dosageParts[0] || '';
    const duration = dosageParts[1] || '';
    
    setEditingPrescription(prescription);
    setFormData({
      patientId: prescription.patientId,
      medicines: [{ name: prescription.medication, dosage, duration }],
      instructions: prescription.instructions,
    });
    setShowForm(true);
    setPatientSearchValue(patients.find(p => p.id === prescription.patientId)?.name || '');
  };

  const handleCancelEdit = () => {
    setEditingPrescription(null);
    setFormData({
      patientId: '',
      medicines: [{ name: '', dosage: '', duration: '' }],
      instructions: '',
    });
    setPatientSearchOpen(false);
    setPatientSearchValue('');
    setShowForm(false);
  };

  const handleSave = async () => {
    // Validate form
    if (!formData.patientId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (formData.medicines.length === 0 || formData.medicines.some(m => !m.name || !m.dosage)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in at least one medicine with name and dosage',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.instructions.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide instructions',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const doctorId = getDoctorId();
      
      // If editing, update the prescription
      if (editingPrescription) {
        const medicine = formData.medicines[0];
        try {
          const updateData = {
            medication: medicine.name,
            dosage: `${medicine.dosage}${medicine.duration ? ` • ${medicine.duration}` : ''}`,
            instructions: formData.instructions,
          };

          await updatePrescription(editingPrescription.id, updateData);
          toast({
            title: 'Success',
            description: 'Prescription updated successfully!',
          });
          
          // Reset form and reload data
          handleCancelEdit();
          await loadData();
          setSaving(false);
          return;
        } catch (error: any) {
          console.error('Error updating prescription:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to update prescription. Please try again.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }
      
      // Ensure patient exists in backend before creating prescription
      const selectedPatient = patients.find(p => p.id === formData.patientId);
      if (!selectedPatient) {
        toast({
          title: 'Error',
          description: 'Selected patient not found. Please select a valid patient.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      let backendPatientId = formData.patientId;
      try {
        // Try to ensure patient exists in backend (will create if doesn't exist)
        backendPatientId = await ensurePatientInBackend(selectedPatient);
        console.log('Patient synced to backend successfully:', backendPatientId);
      } catch (error: any) {
        console.error('Error syncing patient to backend:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        });
        const errorMessage = error?.message || 'Unknown error occurred';
        toast({
          title: 'Error',
          description: `Cannot create prescription: Patient cannot be synced to backend. ${errorMessage}. Please check the browser console for more details.`,
          variant: 'destructive',
        });
        setSaving(false);
        return; // Stop here - don't try to create prescription if patient sync failed
      }

      let successCount = 0;
      let errorCount = 0;

      // Create one prescription per medicine
      const errors: string[] = [];
      for (const medicine of formData.medicines) {
        if (medicine.name && medicine.dosage) {
          try {
            const prescriptionData = {
              patientId: backendPatientId,
              doctorId: doctorId,
              medication: medicine.name,
              dosage: `${medicine.dosage}${medicine.duration ? ` • ${medicine.duration}` : ''}`,
              instructions: formData.instructions,
            };

            console.log('[Doctor Portal] Creating prescription with data:', prescriptionData);
            console.log('[Doctor Portal] Using backend patient ID:', backendPatientId);
            console.log('[Doctor Portal] Original frontend patient ID:', formData.patientId);
            
            const createdPrescription = await createPrescription(prescriptionData);
            console.log('[Doctor Portal] Prescription created successfully:', createdPrescription);
            console.log('[Doctor Portal] Prescription patient ID:', createdPrescription.patientId);
            successCount++;
          } catch (error: any) {
            console.error('Error creating prescription for medicine:', medicine.name, error);
            const errorMsg = error?.message || 'Unknown error';
            errors.push(`${medicine.name}: ${errorMsg}`);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Successfully created ${successCount} prescription${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
        });
      } else {
        // Show detailed error message
        const errorMessage = errors.length > 0 
          ? errors[0] // Show first error
          : 'Failed to create prescriptions. Please check if the backend is running and the patient exists in the system.';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }
      
      // Reset form and reload data
      handleCancelEdit();
      // Add a small delay to ensure backend has processed the creation
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadData();
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create prescription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) {
      return;
    }

    try {
      await deletePrescription(prescriptionId);
      toast({
        title: 'Success',
        description: 'Prescription deleted successfully!',
      });
      await loadData();
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete prescription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPatientName = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-medical-text">Prescriptions</CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-medical-primary to-medical-secondary"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingPrescription ? 'Edit Prescription' : 'Create New Prescription'}</CardTitle>
                  {editingPrescription && (
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-select">Patient *</Label>
                  <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={patientSearchOpen}
                        className="w-full justify-between"
                        id="patient-select"
                        disabled={!!editingPrescription}
                      >
                        {formData.patientId
                          ? patients.find((patient) => patient.id === formData.patientId)?.name || formData.patientId
                          : "Search and select patient..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search patients by name or ID..." 
                          value={patientSearchValue}
                          onValueChange={setPatientSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>No patient found.</CommandEmpty>
                          <CommandGroup>
                            {patients
                              .filter((patient) => {
                                const searchLower = patientSearchValue.toLowerCase();
                                return (
                                  patient.name.toLowerCase().includes(searchLower) ||
                                  patient.id.toLowerCase().includes(searchLower) ||
                                  patient.condition.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={`${patient.name} ${patient.id} ${patient.condition}`}
                                  onSelect={() => {
                                    setFormData({ ...formData, patientId: patient.id });
                                    setPatientSearchOpen(false);
                                    setPatientSearchValue('');
                                    // Refresh patient data immediately after selection
                                    refreshSelectedPatient(patient.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.patientId === patient.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{patient.name}</span>
                                    <span className="text-xs text-medical-muted">
                                      {patient.id} • {patient.condition}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Medicines *</Label>
                  {formData.medicines.map((medicine, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Medicine Name</Label>
                        <Input
                          placeholder="e.g., Paracetamol"
                          value={medicine.name}
                          onChange={(e) => {
                            const newMedicines = [...formData.medicines];
                            newMedicines[index].name = e.target.value;
                            setFormData({ ...formData, medicines: newMedicines });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage</Label>
                        <Input
                          placeholder="e.g., 500mg"
                          value={medicine.dosage}
                          onChange={(e) => {
                            const newMedicines = [...formData.medicines];
                            newMedicines[index].dosage = e.target.value;
                            setFormData({ ...formData, medicines: newMedicines });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Duration</Label>
                        <Input
                          placeholder="e.g., 5 days"
                          value={medicine.duration}
                          onChange={(e) => {
                            const newMedicines = [...formData.medicines];
                            newMedicines[index].duration = e.target.value;
                            setFormData({ ...formData, medicines: newMedicines });
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        {formData.medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMedicine(index)}
                            className="flex-1"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleAddMedicine}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions *</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    placeholder="e.g., Take after meals. Complete the full course."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        patientId: '',
                        medicines: [{ name: '', dosage: '', duration: '' }],
                        instructions: '',
                      });
                      setPatientSearchOpen(false);
                      setPatientSearchValue('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    className="bg-gradient-to-r from-medical-primary to-medical-secondary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingPrescription ? 'Update Prescription' : 'Save Prescription'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-medical-primary" />
              <span className="ml-2 text-medical-muted">Loading prescriptions...</span>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-medical-muted">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No prescriptions found. Create your first prescription above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{getPatientName(prescription.patientId)}</CardTitle>
                        <p className="text-sm text-medical-muted">
                          ID: {prescription.patientId} • Created: {new Date(prescription.createdAt).toLocaleDateString()}
                          {prescription.updatedAt && prescription.updatedAt !== prescription.createdAt && (
                            <span> • Updated: {new Date(prescription.updatedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(prescription)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(prescription.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-secondary rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{prescription.medication}</span>
                          <span className="text-sm text-medical-muted">{prescription.dosage}</span>
                        </div>
                        {prescription.startDate && prescription.endDate && (
                          <p className="text-xs text-medical-muted mt-1">
                            {new Date(prescription.startDate).toLocaleDateString()} - {new Date(prescription.endDate).toLocaleDateString()}
                          </p>
                        )}
                        {prescription.refills !== undefined && prescription.refills > 0 && (
                          <p className="text-xs text-medical-muted mt-1">
                            Refills: {prescription.refills}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-medical-muted">
                        <strong>Instructions:</strong> {prescription.instructions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

