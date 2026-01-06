"""
vDHP Care Compass - Backend API Server
FastAPI application with FHIR compliance
Railway-ready with shared database
"""

import sys
import os
from pathlib import Path

# Add parent directory and shared module to path
sys.path.insert(0, str(Path(__file__).parent.parent))
shared_path = Path(__file__).parent.parent.parent / "shared"
if shared_path.exists():
    sys.path.insert(0, str(shared_path))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from backend.config.database import Base, engine, check_database_connection
from backend.routers import auth, patients, care_plans, messages, vitals


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("🚀 Starting vDHP Patient Mobile App Backend...")
    
    # Check database connection
    if check_database_connection():
        print("✅ Database connection successful")
    else:
        print("⚠️ Database connection failed - tables may not exist yet")
    
    # Create tables if they don't exist (for development)
    # In production, Flyway migrations handle this
    if os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified")
    
    yield
    
    # Shutdown
    print("👋 Shutting down vDHP Patient Mobile App Backend...")


app = FastAPI(
    title="vDHP Care Compass - Patient API",
    description="Patient mobile app backend with FHIR standards for vDHP platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
# Get allowed origins from environment or use defaults
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
cors_origins = [origin.strip() for origin in cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
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


# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(care_plans.router, prefix="/care-plans", tags=["Care Plans"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(vitals.router, prefix="/vitals", tags=["Vitals"])


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "app": "vDHP Care Compass - Patient API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway/container orchestration."""
    db_healthy = check_database_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "service": "patient-backend"
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Railway."""
    if check_database_connection():
        return {"ready": True}
    return JSONResponse(status_code=503, content={"ready": False, "reason": "Database not available"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
