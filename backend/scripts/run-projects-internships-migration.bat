@echo off
echo 🔄 Running Projects and Internships JSONB Migration...
echo.

REM Set database connection details
if "%PGPASSWORD%"=="" set PGPASSWORD=your_database_password
if "%DB_HOST%"=="" set DB_HOST=your-db-host.oregon-postgres.render.com
if "%DB_USER%"=="" set DB_USER=your_db_username
if "%DB_NAME%"=="" set DB_NAME=your_db_name

echo Connecting to Render database...
echo Host: %DB_HOST%
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

echo Running migration script...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "..\database\migrations\update-projects-internships.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo Projects and internships are now JSONB format.
    echo.
) else (
    echo.
    echo ❌ Migration failed! Check the error messages above.
    echo.
)

pause
