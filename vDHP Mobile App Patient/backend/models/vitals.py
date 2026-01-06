"""
Vitals and Health Metrics Models - FHIR Observation Compliant
"""

from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid
import enum

class VitalsType(str, enum.Enum):
    BLOOD_PRESSURE = "blood_pressure"
    BLOOD_SUGAR = "blood_sugar"
    HEART_RATE = "heart_rate"
    WEIGHT = "weight"
    TEMPERATURE = "temperature"
    OXYGEN_SATURATION = "oxygen_saturation"

class Vitals(Base):
    __tablename__ = "vitals"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    
    vitals_type = Column(Enum(VitalsType), nullable=False, index=True)
    
    # Blood Pressure specific fields
    systolic = Column(Integer, nullable=True)  # mmHg
    diastolic = Column(Integer, nullable=True)  # mmHg
    
    # Blood Sugar specific fields
    blood_sugar_value = Column(Float, nullable=True)  # mg/dL or mmol/L
    blood_sugar_unit = Column(String(10), default='mg/dL')  # mg/dL or mmol/L
    blood_sugar_type = Column(String(20), nullable=True)  # fasting, postprandial, random
    
    # Generic value for other vitals
    value = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    
    # Metadata
    notes = Column(String(500), nullable=True)
    measured_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # FHIR compliance
    fhir_observation_resource = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

