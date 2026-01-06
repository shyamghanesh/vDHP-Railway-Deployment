import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  FileText,
  Heart,
  Stethoscope,
  Save,
  Plus
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { addPatient, getPatientById, updatePatient, type PatientRecord } from '@/services/patientService';
import { ensurePatientInBackend, getPatientFromBackend } from '@/services/patientApiService';
import { API_BASE_URL } from '@/config';

interface PatientFormData {
  // Basic Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;

  // Location Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Medical History
  medicalHistory: string[];
  allergies: string;
  currentMedications: string;
  familyHistory: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Additional Demographics
  maritalStatus: string;
  occupation: string;
  insuranceProvider: string;
  insuranceNumber: string;

  // Vitals
  heartRate: string;
  systolic: string;
  diastolic: string;
  temperature: string;
  oxygenSat: string;
}

const medicalConditions = [
  'Hypertension',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Heart Disease',
  'Asthma',
  'COPD',
  'Arthritis',
  'Depression',
  'Anxiety',
  'High Cholesterol',
  'Obesity',
  'Cancer',
  'Stroke',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorders',
  'Epilepsy',
  'Migraine',
  'Other'
];

const AddPatient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('id');
  const isEditing = Boolean(editingId);
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    medicalHistory: [],
    allergies: '',
    currentMedications: '',
    familyHistory: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    maritalStatus: '',
    occupation: '',
    insuranceProvider: '',
    insuranceNumber: '',
    heartRate: '',
    systolic: '',
    diastolic: '',
    temperature: '',
    oxygenSat: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Prefill when editing - ALWAYS fetch from backend first (source of truth) to get latest data
  React.useEffect(() => {
    if (!editingId) return;

    const loadPatientData = async () => {
      let patient: any = null;

      // ALWAYS try to fetch from backend first (source of truth) - this ensures we get latest updates
      // This is critical: when editing in provider portal after doctor portal updates,
      // we MUST fetch from backend to get the latest data
      try {
        console.log('🔄 Fetching latest patient data from backend for editing:', editingId);
        patient = await getPatientFromBackend(editingId);
        if (patient) {
          console.log('✅ Loaded latest patient data from backend for editing:', {
            id: patient.id,
            name: patient.name,
            condition: patient.condition,
            lastVisit: patient.lastVisit
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch patient from backend, trying localStorage:', error);
      }

      // Fallback to localStorage if backend fetch failed
      if (!patient) {
        patient = getPatientById(editingId);
        if (patient) {
          console.log('⚠️ Loaded patient from localStorage for editing (backend unavailable):', patient);
        }
      }

      if (!patient) {
        console.error('Patient not found:', editingId);
        alert('Patient not found. Redirecting to patient list...');
        navigate('/');
        return;
      }

      // Parse blood pressure
      const [sys, dia] = (patient.vitals?.bloodPressure || '120/80').split('/')
        .map((v: string) => v.trim());

      // Split name into first and last
      const nameParts = (patient.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.location?.address || '',
        city: patient.location?.city || '',
        state: patient.location?.state || '',
        zipCode: patient.location?.zipCode || '',
        country: patient.location?.country || 'United States',
        medicalHistory: patient.medicalHistory && patient.medicalHistory.length > 0
          ? patient.medicalHistory
          : (patient.condition ? [patient.condition] : []),
        allergies: patient.allergies || '',
        currentMedications: patient.currentMedications || '',
        familyHistory: patient.familyHistory || '',
        emergencyContact: patient.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        maritalStatus: patient.maritalStatus || '',
        occupation: patient.occupation || '',
        insuranceProvider: patient.insuranceProvider || '',
        insuranceNumber: patient.insuranceNumber || '',
        heartRate: String(patient.vitals?.heartRate || ''),
        systolic: sys || '',
        diastolic: dia || '',
        temperature: String(patient.vitals?.temperature || ''),
        oxygenSat: String(patient.vitals?.oxygenSat || ''),
      }));
    };

    loadPatientData();
  }, [editingId, navigate, location.pathname, location.search]);

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };


  const isAllFilled = () => {
    const numeric = (v: string) => /^\d+(\.\d+)?$/.test(v);
    const notEmpty = (v: string) => v.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (isEditing) {
      // Minimal requirements when editing: name + vital numbers if provided
      return (
        notEmpty(formData.firstName) &&
        notEmpty(formData.lastName)
      );
    }
    return (
      notEmpty(formData.firstName) &&
      notEmpty(formData.lastName) &&
      notEmpty(formData.dateOfBirth) &&
      notEmpty(formData.gender) &&
      notEmpty(formData.phone) &&
      notEmpty(formData.email) && emailOk &&
      notEmpty(formData.address) &&
      notEmpty(formData.city) &&
      notEmpty(formData.state) &&
      notEmpty(formData.zipCode) &&
      notEmpty(formData.country) &&
      formData.medicalHistory.length > 0 &&
      notEmpty(formData.allergies) &&
      notEmpty(formData.currentMedications) &&
      notEmpty(formData.familyHistory) &&
      notEmpty(formData.emergencyContact.name) &&
      notEmpty(formData.emergencyContact.relationship) &&
      notEmpty(formData.emergencyContact.phone) &&
      notEmpty(formData.maritalStatus) &&
      notEmpty(formData.occupation) &&
      notEmpty(formData.insuranceProvider) &&
      notEmpty(formData.insuranceNumber) &&
      numeric(formData.heartRate) &&
      numeric(formData.systolic) &&
      numeric(formData.diastolic) &&
      numeric(formData.temperature) &&
      numeric(formData.oxygenSat)
    );
  };

  const handleMedicalHistoryChange = (condition: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: checked
        ? [...prev.medicalHistory, condition]
        : prev.medicalHistory.filter(c => c !== condition)
    }));
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation (relaxed when editing)
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!isEditing) {
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Emergency contact validation (skip when editing)
    if (!isEditing) {
      if (!formData.emergencyContact.name.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContact.relationship.trim()) newErrors.emergencyContactRelationship = 'Relationship is required';
      if (!formData.emergencyContact.phone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    }

    // Additional information required (skip when editing)
    if (!isEditing) {
      if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital status is required';
      if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
      if (!formData.insuranceProvider.trim()) newErrors.insuranceProvider = 'Insurance provider is required';
      if (!formData.insuranceNumber.trim()) newErrors.insuranceNumber = 'Insurance policy number is required';
      if (!formData.allergies.trim()) newErrors.allergies = 'Allergies are required';
      if (!formData.currentMedications.trim()) newErrors.currentMedications = 'Current medications are required';
      if (!formData.familyHistory.trim()) newErrors.familyHistory = 'Family history is required';
      if (formData.medicalHistory.length === 0) newErrors.medicalHistory = 'Select at least one condition';
    }

    // Vitals validation (optional when editing; strict when adding)
    const numericCheck = (val: string) => /^\d+(\.\d+)?$/.test(val);
    if (!isEditing) {
      if (!formData.heartRate || !numericCheck(formData.heartRate)) newErrors.heartRate = 'Heart rate is required and must be a number';
      if (!formData.systolic || !numericCheck(formData.systolic)) newErrors.systolic = 'Systolic is required and must be a number';
      if (!formData.diastolic || !numericCheck(formData.diastolic)) newErrors.diastolic = 'Diastolic is required and must be a number';
      if (!formData.temperature || !numericCheck(formData.temperature)) newErrors.temperature = 'Temperature is required and must be a number';
      if (!formData.oxygenSat || !numericCheck(formData.oxygenSat)) newErrors.oxygenSat = 'Oxygen saturation is required and must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get existing patient data when editing to preserve values
      let existingPatient: any = null;
      if (editingId) {
        try {
          existingPatient = await getPatientFromBackend(editingId);
        } catch (error) {
          existingPatient = getPatientById(editingId);
        }
      }

      // Calculate age
      let age: number;
      if (isEditing && !formData.dateOfBirth && existingPatient) {
        age = existingPatient.age;
      } else if (formData.dateOfBirth) {
        age = calculateAge(formData.dateOfBirth);
      } else {
        age = existingPatient?.age || 0;
      }

      // Blood pressure
      let bp: string;
      if (formData.systolic && formData.diastolic) {
        bp = `${formData.systolic}/${formData.diastolic}`;
      } else if (isEditing && existingPatient?.vitals?.bloodPressure) {
        bp = existingPatient.vitals.bloodPressure;
      } else {
        bp = '—';
      }

      // Condition
      let condition: string;
      if (formData.medicalHistory.length > 0) {
        condition = formData.medicalHistory[0];
      } else if (isEditing && existingPatient?.condition) {
        condition = existingPatient.condition;
      } else {
        condition = 'General';
      }

      // Last visit
      let lastVisit: string;
      if (isEditing && existingPatient?.lastVisit) {
        lastVisit = existingPatient.lastVisit;
      } else {
        lastVisit = new Date().toISOString().slice(0, 10);
      }

      // Risk Level Prediction
      let riskLevel: 'low' | 'medium' | 'high' = existingPatient?.riskLevel || 'low';
      if (formData.heartRate && formData.systolic && formData.diastolic && formData.temperature && formData.oxygenSat) {
        try {
          const resp = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              heartRate: Number(formData.heartRate),
              systolic: Number(formData.systolic),
              diastolic: Number(formData.diastolic),
              temperature: Number(formData.temperature),
              oxygenSat: Number(formData.oxygenSat)
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            const predicted = String(data.risk).toLowerCase();
            if (predicted === 'high' || predicted === 'medium' || predicted === 'low') {
              riskLevel = predicted as typeof riskLevel;
            }
          }
        } catch (_) {
          // Ignore prediction errors
        }
      }

      // Vitals
      const vitals = {
        heartRate: formData.heartRate ? Number(formData.heartRate) : (existingPatient?.vitals?.heartRate || 0),
        bloodPressure: bp,
        temperature: formData.temperature ? Number(formData.temperature) : (existingPatient?.vitals?.temperature || 0),
        oxygenSat: formData.oxygenSat ? Number(formData.oxygenSat) : (existingPatient?.vitals?.oxygenSat || 0),
      };

      // Construct Payload
      // Note: We do NOT generate a PID here if creating new. We let the backend generate the ID (UUID)
      // or we generate a UUID here if we want optimistic UI, but for consistency we'll wait for backend.
      const payload = {
        id: editingId || '', // Empty ID for new patients, will be filled by backend
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        age,
        condition,
        riskLevel,
        lastVisit,
        location: {
          address: formData.address || existingPatient?.location?.address || '',
          city: formData.city || existingPatient?.location?.city || '',
          state: formData.state || existingPatient?.location?.state || '',
          zipCode: formData.zipCode || existingPatient?.location?.zipCode || '',
          country: formData.country || existingPatient?.location?.country || 'United States',
        },
        vitals,
        medicalHistory: formData.medicalHistory.length > 0 ? formData.medicalHistory : (existingPatient?.medicalHistory || undefined),
        allergies: formData.allergies || existingPatient?.allergies || undefined,
        currentMedications: formData.currentMedications || existingPatient?.currentMedications || undefined,
        familyHistory: formData.familyHistory || existingPatient?.familyHistory || undefined,
        emergencyContact: formData.emergencyContact.name ? formData.emergencyContact : (existingPatient?.emergencyContact || undefined),
        phone: formData.phone || existingPatient?.phone || undefined,
        email: formData.email || existingPatient?.email || undefined,
        dateOfBirth: formData.dateOfBirth || existingPatient?.dateOfBirth || undefined,
        gender: formData.gender || existingPatient?.gender || undefined,
        maritalStatus: formData.maritalStatus || existingPatient?.maritalStatus || undefined,
        occupation: formData.occupation || existingPatient?.occupation || undefined,
        insuranceProvider: formData.insuranceProvider || existingPatient?.insuranceProvider || undefined,
        insuranceNumber: formData.insuranceNumber || existingPatient?.insuranceNumber || undefined,
      };

      if (editingId) {
        // Update existing
        await updatePatient(payload);
        alert(`Patient updated successfully!`);
      } else {
        // Create new
        // 1. Create in backend FIRST to get the authoritative ID
        console.log('Creating patient in backend...');
        const backendId = await ensurePatientInBackend(payload);

        // 2. Update the payload with the returned ID
        const finalPayload = { ...payload, id: backendId };

        // 3. Save to local storage (now using the correct backend ID)
        addPatient(finalPayload);

        alert(`Patient ${formData.firstName} ${formData.lastName} added successfully!`);
      }
      navigate('/');
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Failed to add patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const age = calculateAge(formData.dateOfBirth);

  return (
    <div className="min-h-screen bg-medical-bg">
      <header className="bg-medical-card border-b border-border shadow-soft">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/')} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-medical-text">{isEditing ? 'Edit Patient Details' : 'Add New Patient'}</h1>
                  <p className="text-medical-muted">{isEditing ? 'Update patient demographics and medical information' : 'Enter patient demographics and medical information'}</p>
                </div>
              </div>
            </div>
            {age > 0 && (
              <Badge variant="secondary" className="text-sm">
                <Calendar className="w-3 h-3 mr-1" />
                Age: {age} years
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Demographics */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-destructive' : ''}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-destructive' : ''}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={errors.dateOfBirth ? 'border-destructive' : ''}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'border-destructive' : ''}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  placeholder="patient@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={errors.address ? 'border-destructive' : ''}
                  placeholder="123 Main Street"
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={errors.city ? 'border-destructive' : ''}
                    placeholder="New York"
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={errors.state ? 'border-destructive' : ''}
                    placeholder="NY"
                  />
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className={errors.zipCode ? 'border-destructive' : ''}
                    placeholder="10001"
                  />
                  {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="United States"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Medical Conditions (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {medicalConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={formData.medicalHistory.includes(condition)}
                        onCheckedChange={(checked) => handleMedicalHistoryChange(condition, checked as boolean)}
                      />
                      <Label htmlFor={condition} className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="List any known allergies (medications, food, environmental, etc.)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedications">Current Medications</Label>
                <Textarea
                  id="currentMedications"
                  value={formData.currentMedications}
                  onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                  placeholder="List current medications with dosages"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyHistory">Family Medical History</Label>
                <Textarea
                  id="familyHistory"
                  value={formData.familyHistory}
                  onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                  placeholder="Describe relevant family medical history"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Initial Vitals */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Initial Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input id="heartRate" value={formData.heartRate} onChange={(e) => handleInputChange('heartRate', e.target.value)} className={errors.heartRate ? 'border-destructive' : ''} placeholder="78" />
                  {errors.heartRate && <p className="text-sm text-destructive">{errors.heartRate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Blood Pressure (mmHg)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input id="systolic" value={formData.systolic} onChange={(e) => handleInputChange('systolic', e.target.value)} className={errors.systolic ? 'border-destructive' : ''} placeholder="120" />
                    <Input id="diastolic" value={formData.diastolic} onChange={(e) => handleInputChange('diastolic', e.target.value)} className={errors.diastolic ? 'border-destructive' : ''} placeholder="80" />
                  </div>
                  {(errors.systolic || errors.diastolic) && <p className="text-sm text-destructive">{errors.systolic || errors.diastolic}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°F)</Label>
                  <Input id="temperature" value={formData.temperature} onChange={(e) => handleInputChange('temperature', e.target.value)} className={errors.temperature ? 'border-destructive' : ''} placeholder="98.6" />
                  {errors.temperature && <p className="text-sm text-destructive">{errors.temperature}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oxygenSat">Oxygen Sat (%)</Label>
                  <Input id="oxygenSat" value={formData.oxygenSat} onChange={(e) => handleInputChange('oxygenSat', e.target.value)} className={errors.oxygenSat ? 'border-destructive' : ''} placeholder="98" />
                  {errors.oxygenSat && <p className="text-sm text-destructive">{errors.oxygenSat}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    className={errors.emergencyContactName ? 'border-destructive' : ''}
                    placeholder="John Doe"
                  />
                  {errors.emergencyContactName && <p className="text-sm text-destructive">{errors.emergencyContactName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                    placeholder="Spouse, Parent, Sibling, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    className={errors.emergencyContactPhone ? 'border-destructive' : ''}
                    placeholder="(555) 123-4567"
                  />
                  {errors.emergencyContactPhone && <p className="text-sm text-destructive">{errors.emergencyContactPhone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Demographics */}
          <Card className="bg-medical-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-medical-text flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                    placeholder="Blue Cross Blue Shield"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceNumber">Insurance Policy Number</Label>
                  <Input
                    id="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                    placeholder="ABC123456789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isAllFilled()}
              className="bg-gradient-to-r from-medical-primary to-medical-secondary"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Saving Details...' : 'Adding Patient...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Save Details' : 'Add Patient'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
