require('dotenv').config();
const express = require('express');
const cors = require('cors');
const captchaRoutes = require('./routes/captcha');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const debugRoutes = require('./routes/debug');
const securityRoutes = require('./routes/security');
const { captchaRateLimit, captchaErrorHandler, captchaLogger } = require('./middleware/captcha');
const { authDatabaseBlocking, generalDatabaseBlocking, getCacheStats } = require('./middleware/database-blocking');
const { authenticateToken, adminOnly } = require('./middleware/auth');
const { 
  securityHeaders, 
  environmentSecurity, 
  sensitiveEndpointLimiter,
  sanitizeRequest,
  productionErrorHandler,
  validateJWTStructure
} = require('./middleware/security');
const { testConnection } = require('./config/database');
const DatabaseManager = require('./utils/database-manager');
const TokenValidator = require('./utils/token-validator');
const { ipDebugMiddleware, securityIPLogging } = require('./utils/ip-detection');

// Log environment information at startup
console.log('🚀 Server starting up...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('📊 Database config check:', {
  DATABASE_URL_exists: !!process.env.DATABASE_URL,
  DATABASE_URL_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
  DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
  DB_NAME: process.env.DB_NAME ? 'set' : 'not set'
});

const app = express();

// ✅ CRITICAL: Trust proxy to get real client IPs on Render
// Trust all proxies (for Render and other cloud platforms)
app.set('trust proxy', true);

// Apply security middleware first
if (process.env.NODE_ENV === 'production') {
  app.use(securityHeaders());
}
app.use(environmentSecurity);
app.use(sanitizeRequest);

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['https://your-frontend-domain.com'])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IP Detection and Logging Middleware
app.use(securityIPLogging); // Always log security-related requests
if (process.env.DEBUG_IPS === 'true') {
  app.use(ipDebugMiddleware); // Only when debugging is enabled
}

// General database blocking for all routes (IP blocking only)
app.use(generalDatabaseBlocking);

// JWT structure validation for protected routes
app.use('/api/profile', validateJWTStructure);
app.use('/api/auth/me', validateJWTStructure);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const dbStatus = await DatabaseManager.getStatus();
    
    res.json({
      success: true,
      message: 'GBPANT Alumni Portal Backend is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        tables: dbStatus.connected ? dbStatus.tableCount : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Environment diagnostic endpoint (for debugging production issues)
// SECURITY: Removed sensitive information exposure
app.get('/api/env-check', sensitiveEndpointLimiter(15 * 60 * 1000, 3), (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Limited information in production
    res.json({
      success: true,
      message: 'Environment diagnostic',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        database_connected: true, // Generic status
        timestamp: new Date().toISOString()
      }
    });
  } else {
    // Detailed info only in development
    res.json({
      success: true,
      message: 'Environment diagnostic (Development Only)',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL_exists: !!process.env.DATABASE_URL,
        DB_HOST: process.env.DB_HOST ? 'configured' : 'not configured',
        DB_NAME: process.env.DB_NAME ? 'configured' : 'not configured',
        DB_USER: process.env.DB_USER ? 'configured' : 'not configured',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'not configured',
        PORT: process.env.PORT || 5000
      },
      timestamp: new Date().toISOString(),
      warning: 'Detailed information only available in development'
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const status = await DatabaseManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database status check failed',
      error: error.message
    });
  }
});

// Database blocking cache status endpoint
app.get('/api/database/blocking-status', (req, res) => {
  try {
    const cacheStats = getCacheStats();
    res.json({
      success: true,
      message: 'Database blocking cache status',
      data: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get blocking cache status',
      error: error.message
    });
  }
});

