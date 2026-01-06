"""
SQL Models for vDHP Hospital Web App
FHIR-compliant data models with unified schema
Supports both SQLite (development) and PostgreSQL (production)
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, DateTime, Float, Text
from sqlalchemy.types import TypeDecorator, TEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import json

try:
    from backend.database import Base, IS_SQLITE
except ImportError:
    try:
        from database import Base, IS_SQLITE
    except ImportError:
        from database import Base
        IS_SQLITE = True  # Fallback to SQLite-compatible mode


# ============================================================================
# CROSS-DATABASE JSON TYPE
# ============================================================================

class JSONType(TypeDecorator):
    """
    A JSON type that works with both SQLite and PostgreSQL.
    Uses TEXT storage for SQLite, native JSON/JSONB for PostgreSQL.
    """
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value, default=str)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return None


# Use our cross-database JSONType instead of JSONB
JSONB = JSONType


# ============================================================================
# USER MODEL
# ============================================================================

class User(Base):
    """
    Unified User model for both Patient and Hospital Staff.
    Role field distinguishes between different user types.
    Matches the Mobile App Patient User model.
    """
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='doctor')  # patient, doctor, provider, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    biometric_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================================================
# FHIR RESOURCE MODELS
# ============================================================================

class FhirPatient(Base):
    """
    FHIR Patient resource storage.
    Links to the unified patients table for cross-app compatibility.
    """
    __tablename__ = "fhir_patients"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    gender = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)
    
    # Link to unified patients table
    patient_id = Column(String(36), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)


class FhirPractitioner(Base):
    """
    FHIR Practitioner resource storage (Doctors).
    Links to users table for authentication.
    """
    __tablename__ = "fhir_practitioners"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    name_family = Column(String(100), nullable=True)
    
    # Link to users table
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)


class FhirOrganization(Base):
    """
    FHIR Organization resource storage (Healthcare Providers).
    Links to users table for authentication.
    """
    __tablename__ = "fhir_organizations"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    active = Column(Boolean, nullable=True)
    name = Column(String(255), nullable=True)
    
    # Link to users table
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)


class FhirAppointment(Base):
    """FHIR Appointment resource storage."""
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
    """FHIR Encounter resource storage."""
    __tablename__ = "fhir_encounters"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)
    practitioner_id = Column(String(36), nullable=True)


class FhirObservation(Base):
    """
    FHIR Observation resource storage.
    Links to vitals table for cross-app compatibility.
    """
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
    
    # Link to vitals table
    vitals_id = Column(String(36), nullable=True)


class FhirCondition(Base):
    """FHIR Condition resource storage."""
    __tablename__ = "fhir_conditions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    clinical_status = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)


class FhirMedicationRequest(Base):
    """FHIR MedicationRequest resource storage (Prescriptions)."""
    __tablename__ = "fhir_medication_requests"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    resource = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    status = Column(String(50), nullable=True)
    intent = Column(String(50), nullable=True)
    patient_id = Column(String(36), nullable=True)
    requester_id = Column(String(36), nullable=True)


# ============================================================================
# CONSENT WORKFLOW MODELS
# ============================================================================

class ConsentWorkflow(Base):
    """Consent workflow definitions."""
    __tablename__ = "consent_workflows"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    steps = relationship("ConsentStep", back_populates="workflow", cascade="all, delete-orphan", order_by="ConsentStep.step_order")


class ConsentStep(Base):
    """Individual steps within a consent workflow."""
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


# ============================================================================
# AUDIT LOG for HIPAA Compliance
# ============================================================================

class AuditLog(Base):
    """Audit log for HIPAA compliance and security tracking."""
    __tablename__ = "audit_log"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(36), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
