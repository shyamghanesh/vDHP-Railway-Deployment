"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Load environment variables from .env if present
try:
	from dotenv import load_dotenv
	load_dotenv()
except Exception:
	# dotenv is optional; ignore if unavailable
	pass

DATABASE_URL = os.getenv(
	"DATABASE_URL",
	"postgresql+psycopg2://vdhp_user:StrongPassword123!@localhost:5432/vdhp"
)

# Fix for Heroku: SQLAlchemy 1.4+ requires postgresql://, but Heroku might provide postgres://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

# Configure engine with sane defaults for Postgres; keep sqlite-specific args
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
    pool_size=5 if not is_sqlite else None,
    max_overflow=10 if not is_sqlite else None
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
