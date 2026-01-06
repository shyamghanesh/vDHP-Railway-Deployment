import uvicorn
import sys
import os

# Ensure root is in sys.path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    # Use backend.app:app string to let uvicorn import it
    # We disable reload to avoid subprocess issues for now, but could enable it if needed
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=False)
