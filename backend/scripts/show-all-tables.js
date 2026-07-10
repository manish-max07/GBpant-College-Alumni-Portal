const { query } = require('../config/database');

async function showAllTables() {
  try {
    console.log('🔍 Checking all tables in public schema...');
    
    const result = await query(`
      SELECT schemaname, tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📊 All tables in public schema:');
    result.rows.forEach(table => {
      console.log(`  📁 ${table.tablename} (owner: ${table.tableowner})`);
    });
    
    // Also check if there are any access permissions issues
    const permissionsResult = await query(`
      SELECT tablename, grantee, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'public' AND tablename = 'users'
    `);
    
    console.log('\n🔐 Users table permissions:');
    permissionsResult.rows.forEach(perm => {
      console.log(`  🔑 ${perm.grantee}: ${perm.privilege_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showAllTables();
