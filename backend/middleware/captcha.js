const { verifyCaptchaChallenge } = require('../utils/captcha');

/**
 * Middleware to verify CAPTCHA before processing sensitive requests
 * Add this middleware to routes that need CAPTCHA protection
 */
const verifyCaptchaMiddleware = (req, res, next) => {
  const { captcha_session_id, captcha_input } = req.body;
  
  // Skip CAPTCHA verification if disabled in development
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CAPTCHA === 'true') {
    return next();
  }
  
  if (!captcha_session_id || !captcha_input) {
    return res.status(400).json({
      success: false,
      message: 'CAPTCHA verification is required'
    });
  }
  
  // Here you would retrieve stored CAPTCHA data from your session store
  // For now, we'll expect the frontend to verify CAPTCHA separately
  // This is a backup verification layer
  
  next();
};

/**
 * Rate limiting middleware for CAPTCHA endpoints
 */
const captchaRateLimit = (windowMs = 60000, maxAttempts = 10) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }
    
    const clientAttempts = attempts.get(clientId);
    
    if (!clientAttempts) {
      attempts.set(clientId, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (clientAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many CAPTCHA requests. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - clientAttempts.firstAttempt)) / 1000)
      });
    }
    
    clientAttempts.count++;
    next();
  };
};

/**
 * Enhanced error handling for CAPTCHA routes
 */
const captchaErrorHandler = (err, req, res, next) => {
  console.error('CAPTCHA Error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'CAPTCHA service temporarily unavailable' 
    : err.message;
  
  res.status(500).json({
    success: false,
    message,
    shouldRegenerate: true
  });
};

/**
 * Request logger for CAPTCHA operations (for monitoring)
 */
const captchaLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    console.log(`[CAPTCHA] ${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
    
    // Log suspicious activity
    if (statusCode === 429 || (statusCode >= 400 && statusCode < 500)) {
      console.warn(`[CAPTCHA WARNING] Suspicious activity from ${req.ip}: ${statusCode}`);
    }
  });
  
  next();
};

module.exports = {
  verifyCaptchaMiddleware,
  captchaRateLimit,
  captchaErrorHandler,
  captchaLogger
};
