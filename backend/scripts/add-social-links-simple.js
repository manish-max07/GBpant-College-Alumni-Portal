/**
 * 🔗 Simple Migration Script: Add LinkedIn and GitHub links to student_profiles
 * Created: August 26, 2025
 * Description: Adds social media link columns to student_profiles table on Render
 */

const { Pool } = require('pg');

// Database configuration for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@your-db-host.oregon-postgres.render.com/your_render_db',
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});

async function testAndMigrate() {
  let client;
  
  try {
    console.log('🔌 Testing database connection...');
    client = await pool.connect();
    console.log('✅ Successfully connected to Render database');
    
    // Test basic query
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Database time:', testResult.rows[0].current_time);
    
    // Check if student_profiles table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'student_profiles'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ student_profiles table not found!');
      return;
    }
    
    console.log('✅ student_profiles table found');
    
    // Check current columns
    const currentColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current columns in student_profiles:');
    currentColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Check if social media columns already exist
    const socialColumns = currentColumns.rows.filter(row => 
      row.column_name === 'linkedin_profile' || row.column_name === 'github_profile'
    );
    
    if (socialColumns.length > 0) {
      console.log('⚠️  Social media columns already exist:');
      socialColumns.forEach(col => console.log(`  - ${col.column_name}`));
      return;
    }
    
    // Add the columns
    console.log('🚀 Adding LinkedIn and GitHub columns...');
    
    await client.query('BEGIN');
    
    console.log('📝 Adding linkedin_profile column...');
    await client.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN linkedin_profile VARCHAR(255)
    `);
    
    console.log('📝 Adding github_profile column...');
    await client.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN github_profile VARCHAR(255)
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Columns added successfully!');
    
    // Verify the addition
    const updatedColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles' 
      AND column_name IN ('linkedin_profile', 'github_profile')
    `);
    
    console.log('🔗 New social media columns:');
    updatedColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError.message);
      }
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Execute the script
testAndMigrate()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
