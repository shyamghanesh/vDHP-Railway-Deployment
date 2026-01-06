"""
Backend Verification Script
Tests all critical backend functionality
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

def verify_imports():
    """Verify all imports work"""
    print("[*] Checking imports...")
    try:
        from backend.config.database import Base, engine, get_db
        from backend.config.auth import get_current_user, SECRET_KEY
        from backend.models import User, Patient, CarePlan, Task, Message, Invitation
        from backend.routers import auth, patients, care_plans, messages
        from backend.main import app
        print("  [PASS] All imports successful")
        return True
    except Exception as e:
        print(f"  [FAIL] Import error: {e}")
        return False

def verify_database():
    """Verify database connection"""
    print("\n[*] Checking database...")
    try:
        from backend.config.database import SessionLocal, engine
        from backend.models import User
        
        db = SessionLocal()
        user_count = db.query(User).count()
        db.close()
        
        print(f"  [PASS] Database connected ({user_count} users found)")
        return True
    except Exception as e:
        print(f"  [FAIL] Database error: {e}")
        return False

def verify_test_data():
    """Verify test data exists"""
    print("\n[*] Checking test data...")
    try:
        from backend.config.database import SessionLocal
        from backend.models import User, Invitation, Patient, Task, Message
        
        db = SessionLocal()
        
        # Check demo user
        demo_user = db.query(User).filter(User.email == "demo@vdhp.com").first()
        if not demo_user:
            print("  [WARN] Demo user not found. Run: python backend/seed_data.py")
            return False
        
        # Check invitation
        invitation = db.query(Invitation).filter(Invitation.invitation_code == "TEST2024").first()
        if not invitation:
            print("  [WARN] Test invitation not found")
            return False
        
        # Check patient
        patient = db.query(Patient).filter(Patient.user_id == demo_user.id).first()
        if not patient:
            print("  [WARN] Demo patient not found")
            return False
        
        # Check tasks
        task_count = db.query(Task).filter(Task.patient_id == patient.id).count()
        
        # Check messages
        message_count = db.query(Message).filter(Message.patient_id == patient.id).count()
        
        db.close()
        
        print(f"  [PASS] Demo user: demo@vdhp.com")
        print(f"  [PASS] Invitation: TEST2024")
        print(f"  [PASS] Patient: {patient.first_name} {patient.last_name}")
        print(f"  [PASS] Tasks: {task_count}")
        print(f"  [PASS] Messages: {message_count}")
        return True
    except Exception as e:
        print(f"  [FAIL] Test data error: {e}")
        return False

def verify_api_routes():
    """Verify API routes are registered"""
    print("\n[*] Checking API routes...")
    try:
        from backend.main import app
        
        routes = [route.path for route in app.routes]
        
        required_routes = [
            "/auth/validate-invitation",
            "/auth/register",
            "/auth/login",
            "/patients/me",
            "/care-plans",
            "/care-plans/tasks",
            "/messages"
        ]
        
        missing = []
        for route in required_routes:
            if not any(route in r for r in routes):
                missing.append(route)
        
        if missing:
            print(f"  [WARN] Missing routes: {missing}")
            return False
        
        print(f"  [PASS] All {len(required_routes)} required routes registered")
        return True
    except Exception as e:
        print(f"  [FAIL] Route error: {e}")
        return False

def main():
    print("=" * 60)
    print("vDHP Care Compass - Backend Verification")
    print("=" * 60)
    
    results = []
    results.append(("Imports", verify_imports()))
    results.append(("Database", verify_database()))
    results.append(("Test Data", verify_test_data()))
    results.append(("API Routes", verify_api_routes()))
    
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    for name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{name:.<40} {status}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("[SUCCESS] ALL CHECKS PASSED - Backend is ready!")
        print("\nTo start the server:")
        print("  python backend/main.py")
        print("\nAPI will be available at: http://localhost:8001")
        print("API docs: http://localhost:8001/docs")
    else:
        print("[ERROR] SOME CHECKS FAILED - Please fix the issues above")
        print("\nIf test data is missing, run:")
        print("  python backend/seed_data.py")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
