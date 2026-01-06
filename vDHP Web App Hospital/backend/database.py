"""
Database Configuration for vDHP Hospital Web App
Uses shared configuration for unified database access with Patient App
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_database_url() -> str:
    """
    Get database URL from environment with automatic format fixing.
    Handles various cloud provider URL formats (Railway, Heroku, Render).
    """
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        # Default to SQLite for local development
        return "sqlite:///./vdhp_care_compass.db"
    
    # Fix for cloud providers: They may provide 'postgres://' but SQLAlchemy needs 'postgresql://'
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
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
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
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
    })
    
    # SSL configuration for Railway/Render/Heroku
    if IS_PRODUCTION or any(x in DATABASE_URL.lower() for x in ["railway", "render", "heroku"]):
        ssl_mode = os.getenv("DB_SSL_MODE", "require")
        if ssl_mode != "disable":
            engine_kwargs["connect_args"] = {"sslmode": ssl_mode}

# Create engine
engine = create_engine(DATABASE_URL, **engine_kwargs)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routers to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """
    Initialize database tables.
    In production, Flyway migrations handle this instead.
    """
    Base.metadata.create_all(bind=engine)


def check_database_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
