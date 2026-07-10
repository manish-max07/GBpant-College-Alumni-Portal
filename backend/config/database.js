const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - prioritize DATABASE_URL for production
let dbConfig;

console.log('🔍 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL_exists: !!process.env.DATABASE_URL,
  DATABASE_URL_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not found',
  DB_HOST: process.env.DB_HOST || 'not set',
  DB_NAME: process.env.DB_NAME || 'not set',
  DB_USER: process.env.DB_USER || 'not set',
  DB_PORT: process.env.DB_PORT || 'not set',
  DB_PASSWORD_SET: !!process.env.DB_PASSWORD
});

if (process.env.DATABASE_URL) {
  // Production: Use DATABASE_URL (Render, Heroku, etc.)
  console.log('🌐 Using DATABASE_URL for database connection');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Always use SSL for Render, even in development
  };
} else if (process.env.NODE_ENV === 'production') {
  // Production without DATABASE_URL - this shouldn't happen but let's handle it
  console.log('⚠️ PRODUCTION MODE BUT NO DATABASE_URL FOUND!');
  console.log('This indicates a configuration problem on your hosting platform.');
  
  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    console.log('🔧 Attempting to use individual database parameters...');
    dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    console.error('❌ CRITICAL: No database configuration available in production!');
    console.error('Please set DATABASE_URL or individual database environment variables.');
    console.error('Current environment variables:', {
      DB_HOST: process.env.DB_HOST || 'MISSING',
      DB_NAME: process.env.DB_NAME || 'MISSING',
      DB_USER: process.env.DB_USER || 'MISSING',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING'
    });
    
    // Don't exit the process, but log the error clearly
    throw new Error('Database configuration missing in production environment');
  }
} else {
  // Development: Use individual connection parameters
  console.log('🏠 Using individual database parameters for local development');
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gbpantalumni',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  };
}

// Create PostgreSQL connection pool
const pool = new Pool({
  ...dbConfig,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 10000, // Increased timeout for production
});

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      details: error.detail || 'No additional details'
    });
    
    // Log connection configuration (without sensitive data)
    if (process.env.DATABASE_URL) {
      console.log('🔧 Using DATABASE_URL connection');
    } else {
      console.log('🔧 Using individual parameters:', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'gbpantalumni',
        user: process.env.DB_USER || 'postgres'
      });
    }
    
    return false;
  }
};

// Execute a query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text: text.substring(0, 50) + '...', duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('❌ Failed to get database client:', error.message);
    throw error;
  }
};

// Close the pool
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Check if a table exists
const tableExists = async (tableName) => {
  try {
    const result = await query(
      'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2)',
      ['public', tableName.toLowerCase()]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`❌ Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
};

// Get database information
const getDatabaseInfo = async () => {
  try {
    const dbInfo = await query('SELECT version()');
    const tableCount = await query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return {
      version: dbInfo.rows[0].version,
      tableCount: tableCount.rows[0].table_count,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    };
  } catch (error) {
    console.error('❌ Error getting database info:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
  tableExists,
  getDatabaseInfo
};
