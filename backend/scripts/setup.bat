@echo off
echo 🚀 Setting up GBPANT Alumni Portal Backend with CAPTCHA
echo =======================================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

:: Navigate to backend directory
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

cd backend

:: Install dependencies
echo 📦 Installing backend dependencies...
npm install

:: Install canvas (optional, with error handling)
echo 🎨 Installing canvas for PNG CAPTCHA generation...
npm install canvas
if %errorlevel% neq 0 (
    echo ⚠️  Canvas installation failed. SVG CAPTCHA will be used as fallback.
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your actual configuration values.
) else (
    echo ✅ .env file already exists
)

:: Create necessary directories
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "temp" mkdir temp

echo 🎉 Backend setup complete!
echo.
echo 📋 Next steps:
echo 1. Update backend\.env with your database and email credentials
echo 2. Set up your PostgreSQL database using the schema files
echo 3. Start the development server: npm run dev
echo.
echo 🔧 Available scripts:
echo - npm start     : Start production server
echo - npm run dev   : Start development server with nodemon
echo.
echo 🔒 CAPTCHA endpoints will be available at:
echo - POST http://localhost:5000/api/captcha/generate
echo - POST http://localhost:5000/api/captcha/verify
echo - GET  http://localhost:5000/api/captcha/stats

pause
