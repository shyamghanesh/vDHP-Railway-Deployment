"""
User and Authentication Models
Unified user model with role-based access control
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid


class User(Base):
    """
    Unified User model for both Patient and Hospital Staff.
    Role field distinguishes between different user types.
    """
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Role-based access: patient, doctor, provider, admin
    role = Column(String(50), nullable=False, default='patient')
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    biometric_enabled = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class Invitation(Base):
    """
    Invitation codes created by hospital staff for patient onboarding.
    Links hospital-side patient creation with mobile app registration.
    """
    __tablename__ = "invitations"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invitation_code = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    hospital_id = Column(String(36), nullable=False)
    patient_mrn = Column(String(100), nullable=True)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    used_by_user_id = Column(String(36), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), nullable=True)  # User ID who created the invitation
    invite_metadata = Column(Text, nullable=True)  # JSON string for additional data
