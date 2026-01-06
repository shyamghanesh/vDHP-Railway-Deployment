"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from datetime import datetime

class InvitationValidateRequest(BaseModel):
    invitation_code: str = Field(..., min_length=6, max_length=100)

class InvitationValidateResponse(BaseModel):
    valid: bool
    message: str
    invitation_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class SimpleRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=10, pattern="^[0-9]{10}$")
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'SimpleRegisterRequest':
        pw1 = self.password
        pw2 = self.confirm_password
        if pw1 is not None and pw2 is not None and pw1 != pw2:
            raise ValueError('passwords do not match')
        return self

class RegisterRequest(BaseModel):
    invitation_code: Optional[str] = Field(None, min_length=6)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    patient_id: Optional[str] = None
    requires_consent: bool = False

class TwoFactorRequest(BaseModel):
    user_id: str
    code: str
