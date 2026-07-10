@echo off
echo 🔄 Running Alumni Status Columns Migration...
echo.

REM Change to backend directory
cd /d "%~dp0"

REM Set database connection details
if "%PGPASSWORD%"=="" set PGPASSWORD=your_database_password
if "%DB_HOST%"=="" set DB_HOST=your-db-host.oregon-postgres.render.com
if "%DB_USER%"=="" set DB_USER=your_db_username
if "%DB_NAME%"=="" set DB_NAME=your_db_name

REM Run the migration
echo Applying add-alumni-status-columns.sql migration...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "..\database\migrations\add-alumni-status-columns.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Alumni status columns migration completed successfully!
    echo.
    echo New columns added to alumni_profiles table:
    echo - is_preparing_competitive_exams
    echo - competitive_exam_details
    echo - is_seeking_opportunities
    echo - opportunity_preferences
    echo - availability_status
    echo.
) else (
    echo.
    echo ❌ Migration failed! Please check the error messages above.
    echo.
)

pause
