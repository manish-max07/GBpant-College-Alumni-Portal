-- Database Configuration Notes for Alumni Portal

-- 🎯 Database Setup Instructions

-- 1. For PostgreSQL (Recommended):
--    - Install PostgreSQL
--    - Create database: CREATE DATABASE alumni_portal;
--    - Run: psql -U username -d alumni_portal -f schema.sql
--    - Run: psql -U username -d alumni_portal -f init.sql

-- 2. For MySQL:
--    - Install MySQL
--    - Create database: CREATE DATABASE alumni_portal;
--    - Modify SERIAL to AUTO_INCREMENT in schema.sql
--    - Run: mysql -u username -p alumni_portal < schema.sql

-- 📝 Environment Variables for Backend
-- Create a .env file in your backend directory with:

-- # Database Configuration
-- DB_HOST=localhost
-- DB_PORT=5432
-- DB_NAME=alumni_portal
-- DB_USER=your_username
-- DB_PASSWORD=your_password

-- # JWT Configuration
-- JWT_SECRET=your_jwt_secret_key_here
-- JWT_EXPIRE=24h

-- # OTP Configuration
-- OTP_EXPIRE_MINUTES=10
-- MAX_OTP_ATTEMPTS=3
-- MAX_VERIFY_ATTEMPTS=3

-- # Email Configuration (for OTP sending)
-- SMTP_HOST=smtp.gmail.com
-- SMTP_PORT=587
-- SMTP_USER=your_email@gmail.com
-- SMTP_PASS=your_app_password

-- 🔧 Node.js Dependencies
-- npm install express cors dotenv bcryptjs jsonwebtoken
-- npm install pg pg-hstore  # For PostgreSQL
-- npm install mysql2        # For MySQL
-- npm install nodemailer    # For sending OTP emails

-- 🚀 API Endpoints Structure
-- POST /api/auth/signup       - User registration
-- POST /api/auth/send-otp     - Send OTP to email
-- POST /api/auth/verify-otp   - Verify OTP code
-- POST /api/auth/set-password - Set password after OTP verification
-- POST /api/auth/login        - User login
-- GET  /api/profile/alumni    - Get alumni profile
-- PUT  /api/profile/alumni    - Update alumni profile
-- GET  /api/profile/student   - Get student profile
-- PUT  /api/profile/student   - Update student profile
