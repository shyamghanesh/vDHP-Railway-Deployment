# Android SDK Setup Guide

## Option 1: Install Android Studio (Recommended)

### Step 1: Download Android Studio
1. Go to: https://developer.android.com/studio
2. Download Android Studio for Windows
3. Run the installer

### Step 2: Install Android SDK
1. Open Android Studio
2. Go to: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Install:
   - ✅ Android SDK Platform (latest version)
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
4. Note the SDK Location (e.g., `C:\Users\Shyam\AppData\Local\Android\Sdk`)

### Step 3: Set Environment Variables
1. Press `Win + X` → System → Advanced system settings
2. Click **Environment Variables**
3. Under **User variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\Shyam\AppData\Local\Android\Sdk`
4. Edit **Path** variable, add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
5. Click **OK** and restart terminal

### Step 4: Create Virtual Device
1. In Android Studio: **Tools → Device Manager**
2. Click **Create Device**
3. Select a phone (e.g., Pixel 5)
4. Download a system image (e.g., Android 13)
5. Click **Finish**

### Step 5: Test
```bash
# Restart terminal, then run:
adb version

# Should show: Android Debug Bridge version x.x.x
```

---

## Option 2: Install SDK Command Line Tools Only

### Step 1: Download SDK Tools
1. Go to: https://developer.android.com/studio#command-tools
2. Download "Command line tools only" for Windows
3. Extract to: `C:\Android\cmdline-tools`

### Step 2: Set Environment Variables
```bash
ANDROID_HOME=C:\Android
Path=%ANDROID_HOME%\cmdline-tools\latest\bin
Path=%ANDROID_HOME%\platform-tools
```

### Step 3: Install SDK Components
```bash
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" "emulator"
```

---

## Option 3: Use Expo Go App (Easiest - No SDK Required!)

### For Physical Android Device:
1. Install **Expo Go** from Google Play Store
2. Run: `npx expo start`
3. Scan QR code with Expo Go app
4. App runs on your phone!

### For Web Browser (No Android Required):
```bash
npx expo start --web
```
Opens in Chrome/Edge - works immediately!

---

## Quick Start After Installation

```bash
# Start Expo
npx expo start

# Press 'a' for Android emulator
# Press 'w' for web browser
# Or scan QR with Expo Go app
```

---

## Recommended: Use Web Browser for Now

Since Android SDK takes time to install, use web browser:

```bash
cd c:\Users\Shyam\Desktop\Virtusa\vDHP
npx expo start --web
```

This opens the app in your browser immediately - no SDK needed!

---

## Troubleshooting

### "adb not recognized"
- Restart terminal after setting environment variables
- Verify Path includes: `%ANDROID_HOME%\platform-tools`

### "SDK not found"
- Check ANDROID_HOME points to correct folder
- Folder should contain: platform-tools, emulator, platforms

### Emulator won't start
- Enable virtualization in BIOS
- Install Intel HAXM or AMD Hypervisor
