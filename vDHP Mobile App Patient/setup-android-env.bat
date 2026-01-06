@echo off
REM Setup Android Environment Variables for Windows
REM Run this script as Administrator

set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk

REM Set ANDROID_HOME
setx ANDROID_HOME "%ANDROID_HOME%"

REM Add to PATH
setx PATH "%PATH%;%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools"

echo.
echo ✅ Android environment variables set successfully!
echo ANDROID_HOME: %ANDROID_HOME%
echo.
echo ⚠️  Please restart your terminal/IDE for changes to take effect
pause
