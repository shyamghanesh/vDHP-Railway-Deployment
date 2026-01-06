"""
Setup Verification Script
Checks if all components are properly configured
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: Found")
        return True
    else:
        print(f"❌ {description}: Missing")
        return False

def check_python_packages():
    """Check if required Python packages are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'passlib',
        'jose',
    ]
    
    print("\n📦 Checking Python packages...")
    all_installed = True
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}: Installed")
        except ImportError:
            print(f"❌ {package}: Not installed")
            all_installed = False
    
    return all_installed

def check_database():
    """Check if database exists and has data"""
    db_path = "vdhp_care_compass.db"
    
    if not os.path.exists(db_path):
        print(f"\n⚠️  Database not found: {db_path}")
        print("   Run: python backend/seed_data.py")
        return False
    
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for users
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        # Check for invitations
        cursor.execute("SELECT COUNT(*) FROM invitations")
        invitation_count = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"\n✅ Database found with:")
        print(f"   - {user_count} user(s)")
        print(f"   - {invitation_count} invitation(s)")
        
        if user_count == 0 or invitation_count == 0:
            print("   ⚠️  Database seems empty. Run: python backend/seed_data.py")
            return False
        
        return True
        
    except Exception as e:
        print(f"\n❌ Database error: {e}")
        return False

def main():
    print("=" * 60)
    print("vDHP Care Compass - Setup Verification")
    print("=" * 60)
    
    checks = []
    
    # Check critical files
    print("\n📁 Checking project files...")
    checks.append(check_file_exists("backend/main.py", "Backend main"))
    checks.append(check_file_exists("backend/seed_data.py", "Seed script"))
    checks.append(check_file_exists("app/_layout.tsx", "App layout"))
    checks.append(check_file_exists("app/index.tsx", "App index"))
    checks.append(check_file_exists("services/api.ts", "API service"))
    checks.append(check_file_exists(".env", "Environment file"))
    checks.append(check_file_exists("requirements.txt", "Requirements file"))
    checks.append(check_file_exists("package.json", "Package.json"))
    
    # Check Python packages
    checks.append(check_python_packages())
    
    # Check database
    checks.append(check_database())
    
    # Summary
    print("\n" + "=" * 60)
    if all(checks):
        print("✅ All checks passed! You're ready to go!")
        print("\nNext steps:")
        print("1. Start backend:  python backend/main.py")
        print("2. Start frontend: npx expo start")
        print("\nTest credentials:")
        print("   Email: demo@vdhp.com")
        print("   Password: password123")
        print("   Invitation Code: TEST2024")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nQuick fix:")
        print("1. Install Python packages: pip install -r requirements.txt")
        print("2. Install Node packages: npm install")
        print("3. Seed database: python backend/seed_data.py")
    print("=" * 60)

if __name__ == "__main__":
    main()
