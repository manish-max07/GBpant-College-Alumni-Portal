@echo off
echo.
echo ========================================
echo    Adding Profile Picture Column
echo ========================================
echo.

if "%DATABASE_URL%"=="" set DATABASE_URL=postgresql://username:password@your-db-host.oregon-postgres.render.com/your_render_db

echo Running profile picture migration...
psql "%DATABASE_URL%" -f ..\database\migrations\add-profile-picture-column.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS: Profile picture column added successfully!
    echo.
    echo The users table now has a 'profile_picture_url' column
    echo to store profile picture URLs or file paths.
    echo.
) else (
    echo.
    echo ❌ ERROR: Failed to add profile picture column
    echo Please check the connection and try again.
    echo.
)

pause
