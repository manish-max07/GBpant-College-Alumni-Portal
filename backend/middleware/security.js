/**
 * Security Middleware for Production
 * Implements essential security headers and protections
 */

const helmet = require('helmet');

/**
 * Configure security headers
 */
const securityHeaders = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      },
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    frameguard: { action: 'deny' },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-XSS-Protection (legacy but still useful)
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: { policy: 'same-origin' },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // Permissions Policy (formerly Feature Policy)
    permittedCrossDomainPolicies: false
  });
};

/**
 * Environment-based security middleware
 */
const environmentSecurity = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Remove debug information in production
    res.removeHeader('X-Powered-By');
    
    // Add additional production security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
  
  next();
};

/**
 * Rate limiting for sensitive endpoints
 */
const sensitiveEndpointLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}_${req.originalUrl}`;
    const now = Date.now();
    
    let attemptData = attempts.get(key);
    if (!attemptData) {
      attemptData = { count: 0, windowStart: now };
      attempts.set(key, attemptData);
    }
    
    // Reset if window expired
    if (now - attemptData.windowStart > windowMs) {
      attemptData.count = 0;
      attemptData.windowStart = now;
    }
    
    attemptData.count++;
    
    if (attemptData.count > max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests to sensitive endpoint',
        retryAfter: Math.ceil((windowMs - (now - attemptData.windowStart)) / 1000)
      });
    }
    
    next();
  };
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous characters from inputs
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove script tags, SQL injection attempts, etc.
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

/**
 * Production error handler
 */
const productionErrorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log error for monitoring (but don't expose to user)
  console.error('Security Error:', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    error: err.message
  });
  
  if (isProduction) {
    // Generic error message for production
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } else {
    // Detailed error for development
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
};

/**
 * Secure session configuration
 */
const secureSessionConfig = {
  name: 'gbpant_session',
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
};

/**
 * Validate JWT token structure (additional security)
 */
const validateJWTStructure = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    // Check if token has valid JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    try {
      // Validate base64 encoding of header and payload
      JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Malformed token'
      });
    }
  }
  
  next();
};

/**
 * IP Whitelist for admin endpoints (optional)
 */
const adminIPWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // Skip if no whitelist configured
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Blocked admin access from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

module.exports = {
  securityHeaders,
  environmentSecurity,
  sensitiveEndpointLimiter,
  sanitizeRequest,
  productionErrorHandler,
  secureSessionConfig,
  validateJWTStructure,
  adminIPWhitelist
};
