"""
Step 5: Provider Router (Provider Portal Endpoints)
====================================================
This router handles endpoints specific to the provider portal:
- Dashboard statistics and analytics
- Patient overview and search
- Viewing appointments, prescriptions, and records from provider perspective

All data comes from the same data store, so changes made by doctors
are immediately visible here, keeping everything in sync!
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import date
try:
    from backend.models import (
        ProviderResponse, ProviderCreate,
        PatientResponse,
        AppointmentResponse,
        PrescriptionResponse,
        MedicalRecordResponse,
        DashboardStats
    )
    from backend.data_store import data_store
except ImportError:
    from models import (
        ProviderResponse, ProviderCreate,
        PatientResponse,
        AppointmentResponse,
        PrescriptionResponse,
        MedicalRecordResponse,
        DashboardStats
    )
    from data_store import data_store

router = APIRouter(
    tags=["Providers"]
)


# ===== PROVIDER MANAGEMENT =====
@router.get("", response_model=List[ProviderResponse])
async def get_all_providers():
    """Get all providers (hospitals/clinics)"""
    return data_store.get_all_providers()


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(provider_id: str):
    """Get a specific provider by ID"""
    provider = data_store.get_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    return provider


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(provider_data: ProviderCreate):
    """Create a new provider (hospital/clinic)"""
    try:
        provider = data_store.create_provider(provider_data)
        return provider
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating provider: {str(e)}"
        )


# ===== DASHBOARD & ANALYTICS =====
@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Get dashboard statistics
    
    This provides an overview of all data in the system.
    Both doctor and provider portals can use this to see the same statistics,
    ensuring they're always in sync.
    """
    patients = data_store.get_all_patients()
    appointments = data_store.get_all_appointments()
    doctors = data_store.get_all_doctors()
    
    # Count high-risk patients
    high_risk_count = sum(1 for p in patients if p.riskLevel.value == "high")
    
    # Count today's appointments
    today = date.today()
    today_appointments = sum(1 for a in appointments if a.scheduledDate == today)
    
    return DashboardStats(
        totalPatients=len(patients),
        activeCases=len(patients),  # For now, all patients are "active"
        appointmentsToday=today_appointments,
        highRiskPatients=high_risk_count,
        totalDoctors=len(doctors),
        totalAppointments=len(appointments)
    )


@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_all_appointments():
    """
    Get all appointments
    
    This allows the provider to see a list of all appointments across all doctors/patients.
    """
    return data_store.get_all_appointments()


# ===== PATIENT-RELATED ENDPOINTS (Provider View) =====
@router.get("/patients/{patient_id}/appointments", response_model=List[AppointmentResponse])
async def get_patient_appointments(patient_id: str):
    """
    Get all appointments for a specific patient
    
    This shows the patient's appointment history from the provider's perspective.
    When a doctor creates an appointment, it immediately appears here.
    """
    # Verify patient exists
    patient = data_store.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    return data_store.get_appointments_by_patient(patient_id)


