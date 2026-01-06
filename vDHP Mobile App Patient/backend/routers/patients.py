"""
Patient Profile Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.config.auth import get_current_patient
from backend.schemas.patient import (
    PatientResponse,
    PatientProfileUpdate,
    EmergencyContactUpdate,
    AccessibilityPreferencesUpdate,
    ConsentCreate,
    ConsentResponse,
)
from backend.models import Patient, Consent
from typing import List

router = APIRouter(tags=["Patients"])

@router.get("/me", response_model=PatientResponse)
async def get_my_profile(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get current patient profile"""
    patient = current_patient
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient

@router.put("/me", response_model=PatientResponse)
async def update_my_profile(
    updates: PatientProfileUpdate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update patient profile"""
    patient = current_patient
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    
    return patient

@router.put("/me/emergency-contact")
async def update_emergency_contact(
    updates: EmergencyContactUpdate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update emergency contact information"""
    patient = current_patient
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(patient, field, value)
    
    db.commit()
    
    return {"message": "Emergency contact updated successfully"}

@router.put("/me/accessibility")
async def update_accessibility_preferences(
    updates: AccessibilityPreferencesUpdate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update accessibility preferences"""
    patient = current_patient
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(patient, field, value)
    
    db.commit()
    
    return {"message": "Accessibility preferences updated successfully"}

@router.post("/me/consents", response_model=ConsentResponse)
async def create_consent(
    consent: ConsentCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create or update patient consent"""
    from datetime import datetime
    
    new_consent = Consent(
        patient_id=current_patient.id,
        consent_type=consent.consent_type,
        consent_version=consent.consent_version,
        consent_text=consent.consent_text,
        is_agreed=consent.is_agreed,
        agreed_at=datetime.utcnow() if consent.is_agreed else None,
        signature_data=consent.signature_data
    )
    
    db.add(new_consent)
    db.commit()
    db.refresh(new_consent)
    
    return new_consent

@router.get("/me/consents", response_model=List[ConsentResponse])
async def get_my_consents(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all patient consents"""
    consents = db.query(Consent).filter(Consent.patient_id == current_patient.id).all()
    return consents
