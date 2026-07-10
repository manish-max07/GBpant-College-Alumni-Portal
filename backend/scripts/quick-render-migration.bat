@echo off
echo 🎯 Quick Render Database Migration
echo ================================
echo.

echo 📋 This will add higher education columns to your Render database
echo 🔗 Target: gbpant-alumni-db on Render
echo.

echo ⚠️  If this fails due to connection timeout, your database might be sleeping.
echo 💡 Try visiting your Render dashboard first to wake up the database.
echo.

set /p confirm="Ready to proceed? (y/N): "
if /i not "%confirm%"=="y" (
    echo Migration cancelled.
    goto end
)

echo.
echo 🚀 Connecting to Render database...
echo.

REM Set the password and try to connect with SSL mode require
if "%PGPASSWORD%"=="" set PGPASSWORD=your_database_password
if "%DB_HOST%"=="" set DB_HOST=your-db-host.oregon-postgres.render.com
if "%DB_USER%"=="" set DB_USER=your_db_username
if "%DB_NAME%"=="" set DB_NAME=your_db_name

REM First try to wake up the database with a simple query
echo 💤 Waking up database (if sleeping)...
psql -h %DB_HOST% -U %DB_USER% %DB_NAME% --set=sslmode=require -c "SELECT 1;" 2>nul

if %errorlevel% neq 0 (
    echo ⚠️  Database connection failed. This might mean:
    echo   1. Database is sleeping ^(free tier^) - wait 30 seconds and try again
    echo   2. Network connectivity issues
    echo   3. Database credentials changed
    echo.
    echo 💡 Please check your Render dashboard and ensure database is active.
    goto end
)

echo ✅ Database is awake and connected!
echo.

echo 🔄 Running migration script...
psql -h %DB_HOST% -U %DB_USER% %DB_NAME% --set=sslmode=require -f ..\database\migrations\render-migration.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo 🎉 Your Render database now has higher education columns:
    echo    ✅ current_institution
    echo    ✅ current_course
    echo    ✅ institution_country  
    echo    ✅ is_pursuing_higher_education
    echo    ✅ expected_graduation_year
    echo.
    echo 🚀 Next steps:
    echo    1. Deploy your backend changes to Render
    echo    2. Deploy your frontend changes
    echo    3. Test the new features!
) else (
    echo.
    echo ❌ Migration failed!
    echo.
    echo 🔧 Troubleshooting options:
    echo    1. Check if database is active in Render dashboard
    echo    2. Wait a few minutes if database was sleeping
    echo    3. Try the manual method in RENDER_MIGRATION_GUIDE.md
    echo    4. Use an online PostgreSQL client as backup
)

:end
echo.
echo Press any key to exit...
pause > nul
