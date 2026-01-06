"""
Vitals Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import Optional
from backend.config.database import get_db
from backend.config.auth import get_current_patient
from backend.models import Patient, Vitals, VitalsType
from backend.schemas.vitals import VitalsCreate, VitalsResponse, VitalsListResponse

router = APIRouter(prefix="/vitals", tags=["Vitals"])

@router.post("", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
async def create_vitals(
    vitals_data: VitalsCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create a new vitals reading"""
    
    vitals = Vitals(
        patient_id=current_patient.id,
        vitals_type=vitals_data.vitals_type,
        systolic=vitals_data.systolic,
        diastolic=vitals_data.diastolic,
        blood_sugar_value=vitals_data.blood_sugar_value,
        blood_sugar_unit=vitals_data.blood_sugar_unit,
        blood_sugar_type=vitals_data.blood_sugar_type,
        value=vitals_data.value,
        unit=vitals_data.unit,
        notes=vitals_data.notes,
        measured_at=vitals_data.measured_at
    )
    
    db.add(vitals)
    db.commit()
    db.refresh(vitals)
    
    return vitals

@router.get("", response_model=VitalsListResponse)
async def get_vitals(
    vitals_type: Optional[VitalsType] = Query(None, description="Filter by vitals type"),
    days: Optional[int] = Query(30, description="Number of days to retrieve"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get vitals readings for the current patient"""
    
    query = db.query(Vitals).filter(Vitals.patient_id == current_patient.id)
    
    if vitals_type:
        query = query.filter(Vitals.vitals_type == vitals_type)
    
    # Filter by date range
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Vitals.measured_at >= start_date)
    
    vitals = query.order_by(desc(Vitals.measured_at)).all()
    
    return VitalsListResponse(
        vitals=vitals,
        total=len(vitals)
    )

@router.get("/latest", response_model=dict)
async def get_latest_vitals(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get latest vitals readings for each type"""
    
    latest_vitals = {}
    
    for vitals_type in VitalsType:
        latest = db.query(Vitals).filter(
            Vitals.patient_id == current_patient.id,
            Vitals.vitals_type == vitals_type
        ).order_by(desc(Vitals.measured_at)).first()
        
        if latest:
            latest_vitals[vitals_type.value] = {
                "id": latest.id,
                "systolic": latest.systolic,
                "diastolic": latest.diastolic,
                "blood_sugar_value": latest.blood_sugar_value,
                "blood_sugar_unit": latest.blood_sugar_unit,
                "blood_sugar_type": latest.blood_sugar_type,
                "value": latest.value,
                "unit": latest.unit,
                "measured_at": latest.measured_at.isoformat(),
            }
    
    return latest_vitals

@router.delete("/{vitals_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vitals(
    vitals_id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Delete a vitals reading"""
    
    vitals = db.query(Vitals).filter(
        Vitals.id == vitals_id,
        Vitals.patient_id == current_patient.id
    ).first()
    
    if not vitals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vitals reading not found"
        )
    
    db.delete(vitals)
    db.commit()
    
    return None

