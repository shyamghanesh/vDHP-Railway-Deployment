"""
Shared Database Configuration for vDHP Platform
================================================
This module provides unified database connection handling for both
Mobile App Patient and Hospital Web App backends.

Features:
- PostgreSQL with SSL support for Railway deployment
- Connection pooling for production performance
- Automatic URL format fixing for various cloud providers
- SQLAlchemy ORM integration
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def get_database_url() -> str:
    """
    Get database URL from environment with automatic format fixing.
    Handles various cloud provider URL formats.
    """
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        # Default to SQLite for local development without DATABASE_URL
        return "sqlite:///./vdhp_care_compass.db"
    
    # Fix for Heroku/Railway: They may provide 'postgres://' but SQLAlchemy needs 'postgresql://'
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    # Ensure we use psycopg2 driver for PostgreSQL
    if database_url.startswith("postgresql://") and "+psycopg2" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    return database_url


DATABASE_URL = get_database_url()
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_PRODUCTION = os.getenv("RAILWAY_ENVIRONMENT", "").lower() == "production" or \
                os.getenv("ENVIRONMENT", "").lower() == "production"

# Engine configuration
engine_kwargs = {
    "pool_pre_ping": True,  # Check connection health before use
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",  # SQL logging
}

if IS_SQLITE:
    # SQLite-specific settings
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL settings for production
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),  # 30 minutes
    })
    
    # SSL configuration for Railway
    if IS_PRODUCTION or "railway" in DATABASE_URL.lower():
        engine_kwargs["connect_args"] = {
            "sslmode": os.getenv("DB_SSL_MODE", "require")
        }

# Create engine
engine = create_engine(DATABASE_URL, **engine_kwargs)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI to get database session.
    Ensures proper session cleanup after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """
    Initialize database tables.
    In production, use Flyway migrations instead.
    """
    Base.metadata.create_all(bind=engine)


def check_database_connection() -> bool:
    """
    Check if database connection is healthy.
    Returns True if connection successful, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False


# Connection event listeners for debugging
if os.getenv("DB_DEBUG", "false").lower() == "true":
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_connection, connection_record):
        print(f"Database connection established: {connection_record}")
    
    @event.listens_for(engine, "checkout")
    def receive_checkout(dbapi_connection, connection_record, connection_proxy):
        print(f"Connection checked out from pool")
