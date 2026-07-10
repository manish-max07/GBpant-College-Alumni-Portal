const { query } = require('../config/database');

async function verifyMigration() {
  console.log('🔍 Verifying Migration - Final Database Status');
  console.log('==============================================');
  
  try {
    // 1. Show table counts
    console.log('📊 Table Data Counts:');
    const tables = [
      { name: 'users', emoji: '👥' },
      { name: 'alumni_profiles', emoji: '🎓' },
      { name: 'student_profiles', emoji: '📚' },
      { name: 'otp_logs', emoji: '🔐' }
    ];
    
    for (const table of tables) {
      try {
        const count = await query(`SELECT COUNT(*) FROM ${table.name}`);
        console.log(`   ${table.emoji} ${table.name}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: Error accessing table`);
      }
    }
    
    // 2. Show users with their IDs and profile types
    console.log('\\n👥 All Users with Profile Types:');
    const usersWithProfiles = await query(`
      SELECT u.id, u.fullname, u.email, u.mobile,
        CASE 
          WHEN ap.user_id IS NOT NULL THEN 'Alumni' 
          WHEN sp.user_id IS NOT NULL THEN 'Student'
          ELSE 'No Profile'
        END as profile_type
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id  
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      ORDER BY u.id
    `);
    
    usersWithProfiles.rows.forEach(user => {
      const statusIcon = user.profile_type === 'Alumni' ? '🎓' : 
                        user.profile_type === 'Student' ? '📚' : '❓';
      console.log(`   ${statusIcon} ID: ${user.id} | ${user.fullname} | ${user.profile_type}`);
      console.log(`      📧 ${user.email} | 📱 ${user.mobile}`);
    });
    
    // 3. Show detailed alumni profiles
    console.log('\\n🎓 Alumni Profiles (Detailed):');
    const alumniDetails = await query(`
      SELECT u.fullname, u.email, ap.passing_year, ap.branch, ap.employer, 
             ap.position, ap.location, ap.experience
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      ORDER BY ap.passing_year DESC
    `);
    
    alumniDetails.rows.forEach(alum => {
      console.log(`   👨‍💼 ${alum.fullname} (${alum.passing_year})`);
      console.log(`      📧 ${alum.email}`);
      console.log(`      🏢 ${alum.position} at ${alum.employer}`);
      console.log(`      📍 ${alum.location} | 📚 ${alum.branch}`);
      console.log(`      💼 ${alum.experience?.substring(0, 60)}...`);
      console.log('');
    });
    
    // 4. Show detailed student profiles  
    console.log('\\n📚 Student Profiles (Detailed):');
    const studentDetails = await query(`
      SELECT u.fullname, u.email, sp.current_year, sp.semester, 
             sp.branch, sp.cgpa, sp.program
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      ORDER BY sp.cgpa DESC
    `);
    
    studentDetails.rows.forEach(student => {
      console.log(`   👨‍🎓 ${student.fullname} (Year ${student.current_year})`);
      console.log(`      📧 ${student.email}`);
      console.log(`      📚 ${student.branch} - ${student.program}`);  
      console.log(`      📊 Semester ${student.semester} | CGPA: ${student.cgpa}`);
      console.log('');
    });
    
    // 5. Show test credentials for API testing
    console.log('\\n🔑 Ready-to-Test Credentials:');
    console.log('================================');
    
    const testCredentials = await query(`
      SELECT u.id, u.fullname, u.email, u.mobile,
        CASE 
          WHEN ap.user_id IS NOT NULL THEN 'Alumni' 
          WHEN sp.user_id IS NOT NULL THEN 'Student'
          ELSE 'General'
        END as profile_type
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id  
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.email LIKE '%@%.%'
      ORDER BY profile_type, u.fullname
      LIMIT 10
    `);
    
    console.log('Alumni Test Accounts:');
    testCredentials.rows
      .filter(user => user.profile_type === 'Alumni')
      .forEach(user => {
        console.log(`   🎓 ${user.fullname}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      📱 Mobile: ${user.mobile}`);
        console.log(`      🆔 User ID: ${user.id}`);
        console.log('      ────────────────────────');
      });
    
    console.log('\\nStudent Test Accounts:');
    testCredentials.rows
      .filter(user => user.profile_type === 'Student')
      .forEach(user => {
        console.log(`   📚 ${user.fullname}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      📱 Mobile: ${user.mobile}`);
        console.log(`      🆔 User ID: ${user.id}`);
        console.log('      ────────────────────────');
      });
    
    // 6. Show sample JOIN queries for development
    console.log('\\n💻 Sample Queries for Your Backend:');
    console.log('====================================');
    
    console.log('Query 1 - Get Alumni with Details:');
    console.log(`
    SELECT u.id, u.fullname, u.email, ap.passing_year, ap.employer, ap.position
    FROM users u 
    JOIN alumni_profiles ap ON u.id = ap.user_id
    WHERE u.email = 'user@email.com'
    `);
    
    console.log('Query 2 - Get Student with Details:');
    console.log(`
    SELECT u.id, u.fullname, u.email, sp.current_year, sp.branch, sp.cgpa  
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.id = 123
    `);
    
    console.log('Query 3 - Get User Profile Type:');
    console.log(`
    SELECT u.*, 
      CASE WHEN ap.user_id IS NOT NULL THEN 'alumni' 
           WHEN sp.user_id IS NOT NULL THEN 'student' 
           ELSE 'unknown' END as user_type
    FROM users u
    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
    LEFT JOIN student_profiles sp ON u.id = sp.user_id  
    WHERE u.email = 'user@email.com'
    `);
    
    console.log('\\n✅ Migration Verification Complete!');
    console.log('\\n🎯 Next Steps:');
    console.log('   1. Check your pgAdmin - all tables should show data now');
    console.log('   2. Update your JWT auth to use user.id instead of user.email');  
    console.log('   3. Test API endpoints with the provided credentials');
    console.log('   4. Use the sample queries in your backend routes');
    console.log('   5. Start your backend server and test the application!');
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

if (require.main === module) {
  verifyMigration().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}
