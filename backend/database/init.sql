-- 🚀 Database Initialization Script
-- Run this script to set up the Alumni Portal database

-- Create database (adjust name as needed)
-- CREATE DATABASE alumni_portal;
-- USE alumni_portal;

-- Source the main schema
-- \i schema.sql

-- 🗑️ Clean up existing data (for development only)
-- Uncomment these lines if you need to reset the database during development
/*
DROP TABLE IF EXISTS StudentProfile CASCADE;
DROP TABLE IF EXISTS AlumniProfile CASCADE;
DROP TABLE IF EXISTS OTP CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
*/

-- 📊 Insert sample data for testing
-- Sample users (passwords should be hashed in real implementation)
INSERT INTO Users (Email, FullName, Mobile, RollNo, Password) VALUES
('alumni1@example.com', 'Rahul Sharma', '9876543210', 'GB2020001', '$2b$10$hashedpassword1'),
('alumni2@example.com', 'Priya Singh', '9876543211', 'GB2019002', '$2b$10$hashedpassword2'),
('student1@example.com', 'Amit Kumar', '9876543212', 'GB2024001', '$2b$10$hashedpassword3'),
('student2@example.com', 'Sneha Patel', '9876543213', 'GB2024002', '$2b$10$hashedpassword4');

-- Sample alumni profiles
INSERT INTO AlumniProfile (Email, FullName, Age, PassingYear, Branch, Program, IsEmployed, Employer, Position, Experience, LinkedInProfile, Location) VALUES
('alumni1@example.com', 'Rahul Sharma', 25, 2020, 'Computer Science', 'B.Tech', TRUE, 'TCS', 'Software Engineer', '3 years of experience in full-stack development', 'https://linkedin.com/in/rahulsharma', 'Bangalore'),
('alumni2@example.com', 'Priya Singh', 26, 2019, 'Information Technology', 'B.Tech', TRUE, 'Infosys', 'Senior Analyst', '4 years of experience in data analytics and business intelligence', 'https://linkedin.com/in/priyasingh', 'Pune');

-- Sample student profiles
INSERT INTO StudentProfile (Email, FullName, RollNo, CurrentYear, Branch, Program, Semester, CGPA) VALUES
('student1@example.com', 'Amit Kumar', 'GB2024001', 1, 'Computer Science', 'B.Tech', 1, 8.5),
('student2@example.com', 'Sneha Patel', 'GB2024002', 1, 'Electronics & Communication', 'B.Tech', 1, 9.2);

-- 🔍 Verification queries to test the setup
-- Uncomment these to verify data was inserted correctly
/*
SELECT 'Users Count:' as Info, COUNT(*) as Count FROM Users;
SELECT 'Alumni Profiles Count:' as Info, COUNT(*) as Count FROM AlumniProfile;
SELECT 'Student Profiles Count:' as Info, COUNT(*) as Count FROM StudentProfile;

-- Test joins
SELECT u.FullName, u.Email, ap.PassingYear, ap.Employer 
FROM Users u 
JOIN AlumniProfile ap ON u.Email = ap.Email;

SELECT u.FullName, u.Email, sp.RollNo, sp.CurrentYear, sp.CGPA 
FROM Users u 
JOIN StudentProfile sp ON u.Email = sp.Email;
*/
