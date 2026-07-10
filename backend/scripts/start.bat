@echo off
title GBPANT Alumni Portal Backend

echo 🚀 GBPANT Alumni Portal Backend Server
echo ====================================

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this from the backend directory.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check if .env exists
if not exist ".env" (
    echo 📝 Creating .env file...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ⚠️  Please update .env with your actual configuration
    ) else (
        echo ❌ .env.example not found
        pause
        exit /b 1
    )
)

:: Check if canvas is installed
npm list canvas >nul 2>&1
if %errorlevel% neq 0 (
    echo 🎨 Installing canvas for PNG CAPTCHA generation...
    npm install canvas
    if %errorlevel% neq 0 (
        echo ⚠️  Canvas installation failed. SVG CAPTCHA will be used as fallback.
    )
)

echo.
echo ✅ All checks passed!
echo 🌐 Starting server on http://localhost:5000
echo 🔒 CAPTCHA endpoints will be available
echo ⚠️  Press Ctrl+C to stop the server
echo.

:: Start the server
npm run dev