// IP detection diagnostic endpoint (ADMIN ONLY - for debugging IP blocking issues)
app.get('/api/debug/ip-detection', authenticateToken, adminOnly, (req, res) => {
  try {
    const possibleIPs = [];
    
    if (req.headers['x-forwarded-for']) {
      const forwardedIPs = req.headers['x-forwarded-for'].split(',').map(ip => ip.trim());
      possibleIPs.push(...forwardedIPs);
    }
    
    if (req.headers['x-real-ip']) {
      possibleIPs.push(req.headers['x-real-ip'].trim());
    }
    
    if (req.ip) {
      possibleIPs.push(req.ip);
    }
    
    if (req.connection && req.connection.remoteAddress) {
      possibleIPs.push(req.connection.remoteAddress);
    }
    
    if (req.socket && req.socket.remoteAddress) {
      possibleIPs.push(req.socket.remoteAddress);
    }
    
    const uniqueIPs = [...new Set(possibleIPs)];
    const { getCacheStats } = require('./middleware/database-blocking');
    const cacheStats = getCacheStats();
    
    res.json({
      success: true,
      message: 'IP detection diagnostic (admin only)',
      data: {
        detectedIPs: uniqueIPs,
        primaryIP: uniqueIPs[0] || 'unknown',
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'user-agent': req.headers['user-agent']
        },
        blockedIPs: Array.from(cacheStats.ips || []),
        isAnyIPBlocked: uniqueIPs.some(ip => (cacheStats.ips || new Set()).has && (cacheStats.ips || new Set()).has(ip))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get IP detection info',
      error: error.message
    });
  }
});

// Manual cache refresh endpoint for testing (DISABLED IN PRODUCTION)
/*
app.post('/api/database/refresh-blocking-cache', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested');
    const { manualRefreshCache } = require('./middleware/database-blocking');
    await manualRefreshCache();
    const cacheStats = getCacheStats();
    res.json({
      success: true,
      message: 'Database blocking cache refreshed successfully',
      data: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh blocking cache',
      error: error.message
    });
  }
});
*/

// CAPTCHA routes with middleware
app.use('/api/captcha', 
  captchaLogger,           // Log all CAPTCHA requests
  captchaRateLimit(),      // Rate limiting (10 requests per minute by default)
  captchaRoutes,           // CAPTCHA routes
  captchaErrorHandler      // Error handling
);

// Database blocking middleware - CRITICAL: Must be before auth routes
console.log('🛡️  Applying database blocking middleware...');
app.use('/api/auth', authDatabaseBlocking); // Check both IP and email blocking for auth routes

// Authentication routes
app.use('/api/auth', authRoutes);

// Security monitoring routes (with rate limiting)
app.use('/api/security', sensitiveEndpointLimiter(5 * 60 * 1000, 10), securityRoutes);

// Debug routes (admin-only in production)
if (process.env.NODE_ENV !== 'production') {
  // In development, allow all debug routes
  app.use('/api/debug', debugRoutes);
} else {
  // In production, only allow admin access
  const jwt = require('jsonwebtoken');
  
  const adminOnlyDebug = (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Debug endpoints are disabled in production'
        });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const adminEmail = process.env.ADMIN_EMAIL;
      
      // Only allow specific admin email
      if (!adminEmail || decoded.email !== adminEmail) {
        return res.status(404).json({
          success: false,
          message: 'Debug endpoints are disabled in production'
        });
      }
      
      next();
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Debug endpoints are disabled in production'
      });
    }
  };
  
  app.use('/api/debug', adminOnlyDebug, debugRoutes);
}

// Test JWT endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-auth', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.json({
        success: false,
        message: 'No token provided',
        hasToken: false
      });
    }

    const tokenInfo = TokenValidator.getTokenInfo(token);
    const verification = TokenValidator.verifyTokenDetailed(token, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      message: 'Token analysis complete (Development Only)',
      hasToken: true,
      tokenInfo,
      verification,
      jwtSecret: process.env.JWT_SECRET ? 'Configured' : 'Missing'
    });
  });
} else {
  app.get('/api/test-auth', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Test endpoints are disabled in production'
    });
  });
}

// Protected profile routes with debug logging
if (process.env.NODE_ENV === 'development') {
  app.use('/api/profile', TokenValidator.debugMiddleware);
}
app.use('/api/profile', profileRoutes);

