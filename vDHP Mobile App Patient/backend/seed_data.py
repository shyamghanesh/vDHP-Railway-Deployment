"""
Database Seed Script - Creates test data for development
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config.database import SessionLocal, engine, Base
from backend.models import User, Invitation, Patient, CarePlan, Task, Message, Vitals, VitalsType
from datetime import datetime, timedelta
import uuid
import bcrypt
import random

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Create test invitation
        invitation = Invitation(
            id=str(uuid.uuid4()),
            invitation_code="TEST2024",
            email="patient@test.com",
            phone="+1234567890",
            hospital_id="hospital-001",
            patient_mrn="MRN-001",
            is_used=False,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.add(invitation)
        
        # Create test user
        user = User(
            id=str(uuid.uuid4()),
            email="demo@vdhp.com",
            phone="+1234567890",
            hashed_password=hash_password("password123"),
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()
        
        # Create test patient
        patient = Patient(
            id=str(uuid.uuid4()),
            user_id=user.id,
            mrn="MRN-DEMO-001",
            first_name="John",
            last_name="Doe",
            date_of_birth=datetime(1960, 5, 15).date(),
            gender="male",
            preferred_language="en",
            accessibility_font_size="base"
        )
        db.add(patient)
        db.flush()
        
        # Create test care plan
        care_plan = CarePlan(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            title="Diabetes Management Plan",
            description="Comprehensive care plan for diabetes management",
            status="active",
            start_date=datetime.utcnow(),
            created_by="Dr. Smith"
        )
        db.add(care_plan)
        db.flush()
        
        # Create test tasks
        tasks = [
            Task(
                id=str(uuid.uuid4()),
                care_plan_id=care_plan.id,
                patient_id=patient.id,
                title="Check Blood Sugar",
                description="Check your blood sugar levels before breakfast",
                task_type="measurement",
                status="pending",
                priority="high",
                due_date=datetime.utcnow() + timedelta(days=1)
            ),
            Task(
                id=str(uuid.uuid4()),
                care_plan_id=care_plan.id,
                patient_id=patient.id,
                title="Take Medication",
                description="Take your prescribed medication with food",
                task_type="medication",
                status="pending",
                priority="high",
                due_date=datetime.utcnow() + timedelta(hours=8)
            ),
            Task(
                id=str(uuid.uuid4()),
                care_plan_id=care_plan.id,
                patient_id=patient.id,
                title="Exercise - 30 min walk",
                description="Take a 30-minute walk in the morning",
                task_type="activity",
                status="pending",
                priority="medium",
                due_date=datetime.utcnow() + timedelta(days=1)
            )
        ]
        for task in tasks:
            db.add(task)
        
        # Create test messages
        messages = [
            Message(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                sender_type="provider",
                sender_id="provider-001",
                sender_name="Dr. Sarah Smith",
                recipient_type="patient",
                recipient_id=patient.id,
                subject="Welcome to vDHP Care Compass",
                message_text="Welcome! I'm here to help you manage your health. Feel free to reach out anytime.",
                is_read=False
            ),
            Message(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                sender_type="provider",
                sender_id="provider-001",
                sender_name="Dr. Sarah Smith",
                recipient_type="patient",
                recipient_id=patient.id,
                subject="Lab Results Available",
                message_text="Your recent lab results are now available. Everything looks good!",
                is_read=False
            )
        ]
        for message in messages:
            db.add(message)
        
        # Create sample vitals data
        # Blood Pressure readings (last 7 days)
        for i in range(7):
            bp_vitals = Vitals(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                vitals_type=VitalsType.BLOOD_PRESSURE,
                systolic=random.randint(110, 140),
                diastolic=random.randint(70, 90),
                measured_at=datetime.utcnow() - timedelta(days=6-i)
            )
            db.add(bp_vitals)
        
        # Blood Sugar readings (last 7 days)
        for i in range(7):
            sugar_types = ['fasting', 'postprandial', 'random']
            sugar_vitals = Vitals(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                vitals_type=VitalsType.BLOOD_SUGAR,
                blood_sugar_value=round(random.uniform(80, 150), 1),
                blood_sugar_unit='mg/dL',
                blood_sugar_type=random.choice(sugar_types),
                measured_at=datetime.utcnow() - timedelta(days=6-i)
            )
            db.add(sugar_vitals)
        
        db.commit()
        
        print("Database seeded successfully!")
        print("\nTest Credentials:")
        print("=" * 50)
        print("\nINVITATION CODE:")
        print("   Code: TEST2024")
        print("\nDEMO ACCOUNT:")
        print("   Email: demo@vdhp.com")
        print("   Password: password123")
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
