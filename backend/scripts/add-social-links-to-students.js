/**
 * 🔗 Migration Script: Add LinkedIn and GitHub links to student_profiles
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

async function addSocialLinksToStudents() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration to add social media links to student_profiles...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles' 
      AND column_name IN ('linkedin_profile', 'github_profile')
    `);
    
    if (checkColumns.rows.length > 0) {
      console.log('⚠️  Social media columns already exist in student_profiles table');
      console.log('Existing columns:', checkColumns.rows.map(row => row.column_name));
      await client.query('ROLLBACK');
      return;
    }
    
    // Add LinkedIn profile column
    console.log('📝 Adding linkedin_profile column...');
    await client.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN linkedin_profile VARCHAR(255)
    `);
    
    // Add GitHub profile column
    console.log('📝 Adding github_profile column...');
    await client.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN github_profile VARCHAR(255)
    `);
    
    // Add comments
    console.log('📋 Adding column comments...');
    await client.query(`
      COMMENT ON COLUMN student_profiles.linkedin_profile IS 'LinkedIn profile URL for networking'
    `);
    
    await client.query(`
      COMMENT ON COLUMN student_profiles.github_profile IS 'GitHub profile URL for code portfolio'
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('🔗 LinkedIn and GitHub columns added to student_profiles table');
    
    // Verify the changes
    console.log('\n📊 Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current student_profiles table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Execute migration
addSocialLinksToStudents()
  .then(() => {
    console.log('\n🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error);
    process.exit(1);
  });