@router.get("/patients/{patient_id}/prescriptions", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(patient_id: str):
    """
    Get all prescriptions for a specific patient
    
    This shows the patient's prescription history from the provider's perspective.
    When a doctor creates a prescription, it immediately appears here.
    """
    # Log the request for debugging
    print(f"[Provider Portal] Fetching prescriptions for patient ID: {patient_id}")
    
    # Get prescriptions even if patient doesn't exist in backend yet
    # (patient might exist in frontend localStorage but not synced to backend)
    with open("debug_providers.txt", "w") as f:
        f.write(f"DEBUG: data_store type: {type(data_store)}\n")
        f.write(f"DEBUG: data_store attributes: {dir(data_store)}\n")
        try:
            import inspect
            f.write(f"DEBUG: data_store module: {inspect.getmodule(data_store)}\n")
            f.write(f"DEBUG: data_store file: {inspect.getfile(data_store.__class__)}\n")
        except Exception as e:
            f.write(f"DEBUG: Error getting inspect info: {e}\n")
        
        try:
            method = getattr(data_store, 'get_prescriptions_by_patient')
            f.write(f"DEBUG: Method object: {method}\n")
            f.write(f"DEBUG: Method type: {type(method)}\n")
            prescriptions = method(patient_id)
        except AttributeError as e:
            f.write(f"DEBUG: AttributeError caught: {e}\n")
            raise e
        except Exception as e:
            f.write(f"DEBUG: Other error caught: {e}\n")
            raise e
    print(f"[Provider Portal] Found {len(prescriptions)} prescriptions for patient {patient_id}")
    
    # If no prescriptions found with exact ID match, try to find patient by checking all patients
    # and see if there's a matching patient that might have prescriptions
    if len(prescriptions) == 0:
        try:
            all_prescriptions = data_store.get_all_prescriptions()
            all_patients = data_store.get_all_patients()
            
            # Check if there's a patient with a different ID that might match
            # This handles cases where frontend uses UUID but backend uses PID
            patient = data_store.get_patient(patient_id)
            if patient:
                # Patient exists, but no prescriptions - return empty list
                print(f"[Provider Portal] Patient {patient_id} exists but has no prescriptions")
            else:
                # Patient doesn't exist - check if there are any prescriptions at all
                print(f"[Provider Portal] Patient {patient_id} not found in backend")
                print(f"[Provider Portal] All prescription patient IDs in system: {[p.patientId for p in all_prescriptions]}")
                print(f"[Provider Portal] All patient IDs in system: {[p.id for p in all_patients]}")
        except Exception as e:
            print(f"[Provider Portal] Error getting all prescriptions: {e}")
    
    return prescriptions


@router.get("/patients/{patient_id}/medical-records", response_model=List[MedicalRecordResponse])
async def get_patient_medical_records(patient_id: str):
    """
    Get all medical records for a specific patient
    
    This shows the patient's complete medical history from the provider's perspective.
    When a doctor creates a medical record, it immediately appears here.
    """
    # Verify patient exists
    patient = data_store.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    return data_store.get_medical_records_by_patient(patient_id)


@router.get("/patients/{patient_id}/complete-history")
async def get_patient_complete_history(patient_id: str):
    """
    Get complete patient history (appointments, prescriptions, records)
    
    This is a comprehensive view of everything related to a patient.
    Perfect for the provider portal to see the full picture.
    """
    # Verify patient exists
    patient = data_store.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    return {
        "patient": patient,
        "appointments": data_store.get_appointments_by_patient(patient_id),
        "prescriptions": data_store.get_prescriptions_by_patient(patient_id),
        "medicalRecords": data_store.get_medical_records_by_patient(patient_id)
    }


# ===== DEBUGGING ENDPOINT =====
@router.get("/debug/prescriptions")
async def debug_prescriptions():
    """
    Debug endpoint to see all prescriptions and their patient IDs
    This helps identify patient ID mismatches
    """
    all_prescriptions = data_store.get_all_prescriptions()
    all_patients = data_store.get_all_patients()
    
    return {
        "total_prescriptions": len(all_prescriptions),
        "total_patients": len(all_patients),
        "prescriptions": [
            {
                "id": p.id,
                "patientId": p.patientId,
                "doctorId": p.doctorId,
                "medication": p.medication,
                "createdAt": str(p.createdAt)
            }
            for p in all_prescriptions
        ],
        "patient_ids": [p.id for p in all_patients],
        "prescription_patient_ids": [p.patientId for p in all_prescriptions]
    }


# ===== SEARCH & FILTER =====
@router.get("/patients/search", response_model=List[PatientResponse])
async def search_patients(
    name: Optional[str] = None,
    condition: Optional[str] = None,
    riskLevel: Optional[str] = None,
    city: Optional[str] = None
):
    """
    Search and filter patients
    
    This allows the provider portal to search through patients with various filters.
    All filters are optional - you can use any combination.
    """
    patients = data_store.get_all_patients()
    
    # Apply filters
    filtered = patients
    
    if name:
        filtered = [p for p in filtered if name.lower() in p.name.lower()]
    
    if condition:
        filtered = [p for p in filtered if condition.lower() in p.condition.lower()]
    
    if riskLevel:
        filtered = [p for p in filtered if p.riskLevel.value == riskLevel.lower()]
    
    if city:
        filtered = [p for p in filtered if city.lower() in p.location.city.lower()]
    
    return filtered

