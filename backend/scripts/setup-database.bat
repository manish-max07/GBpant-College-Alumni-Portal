@echo off
title GBPANT Alumni Portal - Database Setup

echo 🎓 GBPANT Alumni Portal Database Setup
echo ======================================

echo.
echo 🔍 Checking prerequisites...

:: Check if PostgreSQL is running
net start | findstr "postgresql" >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL service not found or not running
    echo 💡 Please ensure PostgreSQL is installed and running
    echo    You can start it with: net start postgresql-x64-13
    pause
    exit /b 1
)

echo ✅ PostgreSQL service is running

:: Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found
    echo 📝 Creating .env from example...
    copy ".env.example" ".env"
    echo ⚠️  Please update .env with your actual database password
    pause
)

echo ✅ Environment file found

:: Test database connection first
echo.
echo 🔍 Testing database connection...
npm run test-db
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database connection failed
    echo 🔧 Please check your database configuration:
    echo.
    echo 1. Ensure database "gbpantalumni" exists:
    echo    psql -U postgres -c "CREATE DATABASE gbpantalumni;"
    echo.
    echo 2. Update .env file with correct password:
    echo    DB_PASSWORD=your_actual_password
    echo.
    echo 3. Test connection manually:
    echo    psql -h localhost -U postgres -d gbpantalumni
    echo.
    pause
    exit /b 1
)

echo.
echo 🏗️  Setting up database tables...
npm run setup-db
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo 🔍 Running database health check...
npm run db-health

echo.
echo 🎉 Database setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Start your backend server: npm run dev
echo 2. Test your endpoints: npm run test-endpoints
echo 3. Access health check: http://localhost:5000/api/health
echo 4. Check database status: http://localhost:5000/api/database/status

echo.
pause
