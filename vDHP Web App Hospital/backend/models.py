"""
Step 1: Data Models
====================
This file defines all the data structures using Pydantic models.
These models are used for:
- Request validation (Create models)
- Response formatting (Response models)
- Data updates (Update models)

All models use Pydantic which provides automatic validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ===== ENUMS =====

class RiskLevel(str, Enum):
    """Patient risk level classification"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ===== NESTED MODELS =====

class Location(BaseModel):
    """Patient location information"""
    address: str
    city: str
    state: str
    zipCode: str
    country: str = "United States"


class Vitals(BaseModel):
    """Patient vital signs"""
    heartRate: float = Field(..., ge=0, description="Heart rate in BPM")
    bloodPressure: str = Field(..., description="Blood pressure as 'systolic/diastolic'")
    temperature: float = Field(..., ge=80, le=120, description="Temperature in Fahrenheit")
    oxygenSat: float = Field(..., ge=0, le=100, description="Oxygen saturation percentage")


class EmergencyContact(BaseModel):
    """Emergency contact information"""
    name: str
    relationship: str
    phone: str


# ===== PATIENT MODELS =====

class PatientCreate(BaseModel):
    """Model for creating a new patient"""
    name: str
    age: int = Field(..., ge=0, le=150)
    condition: str
    location: Location
    vitals: Vitals
    # Optional ID - if provided and in PID format, will be used; otherwise backend generates one
    id: Optional[str] = None
    # Optional fields
    medicalHistory: Optional[List[str]] = None
    allergies: Optional[str] = None
    currentMedications: Optional[str] = None
    familyHistory: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    maritalStatus: Optional[str] = None
    occupation: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None


class PatientUpdate(BaseModel):
    """Model for updating patient information (all fields optional)"""
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    condition: Optional[str] = None
    location: Optional[Location] = None
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[List[str]] = None
    allergies: Optional[str] = None
    currentMedications: Optional[str] = None
    familyHistory: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    maritalStatus: Optional[str] = None
    occupation: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None


class PatientResponse(BaseModel):
    """Model for patient response (includes all fields plus generated ones)"""
    id: str
    name: str
    age: int
    condition: str
    riskLevel: RiskLevel
    lastVisit: date
    location: Location
    vitals: Vitals
    prescriptionImageDataUrl: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    # Optional fields
    medicalHistory: Optional[List[str]] = None
    allergies: Optional[str] = None
    currentMedications: Optional[str] = None
    familyHistory: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    maritalStatus: Optional[str] = None
    occupation: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None

    class Config:
        from_attributes = True


# ===== DOCTOR MODELS =====

class DoctorCreate(BaseModel):
    """Model for creating a new doctor profile"""
    name: str
    specialty: str
    email: Optional[str] = None
    phone: Optional[str] = None
    licenseNumber: Optional[str] = None
    hospital: Optional[str] = None
    # New fields
    photo: Optional[str] = None # Base64 encoded or URL
    gender: Optional[str] = None
    birthDate: Optional[date] = None
    address: Optional[str] = None
    bio: Optional[str] = None


class DoctorResponse(BaseModel):
    """Model for doctor response"""
    id: str
    name: str
    specialty: str
    email: Optional[str] = None
    phone: Optional[str] = None
    licenseNumber: Optional[str] = None
    hospital: Optional[str] = None
    # New fields
    photo: Optional[str] = None
    gender: Optional[str] = None
    birthDate: Optional[date] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


# ===== PROVIDER MODELS =====

class ProviderCreate(BaseModel):
    """Model for creating a new provider (hospital/clinic)"""
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class ProviderResponse(BaseModel):
    """Model for provider response"""
    id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


# ===== APPOINTMENT MODELS =====

class AppointmentCreate(BaseModel):
    """Model for creating a new appointment"""
    patientId: str
    doctorId: str
    scheduledDate: date
    scheduledTime: str = Field(..., description="Time in HH:MM format")
    reason: str


class AppointmentResponse(BaseModel):
    """Model for appointment response"""
    id: str
    patientId: str
    doctorId: str
    scheduledDate: date
    scheduledTime: str
    reason: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===== PRESCRIPTION MODELS =====

class PrescriptionCreate(BaseModel):
    """Model for creating a new prescription"""
    patientId: str
    doctorId: str
    medication: str
    dosage: str
    instructions: str
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    refills: Optional[int] = Field(None, ge=0)


class PrescriptionUpdate(BaseModel):
    """Model for updating a prescription (all fields optional)"""
    medication: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    refills: Optional[int] = Field(None, ge=0)


class PrescriptionResponse(BaseModel):
    """Model for prescription response"""
    id: str
    patientId: str
    doctorId: str
    medication: str
    dosage: str
    instructions: str
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    refills: Optional[int] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== MEDICAL RECORD MODELS =====

class MedicalRecordCreate(BaseModel):
    """Model for creating a new medical record"""
    patientId: str
    doctorId: str
    diagnosis: str
    notes: str
    visitDate: Optional[date] = None
    treatment: Optional[str] = None
    followUpRequired: Optional[bool] = False


class MedicalRecordResponse(BaseModel):
    """Model for medical record response"""
    id: str
    patientId: str
    doctorId: str
    diagnosis: str
    notes: str
    visitDate: Optional[date] = None
    treatment: Optional[str] = None
    followUpRequired: Optional[bool] = False
    createdAt: datetime

    class Config:
        from_attributes = True


# ===== DASHBOARD MODELS =====

class DashboardStats(BaseModel):
    """Model for dashboard statistics"""
    totalPatients: int
    activeCases: int
    appointmentsToday: int
    highRiskPatients: int
    totalDoctors: int
    totalAppointments: int

    class Config:
        from_attributes = True


# ===== CONSENT WORKFLOW MODELS =====

class ConsentStepCreate(BaseModel):
    """Model for creating a step in a consent workflow"""
    step_type: str  # 'text', 'input', 'signature', 'template'
    title: str
    content: Optional[str] = None
    is_required: Optional[bool] = True
    step_order: int


class ConsentStepResponse(ConsentStepCreate):
    """Model for consent step response"""
    id: str
    workflow_id: str

    class Config:
        from_attributes = True


class ConsentWorkflowCreate(BaseModel):
    """Model for creating a new consent workflow"""
    name: str
    description: Optional[str] = None
    steps: List[ConsentStepCreate]


class ConsentWorkflowResponse(BaseModel):
    """Model for consent workflow response"""
    id: str
    name: str
    description: Optional[str] = None
    created_by: str
    created_at: datetime
    is_active: bool
    steps: List[ConsentStepResponse] = []

    class Config:
        from_attributes = True
