from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from data_store import data_store
from models import DoctorCreate
import uuid
import os

router = APIRouter()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-keep-it-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # 'doctor', 'patient', 'provider'

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    is_first_login: bool = False
    id: Optional[str] = None # User ID or Doctor ID

# Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Routes
@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
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
            specialty="General", # Default, can be updated later
            email=user.email
        )
        # We need to ensure the ID matches or link them. 
        # For simplicity, we'll let create_doctor generate its own ID, 
        # but in a real app we'd link user_id to practitioner_id.
        data_store.create_doctor(doctor_create)

    # Create Access Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "username": user.name}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verify User
    user = data_store.get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Access Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Update last login and check if first time
    is_first_login = data_store.update_user_last_login(user.email)
    
    # Get name and ID
    name = user.email.split("@")[0] # Default fallback
    user_id = user.id
    
    if user.role == 'doctor':
        doctor = data_store.get_doctor_by_email(user.email)
        if doctor:
            name = doctor.name
            user_id = doctor.id
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": name,
        "is_first_login": is_first_login,
        "id": user_id
    }
