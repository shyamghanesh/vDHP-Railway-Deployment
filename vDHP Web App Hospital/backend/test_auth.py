from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    hashed = pwd_context.hash("testpassword")
    print(f"Hash success: {hashed}")
    verified = pwd_context.verify("testpassword", hashed)
    print(f"Verify success: {verified}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
