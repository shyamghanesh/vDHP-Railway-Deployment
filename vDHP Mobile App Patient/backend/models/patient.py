"""
Patient and Profile Models - FHIR Compliant
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Date, ForeignKey, JSON
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    
    mrn = Column(String(100), unique=True, nullable=True, index=True)
    
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    preferred_language = Column(String(20), default='en')
    
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_relationship = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_email = Column(String(255), nullable=True)
    
    insurance_provider = Column(String(200), nullable=True)
    insurance_member_id = Column(String(100), nullable=True)
    insurance_group_number = Column(String(100), nullable=True)
    
    profile_photo_url = Column(String(500), nullable=True)
    
    fhir_patient_resource = Column(JSON, nullable=True)
    
    accessibility_font_size = Column(String(20), default='base')
    accessibility_high_contrast = Column(Boolean, default=False)
    accessibility_voice_guidance = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    
    consent_type = Column(String(100), nullable=False)
    consent_version = Column(String(20), nullable=False)
    consent_text = Column(Text, nullable=False)
    
    is_agreed = Column(Boolean, default=False)
    agreed_at = Column(DateTime(timezone=True), nullable=True)
    signature_data = Column(Text, nullable=True)
    
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    fhir_consent_resource = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MedicalHistory(Base):
    __tablename__ = "medical_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    
    allergies = Column(JSON, nullable=True)
    current_medications = Column(JSON, nullable=True)
    chronic_conditions = Column(JSON, nullable=True)
    past_surgeries = Column(JSON, nullable=True)
    family_history = Column(JSON, nullable=True)
    immunizations = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
