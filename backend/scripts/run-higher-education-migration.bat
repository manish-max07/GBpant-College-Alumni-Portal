@echo off
echo 🎓 Alumni Portal - Higher Education Migration
echo ==========================================
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

echo 🚀 Running Higher Education Migration...
echo ==========================================
node scripts\add-higher-education-migration.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Migration failed!
    echo Please check the error messages above
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo 🎉 Your database now supports higher education information for alumni:
    echo    - current_institution
    echo    - current_course
    echo    - institution_country
    echo    - is_pursuing_higher_education
    echo    - expected_graduation_year
    echo.
)

echo Press any key to continue...
pause > nul
