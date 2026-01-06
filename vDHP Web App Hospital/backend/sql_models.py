from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, DateTime, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from backend.database import Base
except ImportError:
    from database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    biometric_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class FhirPatient(Base):
    __tablename__ = "fhir_patients"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    gender = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)

class FhirPractitioner(Base):
    __tablename__ = "fhir_practitioners"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    name_family = Column(String(100), nullable=True)

class FhirOrganization(Base):
    __tablename__ = "fhir_organizations"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    name = Column(String(255), nullable=True)

class FhirAppointment(Base):
    __tablename__ = "fhir_appointments"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    start_date = Column(DateTime, nullable=True)
    patient_id = Column(String(36), nullable=True)
    practitioner_id = Column(String(36), nullable=True)

class FhirEncounter(Base):
    __tablename__ = "fhir_encounters"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)
    practitioner_id = Column(String(36), nullable=True)

class FhirObservation(Base):
    __tablename__ = "fhir_observations"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)
    code = Column(String(100), nullable=True)
    patient_id = Column(String(36), nullable=True)
    effective_date = Column(DateTime, nullable=True)

class FhirCondition(Base):
    __tablename__ = "fhir_conditions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    clinical_status = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)

class FhirMedicationRequest(Base):
    __tablename__ = "fhir_medication_requests"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    intent = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)
    requester_id = Column(String(36), nullable=True)

class ConsentWorkflow(Base):
    __tablename__ = "consent_workflows"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    steps = relationship("ConsentStep", back_populates="workflow", cascade="all, delete-orphan", order_by="ConsentStep.step_order")

class ConsentStep(Base):
    __tablename__ = "consent_steps"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    workflow_id = Column(String(36), ForeignKey("consent_workflows.id"))
    step_order = Column(Integer, nullable=False)
    step_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    is_required = Column(Boolean, default=True)

    workflow = relationship("ConsentWorkflow", back_populates="steps")
