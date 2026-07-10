const { query, testConnection, getDatabaseInfo, tableExists } = require('../config/database');

// Database utility functions
class DatabaseManager {
  
  // Check database status
  static async getStatus() {
    try {
      const isConnected = await testConnection();
      if (!isConnected) return { connected: false };

      const info = await getDatabaseInfo();
      const tables = await this.listTables();
      
      return {
        connected: true,
        info,
        tables,
        tableCount: tables.length
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  // List all tables in the database
  static async listTables() {
    try {
      const result = await query(`
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      return result.rows;
    } catch (error) {
      console.error('Error listing tables:', error.message);
      return [];
    }
  }

  // Get table schema information
  static async getTableSchema(tableName) {
    try {
      const result = await query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName.toLowerCase()]);
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting schema for table ${tableName}:`, error.message);
      return [];
    }
  }

  // Count records in a table
  static async getTableCount(tableName) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Error counting records in ${tableName}:`, error.message);
      return 0;
    }
  }

  // Get all table counts
  static async getAllTableCounts() {
    const tables = ['users', 'otp_logs', 'alumni_profiles', 'student_profiles'];
    const counts = {};
    
    for (const table of tables) {
      counts[table] = await this.getTableCount(table);
    }
    
    return counts;
  }

  // Reset database (drop and recreate tables)
  static async resetDatabase() {
    try {
      const resetSQL = `
        -- Drop all tables
        DROP TABLE IF EXISTS StudentProfile CASCADE;
        DROP TABLE IF EXISTS AlumniProfile CASCADE;
        DROP TABLE IF EXISTS OTP CASCADE;
        DROP TABLE IF EXISTS Users CASCADE;
      `;
      
      await query(resetSQL);
      console.log('✅ Database tables dropped successfully');
      return true;
    } catch (error) {
      console.error('❌ Error resetting database:', error.message);
      return false;
    }
  }

  // Clean up expired OTPs
  static async cleanupExpiredOTPs() {
    try {
      const result = await query(`
        DELETE FROM otp_logs 
        WHERE expires_at < CURRENT_TIMESTAMP OR is_verified = TRUE
      `);
      
      console.log(`✅ Cleaned up ${result.rowCount} expired/used OTPs`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error cleaning up OTPs:', error.message);
      return 0;
    }
  }

  // Get recent activities
  static async getRecentActivities(limit = 10) {
    try {
      const users = await query(`
        SELECT Email, FullName, CreatedAt, 'User Registration' as activity
        FROM Users 
        ORDER BY CreatedAt DESC 
        LIMIT $1
      `, [limit]);

      const otps = await query(`
        SELECT Email, CreatedAt, 'OTP Generated' as activity
        FROM OTP 
        ORDER BY CreatedAt DESC 
        LIMIT $1
      `, [limit]);

      const activities = [...users.rows, ...otps.rows]
        .sort((a, b) => new Date(b.createdat) - new Date(a.createdat))
        .slice(0, limit);

      return activities;
    } catch (error) {
      console.error('Error getting recent activities:', error.message);
      return [];
    }
  }

  // Database health check
  static async healthCheck() {
    try {
      console.log('🔍 Running Database Health Check...');
      console.log('==================================');

      // Connection test
      const connected = await testConnection();
      console.log(`Connection: ${connected ? '✅ OK' : '❌ Failed'}`);

      if (!connected) return false;

      // Table existence check
      const requiredTables = ['users', 'otp_logs', 'alumni_profiles', 'student_profiles'];
      console.log('\n📋 Table Status:');
      
      for (const table of requiredTables) {
        const exists = await tableExists(table);
        console.log(`   ${table}: ${exists ? '✅ OK' : '❌ Missing'}`);
      }

      // Table counts
      console.log('\n📊 Record Counts:');
      const counts = await this.getAllTableCounts();
      for (const [table, count] of Object.entries(counts)) {
        console.log(`   ${table}: ${count} records`);
      }

      // Cleanup expired OTPs
      console.log('\n🧹 Cleanup:');
      const cleanedOTPs = await this.cleanupExpiredOTPs();

      console.log('\n✅ Health check completed!');
      return true;

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }
}

module.exports = DatabaseManager;
