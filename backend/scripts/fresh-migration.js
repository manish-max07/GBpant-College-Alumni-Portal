const { query, testConnection } = require('../config/database');

/**
 * 🔄 Fresh Database Migration Script
 * This script performs a complete clean migration:
 * 1. Drops all existing tables
 * 2. Creates new JWT-based schema
 * 3. Sets up proper indexes and constraints
 * 4. Inserts sample test data
 */

async function performFreshMigration() {
  console.log('🚀 Starting Fresh Database Migration');
  console.log('=====================================');
  
  try {
    // Test database connection first
    console.log('1️⃣ Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Step 1: Drop all existing tables (clean slate)
    console.log('\n2️⃣ Dropping all existing tables...');
    await dropAllTables();
    
    // Step 2: Create new schema
    console.log('\n3️⃣ Creating new database schema...');
    await createNewSchema();
    
    // Step 3: Create indexes for performance
    console.log('\n4️⃣ Creating database indexes...');
    await createIndexes();
    
    // Step 4: Insert sample test data
    console.log('\n5️⃣ Inserting test data...');
    await insertTestData();
    
    // Step 5: Verify migration
    console.log('\n6️⃣ Verifying migration...');
    await verifyMigration();
    
    console.log('\n✅ Fresh migration completed successfully!');
    console.log('🎉 Database is ready for JWT authentication system');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('📝 Error details:', error);
    process.exit(1);
  }
}

async function dropAllTables() {
  const tablesToDrop = [
    'student_profiles',
    'alumni_profiles', 
    'otp_logs',
    'users',
    // Old table names (if they exist)
    'studentprofile',
    'alumniprofile',
    'otp',
    'Users',
    'AlumniProfile',
    'StudentProfile',
    'OTP'
  ];
  
  for (const table of tablesToDrop) {
    try {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   🗑️  Dropped table: ${table}`);
    } catch (error) {
      console.log(`   ⚠️  Could not drop ${table}: ${error.message}`);
    }
  }
}

async function createNewSchema() {
  // Create users table
  console.log('   📋 Creating users table...');
  await query(`
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
    )
  `);
  
  // Create OTP logs table
  console.log('   📋 Creating otp_logs table...');
  await query(`
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
    )
  `);
  
  // Create alumni_profiles table
  console.log('   📋 Creating alumni_profiles table...');
  await query(`
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
    )
  `);
  
  // Create student_profiles table
  console.log('   📋 Creating student_profiles table...');
  await query(`
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
    )
  `);
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX idx_users_email ON users(email)',
    'CREATE INDEX idx_users_mobile ON users(mobile)',
    'CREATE INDEX idx_users_roll_no ON users(roll_no)',
    'CREATE INDEX idx_users_user_type ON users(user_type)',
    'CREATE INDEX idx_otp_logs_email ON otp_logs(email)',
    'CREATE INDEX idx_otp_logs_created_at ON otp_logs(created_at)',
    'CREATE INDEX idx_alumni_profiles_user_id ON alumni_profiles(user_id)',
    'CREATE INDEX idx_alumni_profiles_passing_year ON alumni_profiles(passing_year)',
    'CREATE INDEX idx_alumni_profiles_branch ON alumni_profiles(branch)',
    'CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id)',
    'CREATE INDEX idx_student_profiles_current_year ON student_profiles(current_year)',
    'CREATE INDEX idx_student_profiles_branch ON student_profiles(branch)'
  ];
  
  for (const indexQuery of indexes) {
    try {
      await query(indexQuery);
      console.log(`   📊 Created index: ${indexQuery.split(' ')[2]}`);
    } catch (error) {
      console.log(`   ⚠️  Index creation failed: ${error.message}`);
    }
  }
}

async function insertTestData() {
  // Insert test users
  console.log('   👤 Inserting test users...');
  
  const testUsers = [
    {
      full_name: 'John Doe Alumni',
      email: 'john.alumni@gbpant.edu',
      mobile: '9876543210',
      roll_no: 'CS2018001',
      user_type: 'alumni',
      email_verified: true,
      profile_complete: true
    },
    {
      full_name: 'Jane Smith Student',
      email: 'jane.student@gbpant.edu',
      mobile: '9876543211',
      roll_no: 'CS2022001',
      user_type: 'student',
      email_verified: true,
      profile_complete: true
    },
    {
      full_name: 'Alice Johnson Alumni',
      email: 'alice.alumni@gbpant.edu',
      mobile: '9876543212',
      roll_no: 'IT2017005',
      user_type: 'alumni',
      email_verified: true,
      profile_complete: true
    }
  ];
  
  for (const user of testUsers) {
    try {
      const result = await query(`
        INSERT INTO users (full_name, email, mobile, roll_no, user_type, email_verified, profile_complete)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [user.full_name, user.email, user.mobile, user.roll_no, user.user_type, user.email_verified, user.profile_complete]);
      
      const userId = result.rows[0].id;
      console.log(`     ✅ Created user: ${user.full_name} (ID: ${userId})`);
      
      // Insert profile data based on user type
      if (user.user_type === 'alumni') {
        await query(`
          INSERT INTO alumni_profiles (user_id, age, passing_year, branch, program, is_employed, employer, position, location)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [userId, 25, 2022, 'Computer Science', 'B.Tech', true, 'Tech Corp', 'Software Engineer', 'Delhi']);
        console.log(`     📋 Created alumni profile for ${user.full_name}`);
      } else if (user.user_type === 'student') {
        await query(`
          INSERT INTO student_profiles (user_id, current_year, branch, program, semester, cgpa)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, 3, 'Computer Science', 'B.Tech', 6, 8.5]);
        console.log(`     📋 Created student profile for ${user.full_name}`);
      }
    } catch (error) {
      console.log(`     ❌ Error creating user ${user.full_name}: ${error.message}`);
    }
  }
}

async function verifyMigration() {
  // Check table counts
  const tables = ['users', 'alumni_profiles', 'student_profiles', 'otp_logs'];
  
  for (const table of tables) {
    try {
      const result = await query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   📊 ${table}: ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Error checking ${table}: ${error.message}`);
    }
  }
  
  // Check user data
  console.log('\n   👥 Sample user data:');
  const users = await query(`
    SELECT u.id, u.full_name, u.email, u.user_type, u.email_verified, u.profile_complete
    FROM users u
    ORDER BY u.id
    LIMIT 5
  `);
  
  users.rows.forEach(user => {
    console.log(`     • ID: ${user.id}, Name: ${user.full_name}, Type: ${user.user_type}, Email: ${user.email}`);
  });
}

// Run the migration
if (require.main === module) {
  performFreshMigration();
}

module.exports = { performFreshMigration };
