const { query } = require('../config/database');

async function checkDatabaseStructure() {
  console.log('🔍 Checking actual database structure...');
  
  try {
    // Check what tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Available tables:');
    tables.rows.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    // Check users table structure
    const userColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n👤 Users table structure:');
    userColumns.rows.forEach(col => {
      console.log(`  📋 ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // Check alumni_profiles table structure if it exists
    try {
      const alumniColumns = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'alumni_profiles' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n🎓 Alumni_profiles table structure:');
      alumniColumns.rows.forEach(col => {
        console.log(`  📋 ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
      });
    } catch (e) {
      console.log('\n⚠️  Alumni_profiles table structure not accessible');
    }
    
    // Count existing data in each table
    console.log('\n📈 Current data counts:');
    
    const userCount = await query('SELECT COUNT(*) FROM users');
    console.log(`  👥 Users: ${userCount.rows[0].count}`);
    
    try {
      const alumniCount = await query('SELECT COUNT(*) FROM alumni_profiles');
      console.log(`  🎓 Alumni: ${alumniCount.rows[0].count}`);
    } catch (e) {
      console.log('  🎓 Alumni: Not accessible');
    }
    
    try {
      const studentCount = await query('SELECT COUNT(*) FROM student_profiles');
      console.log(`  📚 Students: ${studentCount.rows[0].count}`);
    } catch (e) {
      console.log('  📚 Students: Not accessible');
    }
    
    try {
      const otpCount = await query('SELECT COUNT(*) FROM otp_logs');
      console.log(`  🔐 OTP Logs: ${otpCount.rows[0].count}`);
    } catch (e) {
      console.log('  🔐 OTP Logs: Not accessible');
    }
    
    // Show sample data if any exists
    console.log('\n📋 Sample users data:');
    const sampleUsers = await query('SELECT id, full_name, email, user_type FROM users LIMIT 3');
    if (sampleUsers.rows.length > 0) {
      sampleUsers.rows.forEach(user => {
        console.log(`  👤 ${user.full_name} (${user.email}) - ${user.user_type} [ID: ${user.id}]`);
      });
    } else {
      console.log('  📭 No users found');
    }
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
  }
}

checkDatabaseStructure();
