"""
Patient Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class PatientProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    preferred_language: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[EmailStr] = None
    insurance_provider: Optional[str] = None
    insurance_member_id: Optional[str] = None
    insurance_group_number: Optional[str] = None

class EmergencyContactUpdate(BaseModel):
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[EmailStr] = None

class AccessibilityPreferencesUpdate(BaseModel):
    accessibility_font_size: Optional[str] = Field(None, pattern='^(xs|sm|base|lg|xl|xxl)$')
    accessibility_high_contrast: Optional[bool] = None
    accessibility_voice_guidance: Optional[bool] = None

class PatientResponse(BaseModel):
    id: str
    user_id: str
    mrn: Optional[str]
    first_name: str
    middle_name: Optional[str]
    last_name: str
    date_of_birth: date
    gender: str
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    preferred_language: str
    emergency_contact_name: Optional[str]
    emergency_contact_relationship: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_email: Optional[str]
    insurance_provider: Optional[str]
    insurance_member_id: Optional[str]
    insurance_group_number: Optional[str]
    accessibility_font_size: str
    accessibility_high_contrast: bool
    accessibility_voice_guidance: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConsentCreate(BaseModel):
    consent_type: str
    consent_version: str
    consent_text: str
    is_agreed: bool
    signature_data: Optional[str] = None

class ConsentResponse(BaseModel):
    id: str
    patient_id: str
    consent_type: str
    consent_version: str
    is_agreed: bool
    agreed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
