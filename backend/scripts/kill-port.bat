@echo off
echo 🔧 Port Conflict Resolver
echo ========================

if "%1"=="" (
    set PORT_TO_KILL=5000
) else (
    set PORT_TO_KILL=%1
)

echo 🔍 Looking for processes using port %PORT_TO_KILL%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT_TO_KILL%" ^| findstr "LISTENING"') do (
    echo 📋 Found process %%a using port %PORT_TO_KILL%
    echo 🔪 Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel!==0 (
        echo ✅ Successfully killed process %%a
    ) else (
        echo ❌ Failed to kill process %%a
    )
)

echo.
echo 🔍 Checking if port %PORT_TO_KILL% is now free...
netstat -ano | findstr ":%PORT_TO_KILL%" >nul
if %errorlevel%==0 (
    echo ⚠️  Port %PORT_TO_KILL% is still in use
) else (
    echo ✅ Port %PORT_TO_KILL% is now available!
    echo 🚀 You can now start your server: npm run dev
)

pause
