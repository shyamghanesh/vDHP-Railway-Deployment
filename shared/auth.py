"""
Shared Authentication Utilities for vDHP Platform
==================================================
Provides unified authentication handling for both
Mobile App Patient and Hospital Web App backends.

Features:
- Unified JWT token generation/validation
- Bcrypt password hashing (standardized across both apps)
- Role-based access control
- HIPAA-compliant security settings
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================================
# CONFIGURATION
# ============================================================================

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_REQUIRED")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password Settings - Using bcrypt (HIPAA compliant)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Increased rounds for better security
)

# Security schemes
security_bearer = HTTPBearer(auto_error=True)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

# ============================================================================
# PASSWORD UTILITIES
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# ============================================================================
# JWT TOKEN UTILITIES
# ============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
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


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dict if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """
    Verify a JWT token and return its payload.
    
    Args:
        token: JWT token string
        expected_type: Expected token type ("access" or "refresh")
        
    Returns:
        Decoded payload dict
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        token_type = payload.get("type", "access")
        if token_type != expected_type:
            raise credentials_exception
        
        # Verify required fields
        if not payload.get("sub") and not payload.get("user_id"):
            raise credentials_exception
            
        return payload
        
    except JWTError:
        raise credentials_exception


# ============================================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================================

class RoleChecker:
    """
    Dependency class for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user = Depends(RoleChecker(["admin"]))):
            ...
    """
    
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    def __call__(self, token: str) -> bool:
        payload = decode_token(token)
        if not payload:
            return False
        
        user_role = payload.get("role", "")
        return user_role in self.allowed_roles


def require_roles(*roles: str):
    """
    Decorator to require specific roles for an endpoint.
    
    Args:
        *roles: Allowed role names
        
    Returns:
        Dependency function for FastAPI
    """
    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
    ) -> Dict[str, Any]:
        payload = verify_token(credentials.credentials)
        user_role = payload.get("role", "")
        
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        
        return payload
    
    return role_checker


# ============================================================================
# COMMON DEPENDENCIES
# ============================================================================

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    Extract current user info from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        User payload dict from token
    """
    return verify_token(credentials.credentials)


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, None otherwise.
    
    Args:
        token: Optional JWT token
        
    Returns:
        User payload dict if authenticated, None otherwise
    """
    if not token:
        return None
    return decode_token(token)
