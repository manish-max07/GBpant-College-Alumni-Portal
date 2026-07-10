@echo off
echo 🎯 Render Database Migration - Higher Education Feature
echo ====================================================
echo.

echo 📍 Current directory: %cd%
echo 📅 Migration date: %date% %time%
echo.

echo 🔍 Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo.

echo ⚠️  IMPORTANT: This will modify your PRODUCTION database on Render!
echo 🎯 Target: gbpant-alumni-db on Render
echo.
set /p confirm="Are you sure you want to proceed? (y/N): "
if /i not "%confirm%"=="y" (
    echo Migration cancelled by user.
    pause
    exit /b 0
)

echo.
echo 🚀 Running Render Database Migration...
echo =====================================
node scripts\render-migration.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Render migration failed!
    echo Please check the error messages above
    echo.
    echo 🔧 Troubleshooting tips:
    echo   1. Check your internet connection
    echo   2. Verify Render database is active
    echo   3. Ensure database credentials are correct
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Render migration completed successfully!
    echo.
    echo 🎉 Your Render database now supports higher education features:
    echo    ✅ current_institution column
    echo    ✅ current_course column  
    echo    ✅ institution_country column
    echo    ✅ is_pursuing_higher_education column
    echo    ✅ expected_graduation_year column
    echo    ✅ Performance indexes created
    echo.
    echo 🚀 Next steps:
    echo    1. Deploy your updated backend code to Render
    echo    2. Deploy your updated frontend code
    echo    3. Test the new higher education features
    echo.
)

echo Press any key to continue...
pause > nul
