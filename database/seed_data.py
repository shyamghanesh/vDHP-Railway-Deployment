"""
Database Seed Script for vDHP Platform
Creates test users, sample patients, and demo data
Run this after migrations to set up initial data
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid

# Add paths
sys.path.insert(0, str(Path(__file__).parent))

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Password hashing (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_database_url():
    """Get database URL from environment."""
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        print("❌ DATABASE_URL not set!")
        sys.exit(1)
    
    # Fix URL format
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    if database_url.startswith("postgresql://") and "+psycopg2" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    return database_url


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def seed_database():
    """Seed the database with initial data."""
    print("🌱 Starting database seed...")
    
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    # Generate password hashes
    admin_hash = hash_password("Admin@123")
    doctor_hash = hash_password("Doctor@123")
    provider_hash = hash_password("Provider@123")
    patient_hash = hash_password("password123")
    
    with engine.connect() as conn:
        # Check if data already exists
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE email = 'admin@vdhp.com'"))
        if result.scalar() > 0:
            print("⚠️ Seed data already exists. Skipping...")
            return
        
        print("📝 Creating users...")
        
        # Create Admin
        conn.execute(text("""
            INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
            VALUES (:id, :email, :name, :hash, 'admin', TRUE, TRUE)
        """), {"id": "admin-001-uuid-xxxx", "email": "admin@vdhp.com", "name": "System Admin", "hash": admin_hash})
        
        # Create Doctor
        conn.execute(text("""
            INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
            VALUES (:id, :email, :name, :hash, 'doctor', TRUE, TRUE)
        """), {"id": "doctor-001-uuid-xxxx", "email": "doctor@vdhp.com", "name": "Dr. Sarah Johnson", "hash": doctor_hash})
        
        # Create Provider
        conn.execute(text("""
            INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
            VALUES (:id, :email, :name, :hash, 'provider', TRUE, TRUE)
        """), {"id": "provider-001-uuid-xxxx", "email": "provider@vdhp.com", "name": "City General Hospital", "hash": provider_hash})
        
        # Create Patient User
        conn.execute(text("""
            INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
            VALUES (:id, :email, :name, :hash, 'patient', TRUE, TRUE)
        """), {"id": "patient-user-001-uuid", "email": "demo@vdhp.com", "name": "John Doe", "hash": patient_hash})
        
        print("🎫 Creating invitations...")
        
        # Create Test Invitations
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        conn.execute(text("""
            INSERT INTO invitations (id, invitation_code, email, hospital_id, patient_mrn, expires_at, created_by)
            VALUES (:id, :code, :email, :hospital, :mrn, :expires, :created)
        """), {
            "id": "invite-001-uuid-xxxx",
            "code": "TEST2024",
            "email": "newpatient@example.com",
            "hospital": "hospital-001",
            "mrn": "MRN-001",
            "expires": expires_at,
            "created": "admin-001-uuid-xxxx"
        })
        
        conn.execute(text("""
            INSERT INTO invitations (id, invitation_code, hospital_id, patient_mrn, expires_at, created_by)
            VALUES (:id, :code, :hospital, :mrn, :expires, :created)
        """), {
            "id": "invite-002-uuid-xxxx",
            "code": "WELCOME2024",
            "hospital": "hospital-001",
            "mrn": "MRN-002",
            "expires": expires_at,
            "created": "doctor-001-uuid-xxxx"
        })
        
        print("👤 Creating demo patient...")
        
        # Create Patient Profile
        conn.execute(text("""
            INSERT INTO patients (id, user_id, mrn, first_name, last_name, date_of_birth, gender, city, state, country)
            VALUES (:id, :user_id, :mrn, :first, :last, :dob, :gender, :city, :state, :country)
        """), {
            "id": "patient-001-uuid-xxxx",
            "user_id": "patient-user-001-uuid",
            "mrn": "MRN-DEMO-001",
            "first": "John",
            "last": "Doe",
            "dob": "1965-05-15",
            "gender": "male",
            "city": "New York",
            "state": "NY",
            "country": "United States"
        })
        
        print("📋 Creating care plan...")
        
        # Create Care Plan
        conn.execute(text("""
            INSERT INTO care_plans (id, patient_id, title, description, status, start_date, created_by)
            VALUES (:id, :patient, :title, :desc, 'active', :start, :created)
        """), {
            "id": "careplan-001-uuid-xxxx",
            "patient": "patient-001-uuid-xxxx",
            "title": "Diabetes Management Plan",
            "desc": "Comprehensive care plan for Type 2 Diabetes management",
            "start": datetime.now(timezone.utc),
            "created": "doctor-001-uuid-xxxx"
        })
        
        print("✅ Creating tasks...")
        
        # Create Tasks
        due_date = datetime.now(timezone.utc) + timedelta(days=1)
        
        tasks = [
            ("task-001-uuid-xxxxx", "Take morning medication", "medication", "high"),
            ("task-002-uuid-xxxxx", "Log blood sugar", "questionnaire", "high"),
            ("task-003-uuid-xxxxx", "30-minute walk", "exercise", "medium"),
        ]
        
        for task_id, title, task_type, priority in tasks:
            conn.execute(text("""
                INSERT INTO tasks (id, care_plan_id, patient_id, title, task_type, status, priority, due_date)
                VALUES (:id, :care_plan, :patient, :title, :type, 'pending', :priority, :due)
            """), {
                "id": task_id,
                "care_plan": "careplan-001-uuid-xxxx",
                "patient": "patient-001-uuid-xxxx",
                "title": title,
                "type": task_type,
                "priority": priority,
                "due": due_date
            })
        
        print("💓 Creating vitals...")
        
        # Create Sample Vitals
        measured_at = datetime.now(timezone.utc) - timedelta(hours=1)
        
        conn.execute(text("""
            INSERT INTO vitals (id, patient_id, vitals_type, systolic, diastolic, measured_at)
            VALUES (:id, :patient, 'blood_pressure', 128, 82, :measured)
        """), {"id": str(uuid.uuid4()), "patient": "patient-001-uuid-xxxx", "measured": measured_at})
        
        conn.execute(text("""
            INSERT INTO vitals (id, patient_id, vitals_type, value, unit, measured_at)
            VALUES (:id, :patient, 'heart_rate', 72, 'bpm', :measured)
        """), {"id": str(uuid.uuid4()), "patient": "patient-001-uuid-xxxx", "measured": measured_at})
        
        print("💬 Creating welcome message...")
        
        # Create Welcome Message
        conn.execute(text("""
            INSERT INTO messages (id, patient_id, sender_type, sender_id, sender_name, recipient_type, recipient_id, subject, message_text)
            VALUES (:id, :patient, 'doctor', :sender, :sender_name, 'patient', :patient, :subject, :message)
        """), {
            "id": str(uuid.uuid4()),
            "patient": "patient-001-uuid-xxxx",
            "sender": "doctor-001-uuid-xxxx",
            "sender_name": "Dr. Sarah Johnson",
            "subject": "Welcome to vDHP Care Compass",
            "message": "Hello John! Welcome to vDHP Care Compass. I am Dr. Sarah Johnson and I will be overseeing your care plan."
        })
        
        conn.commit()
        
    print("✅ Database seeded successfully!")
    print("\n📋 Test Credentials:")
    print("  Admin:    admin@vdhp.com / Admin@123")
    print("  Doctor:   doctor@vdhp.com / Doctor@123")
    print("  Provider: provider@vdhp.com / Provider@123")
    print("  Patient:  demo@vdhp.com / password123")
    print("\n🎫 Invitation Codes: TEST2024, WELCOME2024")


if __name__ == "__main__":
    seed_database()
