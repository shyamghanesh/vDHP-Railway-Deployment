"""
vDHP Hospital Web App - Backend API Server
FastAPI application with FHIR compliance and ML prediction
Railway-ready with shared database
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import numpy as np
import joblib

# Import routers and database
try:
    from backend.routers import patients, doctors, providers, auth, consent
    from backend.database import engine, Base, check_database_connection
    import backend.sql_models as sql_models
except ImportError:
    from routers import patients, doctors, providers, auth, consent
    from database import engine, Base, check_database_connection
    import sql_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("🚀 Starting vDHP Hospital Web App Backend...")
    
    # Check database connection
    if check_database_connection():
        print("✅ Database connection successful")
    else:
        print("⚠️ Database connection failed - tables may not exist yet")
    
    # Create tables if they don't exist (for development)
    if os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified")
    
    # Load ML model
    load_ml_model()
    
    yield
    
    # Shutdown
    print("👋 Shutting down vDHP Hospital Web App Backend...")


# Create the FastAPI application
app = FastAPI(
    title="vDHP Hospital Web App - CareAI Backend",
    description="Backend API for Doctor and Provider Portals with ML risk prediction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

# Add localhost origins for development
default_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if cors_origins:
    all_origins = list(set(cors_origins + default_origins))
else:
    all_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions gracefully."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An unexpected error occurred"
        }
    )


# ===== INCLUDE ROUTERS =====

# Auth endpoints
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Patient endpoints (shared by both portals)
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])

# Doctor portal endpoints
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors"])

# Provider portal endpoints
app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])

# Consent Workflow endpoints
app.include_router(consent.router, prefix="/api/consent", tags=["Consent Workflows"])


# ===== ML PREDICTION ENDPOINT =====

class VitalsIn(BaseModel):
    heartRate: float = Field(..., ge=0)
    systolic: float = Field(..., ge=0)
    diastolic: float = Field(..., ge=0)
    temperature: float = Field(..., ge=80, le=120)
    oxygenSat: float = Field(..., ge=0, le=100)


class PredictionOut(BaseModel):
    risk: str


# ML Model globals
model = None
feature_names = ['HeartRate_bpm', 'BP_Systolic', 'BP_Diastolic', 'Temperature_F', 'O2_Sat']


def load_ml_model():
    """Load the ML model for risk prediction."""
    global model
    try:
        model_path = Path(__file__).parent / 'model.pkl'
        if model_path.exists():
            bundle = joblib.load(model_path)
            model = bundle.get('model')
            print("✅ ML model loaded successfully")
        else:
            print("⚠️ ML model not found - using rule-based fallback")
    except Exception as e:
        print(f"⚠️ Failed to load ML model: {e}")


def rule_based_risk(vitals: VitalsIn) -> str:
    """Fallback rule-based risk assessment when ML model is unavailable."""
    risk_score = 0
    
    # Heart rate assessment
    if vitals.heartRate < 50 or vitals.heartRate > 100:
        risk_score += 2
    elif vitals.heartRate < 60 or vitals.heartRate > 90:
        risk_score += 1
    
    # Blood pressure assessment
    if vitals.systolic > 180 or vitals.diastolic > 120:
        risk_score += 3
    elif vitals.systolic > 140 or vitals.diastolic > 90:
        risk_score += 2
    elif vitals.systolic < 90 or vitals.diastolic < 60:
        risk_score += 2
    
    # Temperature assessment
    if vitals.temperature > 103 or vitals.temperature < 95:
        risk_score += 3
    elif vitals.temperature > 100.4 or vitals.temperature < 97:
        risk_score += 1
    
    # Oxygen saturation assessment
    if vitals.oxygenSat < 90:
        risk_score += 3
    elif vitals.oxygenSat < 94:
        risk_score += 2
    elif vitals.oxygenSat < 96:
        risk_score += 1
    
    if risk_score >= 5:
        return "high"
    elif risk_score >= 2:
        return "medium"
    return "low"


@app.post('/predict', response_model=PredictionOut)
def predict(v: VitalsIn) -> PredictionOut:
    """Predict patient risk level from vitals using ML model or rule-based fallback."""
    if model is None:
        # Use rule-based fallback
        risk = rule_based_risk(v)
        return PredictionOut(risk=risk)
    
    try:
        data = {
            'HeartRate_bpm': v.heartRate,
            'BP_Systolic': v.systolic,
            'BP_Diastolic': v.diastolic,
            'Temperature_F': v.temperature,
            'O2_Sat': v.oxygenSat,
        }
        x = np.array([[data[name] for name in feature_names]], dtype=float)
        pred = model.predict(x)[0]
        return PredictionOut(risk=str(pred))
    except Exception as e:
        # Fallback to rule-based on error
        print(f"ML prediction error: {e}")
        return PredictionOut(risk=rule_based_risk(v))


# ===== HEALTH ENDPOINTS =====

@app.get('/')
def root():
    """Root endpoint for health check uptime monitors."""
    return {
        "app": "vDHP Hospital Web App - CareAI Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get('/health')
def health():
    """Health check endpoint for Railway/container orchestration."""
    db_healthy = check_database_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "ml_model": "loaded" if model else "not_loaded",
        "service": "hospital-backend"
    }


@app.get('/ready')
def readiness():
    """Readiness check for Kubernetes/Railway."""
    if check_database_connection():
        return {"ready": True}
    return JSONResponse(status_code=503, content={"ready": False, "reason": "Database not available"})


# ===== MAIN ENTRY POINT =====

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
