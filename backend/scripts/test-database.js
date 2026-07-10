const { testConnection, getDatabaseInfo } = require('../config/database');
const DatabaseManager = require('../utils/database-manager');

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection');
  console.log('=============================');

  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('❌ Connection failed. Please check:');
      console.log('   - PostgreSQL is running');
      console.log('   - Database "gbpantalumni" exists');
      console.log('   - Credentials in .env file are correct');
      console.log('   - User has proper permissions');
      return false;
    }

    // Get database information
    console.log('\n2️⃣ Getting database information...');
    const dbInfo = await getDatabaseInfo();
    console.log(`   ✅ Database: ${dbInfo.database}`);
    console.log(`   ✅ Host: ${dbInfo.host}:${dbInfo.port}`);
    console.log(`   ✅ Tables: ${dbInfo.tableCount}`);

    // Check tables
    console.log('\n3️⃣ Checking table status...');
    const tables = await DatabaseManager.listTables();
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. Run database setup:');
      console.log('      npm run setup-db');
    } else {
      console.log(`   ✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`      - ${table.table_name} (${table.table_type})`);
      });
    }

    // Test queries
    console.log('\n4️⃣ Testing sample queries...');
    
    const requiredTables = ['users', 'otp', 'alumniprofile', 'studentprofile'];
    let allTablesExist = true;
    
    for (const tableName of requiredTables) {
      try {
        const count = await DatabaseManager.getTableCount(tableName);
        console.log(`   ✅ ${tableName}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: Table not found`);
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      console.log('\n🎉 Database connection test successful!');
      console.log('\n📋 Next steps:');
      console.log('   - Your database is ready to use');
      console.log('   - Start your backend server: npm run dev');
      console.log('   - Test your API endpoints');
    } else {
      console.log('\n⚠️  Some tables are missing. Run setup:');
      console.log('   npm run setup-db');
    }

    return true;

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check PostgreSQL service is running');
    console.log('2. Verify .env configuration:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log('   DB_NAME=gbpantalumni');
    console.log('   DB_USER=postgres');
    console.log('   DB_PASSWORD=your_password');
    console.log('3. Test PostgreSQL connection manually:');
    console.log('   psql -h localhost -U postgres -d gbpantalumni');
    
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testDatabaseConnection };
