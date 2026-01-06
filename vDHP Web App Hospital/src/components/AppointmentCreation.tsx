import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createAppointment, type CreateAppointmentDTO } from '@/services/appointmentService';
import { getAllDoctorsFromBackend, type DoctorApiResponse } from '@/services/doctorApiService';
import { getAllPatientsFromBackend, type PatientApiResponse } from '@/services/patientApiService';
import { type PatientRecord } from '@/services/patientService'; // Keep PatientRecord type
import { useToast } from '@/hooks/use-toast';

interface AppointmentCreationProps {
  onAppointmentCreated?: () => void;
}

export const AppointmentCreation: React.FC<AppointmentCreationProps> = ({ onAppointmentCreated }) => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<DoctorApiResponse[]>([]);
  // Use PatientRecord type but we will map backend response to it
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<CreateAppointmentDTO & { date: Date | undefined }>({
    patientId: '',
    doctorId: '',
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
    date: undefined,
  });

  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [patientSearchValue, setPatientSearchValue] = useState('');
  const [doctorSearchValue, setDoctorSearchValue] = useState('');

  // Load doctors and patients
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both doctors and patients from backend
      const [doctorsData, backendPatients] = await Promise.all([
        getAllDoctorsFromBackend().catch(err => {
          console.error("Failed to fetch doctors", err);
          return [];
        }),
        getAllPatientsFromBackend().catch(err => {
          console.error("Failed to fetch patients", err);
          return [];
        }),
      ]);

      setDoctors(doctorsData);

      // Convert backend patient response to PatientRecord format expected by UI
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
        // Optional fields
        medicalHistory: p.medicalHistory,
        email: p.email,
        phone: p.phone
      }));
      setPatients(mappedPatients);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors or patients. Please check if the backend is running.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date,
        scheduledDate: format(date, 'yyyy-MM-dd'),
      });
    }
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

    if (!formData.doctorId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a doctor',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.scheduledDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.scheduledTime) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a time',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for the appointment',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const appointmentData: CreateAppointmentDTO = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        reason: formData.reason,
      };

      await createAppointment(appointmentData);

      toast({
        title: 'Success',
        description: 'Appointment created successfully!',
      });

      // Reset form
      setFormData({
        patientId: '',
        doctorId: '',
        scheduledDate: '',
        scheduledTime: '',
        reason: '',
        date: undefined,
      });
      setPatientSearchValue('');
      setDoctorSearchValue('');
      setShowForm(false);

      // Notify parent component
      if (onAppointmentCreated) {
        onAppointmentCreated();
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getPatientName = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  };

  const getDoctorName = (doctorId: string): string => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : doctorId;
  };

  return (
    <Card className="bg-medical-card shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-medical-text">Create Appointment</CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-medical-primary to-medical-secondary"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'New Appointment'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle>New Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selection */}
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
                    >
                      {formData.patientId
                        ? getPatientName(formData.patientId)
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

              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label htmlFor="doctor-select">Doctor *</Label>
                <Popover open={doctorSearchOpen} onOpenChange={setDoctorSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={doctorSearchOpen}
                      className="w-full justify-between"
                      id="doctor-select"
                      disabled={loading || doctors.length === 0}
                    >
                      {formData.doctorId
                        ? getDoctorName(formData.doctorId)
                        : loading
                          ? "Loading doctors..."
                          : doctors.length === 0
                            ? "No doctors available"
                            : "Search and select doctor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search doctors by name or specialty..."
                        value={doctorSearchValue}
                        onValueChange={setDoctorSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No doctor found.</CommandEmpty>
                        <CommandGroup>
                          {doctors
                            .filter((doctor) => {
                              const searchLower = doctorSearchValue.toLowerCase();
                              return (
                                doctor.name.toLowerCase().includes(searchLower) ||
                                doctor.specialty.toLowerCase().includes(searchLower) ||
                                (doctor.hospital && doctor.hospital.toLowerCase().includes(searchLower))
                              );
                            })
                            .map((doctor) => (
                              <CommandItem
                                key={doctor.id}
                                value={`${doctor.name} ${doctor.specialty} ${doctor.hospital || ''}`}
                                onSelect={() => {
                                  setFormData({ ...formData, doctorId: doctor.id });
                                  setDoctorSearchOpen(false);
                                  setDoctorSearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.doctorId === doctor.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{doctor.name}</span>
                                  <span className="text-xs text-medical-muted">
                                    {doctor.specialty} {doctor.hospital ? `• ${doctor.hospital}` : ''}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {doctors.length === 0 && !loading && (
                  <p className="text-xs text-medical-muted">
                    No doctors available. Please ensure doctors are registered in the system.
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Appointment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Appointment Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  placeholder="HH:MM"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Appointment *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="e.g., Regular checkup, Follow-up, Consultation..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      patientId: '',
                      doctorId: '',
                      scheduledDate: '',
                      scheduledTime: '',
                      reason: '',
                      date: undefined,
                    });
                    setPatientSearchValue('');
                    setDoctorSearchValue('');
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
                      Creating...
                    </>
                  ) : (
                    'Create Appointment'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-medical-primary" />
            <span className="ml-2 text-medical-muted">Loading doctors...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

