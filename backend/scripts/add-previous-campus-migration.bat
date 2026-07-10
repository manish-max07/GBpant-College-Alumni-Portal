@echo off
REM Script to add previous_campus column to Render PostgreSQL database
REM Run this script to update the database schema

echo 🚀 Adding previous_campus column to alumni_profiles table on Render...
echo.

REM Set database connection parameters (replace with your values or ensure environment variables are set)
if "%PGPASSWORD%"=="" set PGPASSWORD=your_database_password
if "%DB_HOST%"=="" set DB_HOST=your-db-host.oregon-postgres.render.com
if "%DB_USER%"=="" set DB_USER=your_db_username
if "%DB_NAME%"=="" set DB_NAME=your_db_name

REM Run the migration
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f ..\database\migrations\add-previous-campus-column.sql

echo.
echo ✅ Migration completed! Check above output for details.
echo.
echo 📋 Column Details:
echo    - Name: previous_campus
echo    - Type: VARCHAR(100)
echo    - Nullable: Yes (allows NULL for existing records)  
echo    - Purpose: Store campus name from before college merger
echo.
echo Note: "already exists" errors are normal if running migration multiple times.
echo.

pause
