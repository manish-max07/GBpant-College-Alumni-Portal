const fs = require('fs    // Backup existing data if tables exist
    console.log('\n📦 Backing up existing data...');
    
    let existingUsers = [];
    let existingProfiles = [];
    
    try {
      // Try to get data from OLD table names (capital case)
      const usersResult = await query('SELECT * FROM Users ORDER BY CreatedAt');
      existingUsers = usersResult.rows;
      console.log(`📊 Found ${existingUsers.length} existing users`);
      
      const profilesResult = await query('SELECT * FROM AlumniProfile');
      existingProfiles = profilesResult.rows;
      console.log(`📊 Found ${existingProfiles.length} existing profiles`);
    } catch (error) {
      console.log('ℹ️  No existing data to backup (this is normal for fresh installs)');
    } require('path');
const { query, testConnection } = require('../config/database');

/**
 * Database Migration Script to JWT-Compatible Schema
 * This script migrates from old schema (Email as PK) to new schema (ID as PK)
 */

const migrateToJWTSchema = async () => {
  try {
    console.log('🚀 Starting Database Migration to JWT-Compatible Schema...');
    console.log('==========================================================');
    
    // Test connection
    console.log('📡 Testing database connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected successfully');
    
    // Backup existing data if tables exist
    console.log('\n📦 Backing up existing data...');
    
    let existingUsers = [];
    let existingProfiles = [];
    
    try {
      const usersResult = await query('SELECT * FROM Users ORDER BY CreatedAt');
      existingUsers = usersResult.rows;
      console.log(`📊 Found ${existingUsers.length} existing users`);
      
      const profilesResult = await query('SELECT * FROM AlumniProfile');
      existingProfiles = profilesResult.rows;
      console.log(`📊 Found ${existingProfiles.length} existing profiles`);
    } catch (error) {
      console.log('ℹ️  No existing data to backup');
    }

    // Drop old tables
    console.log('\n🗑️  Dropping old tables...');
    
    const dropQueries = [
      'DROP TABLE IF EXISTS StudentProfile CASCADE',
      'DROP TABLE IF EXISTS AlumniProfile CASCADE', 
      'DROP TABLE IF EXISTS OTP CASCADE',
      'DROP TABLE IF EXISTS Users CASCADE',
      'DROP INDEX IF EXISTS idx_users_email',
      'DROP INDEX IF EXISTS idx_otp_email'
    ];
    
    for (const dropQuery of dropQueries) {
      try {
        await query(dropQuery);
        console.log(`✅ Executed: ${dropQuery}`);
      } catch (error) {
        console.log(`ℹ️  Skipped: ${dropQuery} (table/index doesn't exist)`);
      }
    }

    // Create new JWT-compatible schema
    console.log('\n🏗️  Creating new JWT-compatible schema...');
    
    // Create tables one by one with proper SQL
    const createUserTableSQL = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(15) UNIQUE NOT NULL,
        roll_no VARCHAR(50),
        password_hash VARCHAR(255),
        user_type VARCHAR(20) DEFAULT 'alumni' CHECK (user_type IN ('student', 'alumni')),
        email_verified BOOLEAN DEFAULT FALSE,
        profile_complete BOOLEAN DEFAULT FALSE,
        password_set_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    const createOTPLogsTableSQL = `
      CREATE TABLE otp_logs (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('signup', 'login', 'password_reset')),
        attempts_made INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
        verified_at TIMESTAMP,
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      )`;

    const createAlumniProfilesTableSQL = `
      CREATE TABLE alumni_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        age INTEGER CHECK (age >= 15 AND age <= 100),
        passing_year INTEGER CHECK (passing_year >= 1950 AND passing_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
        branch VARCHAR(100) NOT NULL,
        program VARCHAR(100) NOT NULL,
        is_employed BOOLEAN DEFAULT FALSE,
        employer VARCHAR(255),
        position VARCHAR(255),
        experience TEXT,
        linkedin_profile VARCHAR(255),
        location VARCHAR(255),
        skills TEXT[],
        achievements TEXT,
        bio TEXT,
        website_url VARCHAR(255),
        github_profile VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`;

    const createStudentProfilesTableSQL = `
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
        projects TEXT,
        internships TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`;

    const createIndexesSQL = [
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_mobile ON users(mobile)',
      'CREATE INDEX idx_users_roll_no ON users(roll_no)'
    ];

    // Execute table creation queries
    const tableQueries = [
      { name: 'users table', sql: createUserTableSQL },
      { name: 'otp_logs table', sql: createOTPLogsTableSQL },
      { name: 'alumni_profiles table', sql: createAlumniProfilesTableSQL },
      { name: 'student_profiles table', sql: createStudentProfilesTableSQL }
    ];

    for (const { name, sql } of tableQueries) {
      try {
        await query(sql);
        console.log(`✅ Created: ${name}`);
      } catch (error) {
        console.error(`❌ Error creating ${name}:`, error.message);
        throw error;
      }
    }

    // Create indexes
    for (const indexSQL of createIndexesSQL) {
      try {
        await query(indexSQL);
        console.log(`✅ Created index: ${indexSQL.split(' ')[2]}`);
      } catch (error) {
        console.error(`❌ Error creating index: ${error.message}`);
      }
    }

    // Migrate existing data to new schema
    if (existingUsers.length > 0) {
      console.log('\n📥 Migrating existing user data...');
      
      for (const user of existingUsers) {
        try {
          // Insert into new users table with ID as primary key
          const insertResult = await query(
            `INSERT INTO users (full_name, email, mobile, roll_no, user_type, email_verified, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
              user.fullname || user.FullName,
              user.email || user.Email,
              user.mobile || user.Mobile,
              user.rollno || user.RollNo || null,
              user.rollno || user.RollNo ? 'student' : 'alumni',
              true, // Assume verified for existing users
              user.createdat || user.CreatedAt || new Date()
            ]
          );
          
          const newUserId = insertResult.rows[0].id;
          console.log(`✅ Migrated user: ${user.email || user.Email} (new ID: ${newUserId})`);
          
          // If user has a profile, migrate it too
          const userProfile = existingProfiles.find(p => 
            (p.email || p.Email) === (user.email || user.Email)
          );
          
          if (userProfile && (user.rollno || user.RollNo)) {
            // Student profile
            await query(
              `INSERT INTO student_profiles (user_id, current_year, branch, program, semester)
               VALUES ($1, $2, $3, $4, $5)`,
              [newUserId, 1, 'Computer Science', 'B.Tech', 1] // Default values
            );
            console.log(`✅ Created student profile for user ${newUserId}`);
          } else if (userProfile) {
            // Alumni profile
            await query(
              `INSERT INTO alumni_profiles (user_id, passing_year, branch, program, is_employed)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                newUserId,
                userProfile.passingyear || userProfile.PassingYear || 2020,
                userProfile.branch || userProfile.Branch || 'Computer Science',
                userProfile.program || userProfile.Program || 'B.Tech',
                userProfile.isemployed || userProfile.IsEmployed || false
              ]
            );
            console.log(`✅ Migrated alumni profile for user ${newUserId}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to migrate user ${user.email || user.Email}:`, error.message);
        }
      }
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const newUserCount = await query('SELECT COUNT(*) as count FROM users');
    const newAlumniCount = await query('SELECT COUNT(*) as count FROM alumni_profiles');
    const newStudentCount = await query('SELECT COUNT(*) as count FROM student_profiles');
    
    console.log(`📊 New users table: ${newUserCount.rows[0].count} records`);
    console.log(`📊 New alumni_profiles: ${newAlumniCount.rows[0].count} records`);
    console.log(`📊 New student_profiles: ${newStudentCount.rows[0].count} records`);

    console.log('\n✅ Database migration completed successfully!');
    console.log('🎉 Your database is now JWT-compatible!');
    console.log('\n📝 Next steps:');
    console.log('1. Test the authentication endpoints');
    console.log('2. Update any existing user passwords through the app');
    console.log('3. Configure email settings for OTP functionality');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('💡 Please check your database connection and try again');
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateToJWTSchema()
    .then(() => {
      console.log('\n🚀 Ready to use JWT authentication!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateToJWTSchema };
