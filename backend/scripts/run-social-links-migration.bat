@echo off
echo 🚀 Adding LinkedIn and GitHub columns to student_profiles table on Render...
echo.

REM Set database connection details
if "%PGPASSWORD%"=="" set PGPASSWORD=your_database_password
if "%PGHOST%"=="" set PGHOST=your-db-host.oregon-postgres.render.com
if "%PGUSER%"=="" set PGUSER=your_db_username
if "%PGDATABASE%"=="" set PGDATABASE=your_db_name
if "%PGPORT%"=="" set PGPORT=5432

echo 📋 Executing migration to add social media links...
psql -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -p %PGPORT% -f "../database/migrations/add-social-links-to-students.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration completed successfully!
    echo 🔗 LinkedIn and GitHub columns added to student_profiles table
    echo.
    echo 📊 Verifying table structure...
    echo SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_profiles' ORDER BY ordinal_position; | psql -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -p %PGPORT%
) else (
    echo ❌ Migration failed! Check the error messages above.
)

pause
