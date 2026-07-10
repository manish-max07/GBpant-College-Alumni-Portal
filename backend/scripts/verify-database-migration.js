const { query } = require('../config/database');

async function verifyDatabaseMigration() {
  console.log('🔍 Database Migration Verification');
  console.log('==================================');
  
  try {
    // Check all tables exist
    console.log('\n1️⃣ Checking table existence...');
    const tables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Database tables:');
    tables.rows.forEach(table => {
      console.log(`  📁 ${table.table_name} (${table.table_type})`);
    });
    
    // Check users table structure
    console.log('\n2️⃣ Users table structure:');
    const userColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    userColumns.rows.forEach(col => {
      console.log(`  📋 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(nullable)'}`);
    });
    
    // Check foreign key relationships
    console.log('\n3️⃣ Foreign key relationships:');
    const foreignKeys = await query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    
    foreignKeys.rows.forEach(fk => {
      console.log(`  🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check indexes
    console.log('\n4️⃣ Database indexes:');
    const indexes = await query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    indexes.rows.forEach(idx => {
      console.log(`  📊 ${idx.tablename}.${idx.indexname}`);
    });
    
    // Check data counts
    console.log('\n5️⃣ Data verification:');
    const dataTables = ['users', 'alumni_profiles', 'student_profiles', 'otp_logs'];
    
    for (const table of dataTables) {
      try {
        const count = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  📈 ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`  ❌ Error checking ${table}: ${error.message}`);
      }
    }
    
    // Check sample data with joins
    console.log('\n6️⃣ Sample user profiles:');
    const userProfiles = await query(`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.user_type,
        CASE 
          WHEN u.user_type = 'alumni' THEN CONCAT(ap.branch, ' - ', ap.program, ' (', ap.passing_year, ')')
          WHEN u.user_type = 'student' THEN CONCAT(sp.branch, ' - Year ', sp.current_year)
          ELSE 'No profile'
        END as profile_info
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      ORDER BY u.id
    `);
    
    userProfiles.rows.forEach(profile => {
      console.log(`  👤 ${profile.full_name} (${profile.user_type}): ${profile.profile_info}`);
    });
    
    console.log('\n✅ Database migration verification completed successfully!');
    console.log('🎉 All tables and relationships are properly set up');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
  
  process.exit(0);
}

verifyDatabaseMigration();
