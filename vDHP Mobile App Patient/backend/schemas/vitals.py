"""
Vitals Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from backend.models.vitals import VitalsType

class VitalsCreate(BaseModel):
    vitals_type: VitalsType
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    blood_sugar_value: Optional[float] = None
    blood_sugar_unit: Optional[str] = "mg/dL"
    blood_sugar_type: Optional[str] = None  # fasting, postprandial, random
    value: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    measured_at: datetime

class VitalsResponse(BaseModel):
    id: str
    patient_id: str
    vitals_type: str
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    blood_sugar_value: Optional[float] = None
    blood_sugar_unit: Optional[str] = None
    blood_sugar_type: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    measured_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class VitalsListResponse(BaseModel):
    vitals: list[VitalsResponse]
    total: int

