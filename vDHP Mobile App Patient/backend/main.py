"""
vDHP Care Compass - Backend API Server
FastAPI application with FHIR compliance
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.config.database import Base, engine
from backend.routers import auth, patients, care_plans, messages, vitals

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="vDHP Care Compass API",
    description="Patient mobile app backend with FHIR standards",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(care_plans.router)
app.include_router(messages.router)
app.include_router(vitals.router)

@app.get("/")
async def root():
    return {
        "app": "vDHP Care Compass",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
