"""
Authentication Router
Handles patient registration, login, and invitation validation
Uses bcrypt for password hashing (unified with Hospital Web App)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.schemas.auth import (
    InvitationValidateRequest,
    InvitationValidateResponse,
    RegisterRequest,
    SimpleRegisterRequest,
    LoginRequest,
    LoginResponse,
)
from backend.models import User, Invitation, Patient, Consent
from backend.config.auth import SECRET_KEY, ALGORITHM
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

router = APIRouter(tags=["Authentication"])

# Use bcrypt for password hashing (unified with Hospital Web App)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token with role information."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "role": data.get("role", "patient")  # Default role is patient
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


@router.post("/validate-invitation", response_model=InvitationValidateResponse)
async def validate_invitation(request: InvitationValidateRequest, db: Session = Depends(get_db)):
    """Validate invitation code from hospital."""
    invitation = db.query(Invitation).filter(
        Invitation.invitation_code == request.invitation_code
    ).first()
    
    if not invitation:
        return InvitationValidateResponse(
            valid=False,
            message="Invalid invitation code"
        )
    
    if invitation.is_used:
        return InvitationValidateResponse(
            valid=False,
            message="Invitation code has already been used"
        )
    
    # Use timezone-aware comparison
    now = datetime.now(timezone.utc)
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < now:
        return InvitationValidateResponse(
            valid=False,
            message="Invitation code has expired"
        )
    
    return InvitationValidateResponse(
        valid=True,
        message="Invitation code is valid",
        invitation_id=invitation.id,
        email=invitation.email,
        phone=invitation.phone
    )


@router.post("/register-simple", response_model=LoginResponse)
async def register_simple(request: SimpleRegisterRequest, db: Session = Depends(get_db)):
    """Simple registration with name, email, phone, and password."""
    # Check for existing user
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create user with patient role
    user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password,
        role="patient",  # Explicit role assignment
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()
    
    # Split name into first and last name
    name_parts = request.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Create patient record with minimal info
    patient = Patient(
        user_id=user.id,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=datetime(1990, 1, 1).date(),
        gender="not-specified"
    )
    db.add(patient)
    
    db.commit()
    db.refresh(user)
    db.refresh(patient)
    
    # Create token with role
    access_token = create_access_token(data={
        "sub": user.email,
        "user_id": user.id,
        "role": "patient"
    })
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id
    )


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new patient with or without invitation code."""
    
    # Check if invitation code is provided
    invitation = None
    if request.invitation_code:
        invitation = db.query(Invitation).filter(
            Invitation.invitation_code == request.invitation_code,
            Invitation.is_used == False
        ).first()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or used invitation code"
            )
    
    # Check for existing user
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create user with patient role
    user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password,
        role="patient",  # Explicit role assignment
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()
    
    # Create patient record
    patient_data = {
        "user_id": user.id,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "gender": "not-specified"
    }
    
    if invitation:
        patient_data["mrn"] = invitation.patient_mrn
    
    if request.date_of_birth:
        patient_data["date_of_birth"] = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
    else:
        # Default date of birth if not provided
        patient_data["date_of_birth"] = datetime(1990, 1, 1).date()
    
    patient = Patient(**patient_data)
    db.add(patient)
    
    # Mark invitation as used if provided
    if invitation:
        invitation.is_used = True
        invitation.used_at = datetime.now(timezone.utc)
        invitation.used_by_user_id = user.id
    
    db.commit()
    db.refresh(user)
    db.refresh(patient)
    
    # Create token with role
    access_token = create_access_token(data={
        "sub": user.email,
        "user_id": user.id,
        "role": "patient"
    })
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Get patient record and check consent
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    requires_consent = False
    
    if patient:
        consent = db.query(Consent).filter(Consent.patient_id == patient.id).first()
        if not consent:
            requires_consent = True
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    # Create token with role
    role = getattr(user, 'role', 'patient') or 'patient'
    access_token = create_access_token(data={
        "sub": user.email,
        "user_id": user.id,
        "role": role
    })
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id if patient else None,
        requires_consent=requires_consent
    )
