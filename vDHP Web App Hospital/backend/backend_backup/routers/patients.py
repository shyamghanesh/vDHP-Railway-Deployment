"""
Step 3: Patient Router (Shared Endpoints)
===========================================
This router handles all patient-related endpoints that BOTH doctor and provider
portals can use. This ensures they work with the same patient data and stay in sync.

Endpoints:
- GET /api/patients - Get all patients
- GET /api/patients/{patient_id} - Get a specific patient
- POST /api/patients - Create a new patient
- PUT /api/patients/{patient_id} - Update a patient
- DELETE /api/patients/{patient_id} - Delete a patient
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from models import PatientResponse, PatientCreate, PatientUpdate
from data_store import data_store

# Create a router - this groups related endpoints together
router = APIRouter(
    tags=["Patients"]  # Groups endpoints in API documentation
)


@router.get("")
async def get_all_patients():
    """
    Get all patients with prescription counts
    
    Both doctor and provider portals can use this to see the full patient list.
    Returns the same data for both, keeping them in sync!
    Includes prescription count for each patient.
    """
    patients = data_store.get_all_patients()
    
    # Add prescription count to each patient
    patients_with_counts = []
    for patient in patients:
        patient_dict = patient.dict()
        prescription_count = len(data_store.get_prescriptions_by_patient(patient.id))
        patient_dict['prescriptionCount'] = prescription_count
        patients_with_counts.append(patient_dict)
    
    return patients_with_counts


@router.get("/{patient_id}")
async def get_patient(patient_id: str):
    """
    Get a specific patient by ID with prescription count
    
    Returns detailed information about a single patient, including prescription count.
    """
    patient = data_store.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Add prescription count
    patient_dict = patient.dict()
    prescription_count = len(data_store.get_prescriptions_by_patient(patient_id))
    patient_dict['prescriptionCount'] = prescription_count
    
    return patient_dict


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(patient_data: PatientCreate):
    """
    Create a new patient
    
    When a patient is created, both portals will see it immediately
    because they both read from the same data store.
    """
    try:
        patient = data_store.create_patient(patient_data)
        return patient
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating patient: {str(e)}"
        )


@router.put("/{patient_id}")
async def update_patient(patient_id: str, patient_update: PatientUpdate):
    """
    Update a patient's information with prescription count
    
    When a patient is updated, the change is immediately visible to both
    doctor and provider portals because they share the same data store.
    """
    patient = data_store.update_patient(patient_id, patient_update)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Add prescription count
    patient_dict = patient.dict()
    prescription_count = len(data_store.get_prescriptions_by_patient(patient_id))
    patient_dict['prescriptionCount'] = prescription_count
    
    return patient_dict


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(patient_id: str):
    """
    Delete a patient
    
    When a patient is deleted, they disappear from both portals immediately.
    Also deletes related appointments, prescriptions, and medical records.
    """
    success = data_store.delete_patient(patient_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    return None

