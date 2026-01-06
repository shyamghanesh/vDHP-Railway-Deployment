"""
Authentication Router
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
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/validate-invitation", response_model=InvitationValidateResponse)
async def validate_invitation(request: InvitationValidateRequest, db: Session = Depends(get_db)):
    """Validate invitation code from hospital"""
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
    
    if invitation.expires_at < datetime.utcnow():
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
    """Simple registration with name, email, phone, and password"""
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = pwd_context.hash(request.password)
    
    user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password,
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
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id
    )

@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new patient with or without invitation code"""
    
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
    
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = pwd_context.hash(request.password)
    
    user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password,
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
        invitation.used_at = datetime.utcnow()
        invitation.used_by_user_id = user.id
    
    db.commit()
    db.refresh(user)
    db.refresh(patient)
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id
    )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    requires_consent = False
    if patient:
        consent = db.query(Consent).filter(Consent.patient_id == patient.id).first()
        if not consent:
            requires_consent = True
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        patient_id=patient.id if patient else None,
        requires_consent=requires_consent
    )
