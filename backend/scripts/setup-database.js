const fs = require('fs');
const path = require('path');
const { query, testConnection, getDatabaseInfo, tableExists } = require('../config/database');

// SQL schema for creating tables
const createTablesSQL = `
-- 🎓 Alumni Portal Database Schema
-- Created: August 5, 2025
-- Description: Database schema for GBPANT Alumni Portal with user management, OTP verification, and alumni profiles

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS StudentProfile CASCADE;
DROP TABLE IF EXISTS AlumniProfile CASCADE;
DROP TABLE IF EXISTS OTP CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- 🧠 Define main user table using Email as primary key
-- Primary user table for both students and alumni authentication
CREATE TABLE Users (
  Email VARCHAR(255) PRIMARY KEY,
  FullName VARCHAR(255) NOT NULL,
  Mobile VARCHAR(15) NOT NULL,
  RollNo VARCHAR(50), -- optional for alumni who might not remember/have roll numbers
  Password VARCHAR(255), -- nullable until user sets password after OTP verification
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔐 Create OTP table with tracking for resend and verify attempts
-- OTP management with attempt tracking and IST timezone for Indian users
CREATE TABLE OTP (
  id SERIAL PRIMARY KEY,
  Email VARCHAR(255) NOT NULL,
  OTP INTEGER NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ExpiresAt TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
  Attempt INTEGER DEFAULT 3, -- remaining resend attempts
  VerifyAttempt INTEGER DEFAULT 3, -- remaining verification attempts
  IsUsed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (Email) REFERENCES Users(Email) ON DELETE CASCADE
);

-- 🧾 Create AlumniProfile table to store post-login profile fields
-- Extended profile information collected after initial registration
CREATE TABLE AlumniProfile (
  Email VARCHAR(255) PRIMARY KEY,
  FullName VARCHAR(255) NOT NULL,
  Age INTEGER CHECK (Age >= 15 AND Age <= 100),
  PassingYear INTEGER CHECK (PassingYear >= 1950 AND PassingYear <= EXTRACT(YEAR FROM CURRENT_DATE)),
  Branch VARCHAR(100) NOT NULL, -- Engineering branch (CS, IT, ECE, etc.)
  Program VARCHAR(100) NOT NULL, -- B.Tech, M.Tech, MBA, etc.
  IsEmployed BOOLEAN DEFAULT FALSE,
  Employer VARCHAR(255), -- Company name if employed
  Position VARCHAR(255), -- Job title/designation
  Experience TEXT, -- Work experience details
  LinkedInProfile VARCHAR(255), -- LinkedIn URL
  Location VARCHAR(255), -- Current city/location
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Email) REFERENCES Users(Email) ON DELETE CASCADE
);

-- 📚 Create StudentProfile table for current students
-- Separate profile for current students with different fields
CREATE TABLE StudentProfile (
  Email VARCHAR(255) PRIMARY KEY,
  FullName VARCHAR(255) NOT NULL,
  RollNo VARCHAR(50) NOT NULL UNIQUE,
  Age INTEGER CHECK (Age >= 15 AND Age <= 30),
  CurrentYear INTEGER CHECK (CurrentYear >= 1 AND CurrentYear <= 5),
  Branch VARCHAR(100) NOT NULL,
  Program VARCHAR(100) NOT NULL,
  Semester INTEGER CHECK (Semester >= 1 AND Semester <= 10),
  CGPA DECIMAL(3,2) CHECK (CGPA >= 0.0 AND CGPA <= 10.0),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Email) REFERENCES Users(Email) ON DELETE CASCADE
);

-- 🔗 Create indexes for better query performance
CREATE INDEX idx_users_email ON Users(Email);
CREATE INDEX idx_otp_email ON OTP(Email);
CREATE INDEX idx_otp_created_at ON OTP(CreatedAt);
CREATE INDEX idx_alumni_profile_email ON AlumniProfile(Email);
CREATE INDEX idx_alumni_profile_passing_year ON AlumniProfile(PassingYear);
CREATE INDEX idx_alumni_profile_branch ON AlumniProfile(Branch);
CREATE INDEX idx_student_profile_email ON StudentProfile(Email);
CREATE INDEX idx_student_profile_roll_no ON StudentProfile(RollNo);
`;

// Create sample data for testing
const insertSampleDataSQL = `
-- Insert sample users for testing
INSERT INTO Users (Email, FullName, Mobile, RollNo) VALUES 
('alumni@gbpant.edu', 'John Doe Alumni', '9876543210', 'GB2020001'),
('student@gbpant.edu', 'Jane Smith Student', '9876543211', 'GB2024001'),
('test@example.com', 'Test User', '9876543212', NULL);

-- Insert sample alumni profile
INSERT INTO AlumniProfile (
  Email, FullName, Age, PassingYear, Branch, Program, 
  IsEmployed, Employer, Position, Experience, Location
) VALUES (
  'alumni@gbpant.edu', 'John Doe Alumni', 25, 2020, 
  'Computer Science & Engineering', 'B.Tech', 
  true, 'Tech Company', 'Software Engineer', 
  '3 years of experience in full-stack development', 'Bangalore'
);

-- Insert sample student profile
INSERT INTO StudentProfile (
  Email, FullName, RollNo, Age, CurrentYear, Branch, 
  Program, Semester, CGPA
) VALUES (
  'student@gbpant.edu', 'Jane Smith Student', 'GB2024001', 
  20, 2, 'Information Technology', 'B.Tech', 4, 8.5
);
`;

async function setupDatabase() {
  console.log('🚀 Setting up GBPANT Alumni Portal Database');
  console.log('==========================================');

  try {
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Database connection failed. Please check your .env configuration.');
      return false;
    }

    // Get database info
    console.log('\n📊 Database Information:');
    const dbInfo = await getDatabaseInfo();
    console.log(`   Database: ${dbInfo.database}`);
    console.log(`   Host: ${dbInfo.host}:${dbInfo.port}`);
    console.log(`   PostgreSQL Version: ${dbInfo.version.split(' ')[0]} ${dbInfo.version.split(' ')[1]}`);
    console.log(`   Existing Tables: ${dbInfo.tableCount}`);

    // Create tables
    console.log('\n🏗️  Creating database tables...');
    await query(createTablesSQL);
    console.log('✅ All tables created successfully!');

    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    const tables = ['users', 'otp', 'alumniprofile', 'studentprofile'];
    for (const table of tables) {
      const exists = await tableExists(table);
      console.log(`   ${exists ? '✅' : '❌'} Table: ${table}`);
    }

    // Insert sample data
    console.log('\n📝 Inserting sample data...');
    await query(insertSampleDataSQL);
    console.log('✅ Sample data inserted successfully!');

    // Final verification
    console.log('\n📋 Database Setup Summary:');
    const finalInfo = await getDatabaseInfo();
    console.log(`   Total Tables: ${finalInfo.tableCount}`);
    
    const userCount = await query('SELECT COUNT(*) as count FROM Users');
    console.log(`   Sample Users: ${userCount.rows[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your .env file with correct database credentials');
    console.log('2. Test your authentication endpoints');
    console.log('3. Start your backend server: npm run dev');

    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Check if database "gbpantalumni" exists');
    console.log('4. Ensure your PostgreSQL user has CREATE privileges');
    return false;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupDatabase };
