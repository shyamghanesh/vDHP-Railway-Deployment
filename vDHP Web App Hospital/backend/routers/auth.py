"""
Authentication Router for Hospital Web App
Uses bcrypt for password hashing (unified with Mobile App)
Supports role-based access control for doctors, providers, and admins
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
import uuid
import os

try:
    from backend.data_store import data_store
    from backend.models import DoctorCreate, ProviderCreate
except ImportError:
    from data_store import data_store
    from models import DoctorCreate, ProviderCreate

router = APIRouter()

# ============================================================================
# CONFIGURATION
# ============================================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_REQUIRED")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Use bcrypt for password hashing (unified with Mobile App)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
security_bearer = HTTPBearer(auto_error=False)


# ============================================================================
# MODELS
# ============================================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # 'doctor', 'patient', 'provider', 'admin'


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    is_first_login: bool = False
    id: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None


# ============================================================================
# PASSWORD HELPERS
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


# ============================================================================
# TOKEN HELPERS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode a JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ============================================================================
# ROUTES
# ============================================================================

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    """Register a new user (doctor, provider, or admin)."""
    # Check if user exists
    db_user = data_store.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create User
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    new_user = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_password,
        "role": user.role,
        "is_active": True,
        "is_verified": False
    }
    
    data_store.create_user(new_user)
    
    # If Doctor, create Practitioner profile
    if user.role == "doctor":
        doctor_create = DoctorCreate(
            name=user.name,
            specialty="General",
            email=user.email
        )
        data_store.create_doctor(doctor_create)
        
    # If Healthcare Provider, create Organization profile
    elif user.role == "healthcare_provider" or user.role == "provider":
        provider_create = ProviderCreate(
            name=user.name,
            email=user.email
        )
        data_store.create_provider(provider_create)

    # Create Access Token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "user_id": user_id
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.name,
        "id": user_id
    }


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password."""
    # Verify User
    user = data_store.get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Access Token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "user_id": user.id
        }
    )
    
    # Update last login and check if first time
    is_first_login = data_store.update_user_last_login(user.email)
    
    # Get name and ID
    name = user.name or user.email.split("@")[0]
    user_id = user.id
    
    if user.role == 'doctor':
        doctor = data_store.get_doctor_by_email(user.email)
        if doctor:
            name = doctor.name
            user_id = doctor.id
    elif user.role in ['healthcare_provider', 'provider']:
        provider = data_store.get_provider_by_email(user.email)
        if provider:
            name = provider.name
            user_id = provider.id
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": name,
        "is_first_login": is_first_login,
        "id": user_id
    }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> dict:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: str = payload.get("user_id")
        
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user to verify they still exist
    user = data_store.get_user_by_email(email)
    if not user:
        raise credentials_exception
    
    # Get doctor ID if applicable
    doctor_id = None
    if role == 'doctor':
        doctor = data_store.get_doctor_by_email(email)
        if doctor:
            doctor_id = doctor.id
    
    return {
        "email": email,
        "role": role,
        "id": doctor_id or user_id,
        "user_id": user.id
    }


def require_roles(*roles: str):
    """Dependency to require specific roles for an endpoint."""
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker
