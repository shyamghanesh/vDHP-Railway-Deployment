@echo off
echo ========================================
echo vDHP Care Compass - Startup Script
echo ========================================
echo.

echo [1/3] Checking Python dependencies...
pip install -r requirements.txt --quiet

echo [2/3] Seeding database with test data...
python backend\seed_data.py

echo [3/3] Starting backend server...
echo.
echo Backend will run on: http://localhost:8000
echo.
echo To start the frontend, open a new terminal and run:
echo   npx expo start
echo.
echo ========================================
echo.

python backend\main.py
