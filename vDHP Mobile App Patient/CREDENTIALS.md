# 🔐 Test Credentials - vDHP Care Compass

## Quick Access

After running `python backend/seed_data.py`, use these credentials to access the app:

---

## 🎫 Invitation Code

Use this code to **register a new account**:

```
TEST2024
```

**How to use:**
1. Open the app
2. Click "Get Started with Invitation Code"
3. Enter: `TEST2024`
4. Complete the registration form
5. Create your account

---

## 👤 Demo Account

Use this account to **login immediately**:

```
Email:    demo@vdhp.com
Password: password123
```

**How to use:**
1. Open the app
2. Click "Already have an account? Log In"
3. Enter the email and password above
4. Click "Log In"

---

## 📊 What's Included

The demo account comes pre-loaded with:

✅ **Patient Profile**
- Name: John Doe
- MRN: MRN-DEMO-001
- Date of Birth: May 15, 1960

✅ **Care Plan**
- Diabetes Management Plan
- Created by Dr. Smith

✅ **Tasks** (3 pending)
- Check Blood Sugar (High Priority)
- Take Medication (High Priority)
- Exercise - 30 min walk (Medium Priority)

✅ **Messages** (2 unread)
- Welcome message from Dr. Sarah Smith
- Lab results notification

---

## 🔄 Reset Data

To reset the database and recreate test data:

```bash
# Delete the database
del vdhp_care_compass.db

# Re-seed with fresh data
python backend/seed_data.py
```

---

## 🔒 Security Notes

⚠️ **Important:** These are TEST credentials only!

- Never use these credentials in production
- Change the JWT secret key in `.env` for production
- Use strong passwords for real accounts
- Enable 2FA for production environments

---

## 📝 Creating Additional Test Users

To create more test users, you can:

1. **Use the invitation code** to register new accounts through the app
2. **Modify** `backend/seed_data.py` to add more test data
3. **Use the API** directly at http://localhost:8000/docs

---

## 🆘 Troubleshooting

**Can't login with demo account?**
- Make sure you ran `python backend/seed_data.py`
- Check that the backend is running on port 8000
- Verify the database file exists: `vdhp_care_compass.db`

**Invitation code not working?**
- Re-run the seed script: `python backend/seed_data.py`
- Check the invitation hasn't expired (30 days from creation)
- Verify the code is exactly: `TEST2024` (case-sensitive)

---

## 📞 Support

For issues or questions, check:
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [README.md](README.md) - Full documentation
- Backend API docs: http://localhost:8000/docs
