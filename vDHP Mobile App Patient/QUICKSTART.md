# Quick Start Guide - vDHP Care Compass

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt
```

### Step 2: Setup Database

```bash
# Seed the database with test data
python backend/seed_data.py
```

This creates:
- ✅ Test invitation code: **TEST2024**
- ✅ Demo account: **demo@vdhp.com** / **password123**
- ✅ Sample tasks, messages, and care plans

### Step 3: Start Backend

```bash
# Option 1: Use the startup script (Windows)
start.bat

# Option 2: Run manually
python backend/main.py
```

Backend runs on: http://localhost:8000

### Step 4: Start Frontend

Open a **new terminal** and run:

```bash
npx expo start
```

Then:
- Press **`a`** for Android emulator
- Press **`i`** for iOS simulator  
- Scan QR code with **Expo Go** app on your phone

## 🔐 Login Options

### Option 1: Demo Account (Fastest)
1. Click "Already have an account? Log In"
2. Enter:
   - Email: `demo@vdhp.com`
   - Password: `password123`
3. Click "Log In"

### Option 2: Register New Account
1. Click "Get Started with Invitation Code"
2. Enter invitation code: `TEST2024`
3. Fill in your details
4. Complete registration

## 📱 App Features

After logging in, you can:
- ✅ View your dashboard with health summary
- ✅ Check and complete tasks
- ✅ Send messages to your care team
- ✅ View and update your profile
- ✅ Review care plans

## 🔧 Troubleshooting

### Backend won't start?
```bash
# Make sure you're in the project directory
cd vDHP

# Install dependencies again
pip install -r requirements.txt

# Try running directly
python backend/main.py
```

### Frontend won't start?
```bash
# Clear cache and restart
npx expo start -c
```

### Can't login?
```bash
# Re-seed the database
python backend/seed_data.py
```

### Database errors?
```bash
# Delete the database and re-seed
del vdhp_care_compass.db
python backend/seed_data.py
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check the API documentation at http://localhost:8000/docs
- Explore the code in the `app/` and `backend/` directories

## 💡 Tips

- The app uses a **dark theme** optimized for elderly users
- All fonts are **large and readable** (18px base)
- The UI is **touch-friendly** with 64px minimum touch targets
- Data is stored locally with **AsyncStorage** for offline access

## 🆘 Need Help?

If you encounter any issues:
1. Check the console for error messages
2. Verify backend is running on port 8000
3. Ensure database is seeded with test data
4. Try clearing cache: `npx expo start -c`

Happy coding! 🎉