// Admin-only blocked entities management routes
const blockedEntitiesRoutes = require('./routes/blocked-entities');
app.use('/api/admin/blocked-entities', blockedEntitiesRoutes);

// Global error handler (must be last middleware before catch-all)
app.use(productionErrorHandler);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(404).json({
    success: false,
    message: isProduction ? 'Route not found' : `Route ${req.method} ${req.originalUrl} not found`,
    ...(isProduction ? {} : {
      availableRoutes: [
        'GET /api/health',
        'GET /api/env-check',
        'GET /api/database/status',
        'POST /api/captcha/generate',
        'POST /api/captcha/verify',
        'GET /api/captcha/stats',
        'POST /api/auth/signup',
        'POST /api/auth/verify-otp', 
        'POST /api/auth/set-password',
        'POST /api/auth/login',
        'POST /api/auth/verify-login-otp',
        'POST /api/auth/resend-otp',
        'GET /api/profile/me',
        'GET /api/profile/alumni',
        'PUT /api/profile/alumni',
        'GET /api/profile/student',
        'PUT /api/profile/student'
      ]
    })
  });
});

// Environment configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 GBPANT Alumni Portal Backend Server');
  console.log('====================================');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`  🔍 Health Check: GET http://localhost:${PORT}/api/health`);
  console.log(`  🗄️  Database Status: GET http://localhost:${PORT}/api/database/status`);
  console.log(`  🔒 CAPTCHA Generate: POST http://localhost:${PORT}/api/captcha/generate`);
  console.log(`  ✅ CAPTCHA Verify: POST http://localhost:${PORT}/api/captcha/verify`);
  console.log(`  📊 CAPTCHA Stats: GET http://localhost:${PORT}/api/captcha/stats`);
  console.log('');
  console.log('🔐 Authentication Endpoints:');
  console.log(`  📝 Signup: POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`  ✅ Verify OTP: POST http://localhost:${PORT}/api/auth/verify-otp`);
  console.log(`  🔑 Set Password: POST http://localhost:${PORT}/api/auth/set-password`);
  console.log(`  🚪 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  ✅ Verify Login OTP: POST http://localhost:${PORT}/api/auth/verify-login-otp`);
  console.log(`  🔄 Resend OTP: POST http://localhost:${PORT}/api/auth/resend-otp`);
  console.log(`  🔒 Forgot Password: POST http://localhost:${PORT}/api/auth/forgot-password`);
  console.log(`  ✅ Verify Reset OTP: POST http://localhost:${PORT}/api/auth/verify-reset-otp`);
  console.log(`  🔄 Resend Reset OTP: POST http://localhost:${PORT}/api/auth/resend-reset-otp`);
  console.log(`  🔑 Reset Password: POST http://localhost:${PORT}/api/auth/reset-password`);
  console.log('');
  console.log('�️  Security & Blocking Endpoints:');
  console.log(`  📊 Blocking Cache Status: GET http://localhost:${PORT}/api/database/blocking-status`);
  console.log(`  🔒 Admin Blocked Entities: /api/admin/blocked-entities/*`);
  console.log('');
  console.log('�👤 Protected Profile Endpoints:');
  console.log(`  👤 Get Profile: GET http://localhost:${PORT}/api/profile/me`);
  console.log(`  🎓 Alumni Profile: GET/PUT http://localhost:${PORT}/api/profile/alumni`);
  console.log(`  📚 Student Profile: GET/PUT http://localhost:${PORT}/api/profile/student`);
  console.log('');
  console.log('✅ JWT Authentication System Active');
  console.log('✅ Password Hashing with bcrypt');
  console.log('✅ Email OTP Verification');
  console.log('✅ CAPTCHA Security Integration');
  console.log('✅ Database-Based IP/Email/Domain Blocking Active');
  console.log('✅ Hardcoded Security Rules Active (temp emails, etc.)');
});

module.exports = app;
