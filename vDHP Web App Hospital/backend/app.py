"""
Step 6: Main Application Setup
================================
This is the main FastAPI application file that brings everything together.

It:
1. Creates the FastAPI app instance
2. Sets up CORS (so frontend can talk to backend)
3. Includes all our routers (patients, doctors, providers)
4. Keeps the existing prediction endpoint

When both doctor and provider portals make requests to this API,
they're both using the same data store, so they stay perfectly in sync!
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import joblib
import numpy as np
import re
import sys
import os

# Import our routers
try:
    from backend.routers import patients, doctors, providers, auth, consent
    from backend.database import engine, Base
    import backend.sql_models as sql_models
except ImportError:
    from routers import patients, doctors, providers, auth, consent
    from database import engine, Base
    import sql_models

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Create the FastAPI application
app = FastAPI(
    title='CareAI Backend',
    description='Backend API for Doctor and Provider Portals - Keeps both portals in sync!',
    version='1.0.0'
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the frontend (running on different port) to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    allow_origin_regex=r'http://(localhost|127\.0\.0\.1):\d+',  # Allow any localhost/127.0.0.1 port
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ===== INCLUDE ROUTERS =====
# This connects all our routers to the main app
# Now all endpoints from these routers are available!

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

# ===== EXISTING PREDICTION ENDPOINT (kept for backward compatibility) =====
class VitalsIn(BaseModel):
	heartRate: float = Field(..., ge=0)
	systolic: float = Field(..., ge=0)
	diastolic: float = Field(..., ge=0)
	temperature: float = Field(..., ge=80, le=120)
	oxygenSat: float = Field(..., ge=0, le=100)

class PredictionOut(BaseModel):
	risk: str


def load_bundle():
    try:
        bundle_path = Path(__file__).parent / 'model.pkl'
        if not bundle_path.exists():
            print("WARNING: model.pkl not found")
            return None
        return joblib.load(bundle_path)
    except Exception as e:
        print(f"ERROR: Failed to load model bundle: {e}")
        return None

bundle = load_bundle()
model = bundle['model'] if bundle else None
feature_names = bundle['feature_names'] if bundle else ['HeartRate_bpm','BP_Systolic','BP_Diastolic','Temperature_F','O2_Sat']


@app.get('/')
def root():
    """Root endpoint for health check uptime monitors"""
    return {'status': 'ok', 'service': 'doctor-backend'}

@app.get('/health')
def health():
    """Health check endpoint"""
    return {'status': 'ok'}


@app.post('/predict', response_model=PredictionOut)
def predict(v: VitalsIn) -> PredictionOut:
	"""
	Predict patient risk level from vitals (existing ML endpoint)
	
	This is kept for backward compatibility with the existing frontend.
	"""
	# Require trained model to be present
	if model is None:
		raise HTTPException(status_code=503, detail='Model not loaded. Please run backend/train.py to generate backend/model.pkl.')

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
