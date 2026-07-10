const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gbpantalumni',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_db_password',
});

async function fixOTPConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing OTP sessions constraint...');
    
    // Drop the existing check constraint
    await client.query(`
      ALTER TABLE otp_sessions DROP CONSTRAINT IF EXISTS otp_sessions_otp_type_check;
    `);
    console.log('✅ Dropped existing constraint');
    
    // Add the updated constraint with 'set_password' included
    await client.query(`
      ALTER TABLE otp_sessions ADD CONSTRAINT otp_sessions_otp_type_check 
      CHECK (otp_type IN ('signup', 'login', 'password_reset', 'set_password'));
    `);
    console.log('✅ Added updated constraint with set_password');
    
    // Verify the constraint was updated
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'otp_sessions'::regclass 
      AND conname = 'otp_sessions_otp_type_check';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Constraint updated successfully:');
      console.log(`   Name: ${result.rows[0].conname}`);
      console.log(`   Definition: ${result.rows[0].definition}`);
    }
    
    console.log('🎉 OTP constraint fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing OTP constraint:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  fixOTPConstraint()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixOTPConstraint;
