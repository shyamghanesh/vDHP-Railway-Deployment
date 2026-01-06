from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import sql_models
import os

# Use an in-memory SQLite DB for testing creation logic (ignore the postgres specific types if possible, or expect failure)
# But wait, we are using JSONB which is Postgres specific.
# So we need to test with the Postgres logic or mock it.
# Actually, the user's error is likely "AttributeError" or similar during Column initialization.

# Let's try to initialize the specific dialect if possible, or just see if the declarative system crashes.
try:
    print("Creating all tables...")
    # forcing metadata access
    for name, table in Base.metadata.tables.items():
        print(f"Found table: {name}")
    print("Definitions seem valid.")
except Exception as e:
    print(f"CRASHED: {e}")
    import traceback
    traceback.print_exc()
