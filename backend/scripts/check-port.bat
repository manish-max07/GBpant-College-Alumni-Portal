@echo off
echo 🔍 Port Checker for GBPANT Alumni Portal Backend
echo ===============================================

set DEFAULT_PORT=5000
set /p CUSTOM_PORT="Enter port number (default: %DEFAULT_PORT%): "

if "%CUSTOM_PORT%"=="" set CUSTOM_PORT=%DEFAULT_PORT%

echo.
echo 🔍 Checking if port %CUSTOM_PORT% is available...

netstat -ano | findstr ":%CUSTOM_PORT%" >nul
if %errorlevel%==0 (
    echo ❌ Port %CUSTOM_PORT% is already in use
    echo.
    echo 📋 Processes using port %CUSTOM_PORT%:
    netstat -ano | findstr ":%CUSTOM_PORT%"
    echo.
    echo 💡 Options:
    echo 1. Kill the process: taskkill /PID [PID_NUMBER] /F
    echo 2. Use a different port in your .env file
    echo 3. Run: npm run kill-port %CUSTOM_PORT%
    echo.
    set /p KILL_CHOICE="Kill the process using port %CUSTOM_PORT%? (y/n): "
    if /i "%KILL_CHOICE%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%CUSTOM_PORT%"') do (
            echo Killing process %%a...
            taskkill /PID %%a /F
        )
        echo ✅ Process killed. You can now start your server.
    )
) else (
    echo ✅ Port %CUSTOM_PORT% is available!
    echo 🚀 You can start your server on this port.
)

echo.
echo 📋 To start your server:
echo npm run dev
echo.
echo 🔧 To use a different port:
echo 1. Update PORT=%CUSTOM_PORT% in your .env file
echo 2. Or set environment variable: set PORT=%CUSTOM_PORT% && npm run dev

pause
