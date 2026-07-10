-- 🎓 Alumni Portal Database Schema with JWT Authentication
-- Created: August 24, 2025
-- Description: Database schema for GBPANT Alumni Portal with JWT authentication, user management, OTP verification, and alumni profiles

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS alumni_profiles CASCADE;
DROP TABLE IF EXISTS otp_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 🧠 Main user table with ID as primary key for JWT token generation
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  roll_no VARCHAR(50), -- optional for alumni who might not remember/have roll numbers
  password_hash VARCHAR(255), -- nullable until user sets password after OTP verification
  user_type VARCHAR(20) DEFAULT 'alumni' CHECK (user_type IN ('student', 'alumni')),
  email_verified BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  password_set_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_roll_no ON users(roll_no);

-- 🔐 Create OTP tracking table (this is now mostly handled in-memory, but can be used for audit)
CREATE TABLE otp_logs (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL, -- store hashed OTP for security
  otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('signup', 'login', 'password_reset')),
  attempts_made INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
  verified_at TIMESTAMP,
  FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- 🧾 Extended alumni profile information collected after initial registration
CREATE TABLE alumni_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  age INTEGER CHECK (age >= 15 AND age <= 100),
  passing_year INTEGER CHECK (passing_year >= 1950 AND passing_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  branch VARCHAR(100) NOT NULL, -- Engineering branch (CS, IT, ECE, etc.)
  program VARCHAR(100) NOT NULL, -- B.Tech, M.Tech, MBA, etc.
  is_employed BOOLEAN DEFAULT FALSE,
  employer VARCHAR(255), -- Company name if employed
  position VARCHAR(255), -- Job title/designation
  experience TEXT, -- Work experience details
  linkedin_profile VARCHAR(255), -- LinkedIn URL
  location VARCHAR(255), -- Current city/location
  skills TEXT[], -- Array of skills
  achievements TEXT, -- Notable achievements
  bio TEXT, -- Personal bio
  website_url VARCHAR(255), -- Personal website
  github_profile VARCHAR(255), -- GitHub profile
  -- Higher Education Information
  current_institution VARCHAR(255), -- Current institution for higher studies
  current_course VARCHAR(255), -- Current course/program being pursued
  institution_country VARCHAR(100), -- Country of current institution
  is_pursuing_higher_education BOOLEAN DEFAULT FALSE, -- Flag for higher education
  expected_graduation_year INTEGER CHECK (expected_graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE) AND expected_graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10), -- Expected graduation year
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 🎓 Student profiles for current students
CREATE TABLE student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  current_year INTEGER CHECK (current_year >= 1 AND current_year <= 6),
  branch VARCHAR(100) NOT NULL,
  program VARCHAR(100) NOT NULL,
  semester INTEGER CHECK (semester >= 1 AND semester <= 12),
  cgpa DECIMAL(3,2) CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
  interests TEXT[],
  skills TEXT[],
  projects JSONB DEFAULT '[]'::jsonb, -- Array of project objects with name, description, deployed_link
  internships JSONB DEFAULT '[]'::jsonb, -- Array of internship objects with company_name, position, description
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- 📊 Create performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_roll_no ON users(roll_no);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_otp_logs_email ON otp_logs(email);
CREATE INDEX idx_otp_logs_created_at ON otp_logs(created_at);
CREATE INDEX idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX idx_alumni_profiles_passing_year ON alumni_profiles(passing_year);
CREATE INDEX idx_alumni_profiles_branch ON alumni_profiles(branch);
CREATE INDEX idx_alumni_profiles_current_institution ON alumni_profiles(current_institution);
CREATE INDEX idx_alumni_profiles_is_pursuing_higher_education ON alumni_profiles(is_pursuing_higher_education);
CREATE INDEX idx_alumni_profiles_institution_country ON alumni_profiles(institution_country);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_current_year ON student_profiles(current_year);
CREATE INDEX idx_student_profiles_branch ON student_profiles(branch);
CREATE INDEX idx_student_profiles_projects ON student_profiles USING GIN (projects);
CREATE INDEX idx_student_profiles_internships ON student_profiles USING GIN (internships);

-- 📝 Add comments for documentation
COMMENT ON TABLE users IS 'Primary user authentication table for both students and alumni with JWT support';
COMMENT ON TABLE otp_logs IS 'OTP verification system with attempt tracking and expiration';
COMMENT ON TABLE alumni_profiles IS 'Extended profile information for graduated alumni';
COMMENT ON TABLE student_profiles IS 'Profile information for current students';

COMMENT ON COLUMN users.roll_no IS 'Optional for alumni, required for current students';
COMMENT ON COLUMN users.id IS 'Primary key used for JWT token generation';
COMMENT ON COLUMN Users.Password IS 'Nullable until user completes OTP verification and sets password';
COMMENT ON COLUMN OTP.Attempt IS 'Remaining attempts to resend OTP (max 3)';
COMMENT ON COLUMN OTP.VerifyAttempt IS 'Remaining attempts to verify OTP (max 3)';
COMMENT ON COLUMN AlumniProfile.Experience IS 'Free text field for work experience description';
COMMENT ON COLUMN student_profiles.projects IS 'JSONB array of project objects: [{name, description, deployed_link}]';
COMMENT ON COLUMN student_profiles.internships IS 'JSONB array of internship objects: [{company_name, position, description}]';
