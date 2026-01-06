# Setup Android Environment Variables for Windows
# Run this script in PowerShell as Administrator

$androidHome = "$env:USERPROFILE\AppData\Local\Android\Sdk"

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidHome, 'User')

# Get current PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

# Add Android paths if not already present
$emulatorPath = "$androidHome\emulator"
$platformToolsPath = "$androidHome\platform-tools"

if ($currentPath -notlike "*$emulatorPath*") {
    $newPath = "$currentPath;$emulatorPath"
    [System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

if ($currentPath -notlike "*$platformToolsPath*") {
    $currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $newPath = "$currentPath;$platformToolsPath"
    [System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

Write-Host "✅ Android environment variables set successfully!" -ForegroundColor Green
Write-Host "ANDROID_HOME: $androidHome" -ForegroundColor Cyan
Write-Host "⚠️  Please restart your terminal/IDE for changes to take effect" -ForegroundColor Yellow
