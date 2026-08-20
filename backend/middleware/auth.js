const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ JWT verification failed:', err.message);
      
      // Return 401 for expired tokens to trigger proper frontend handling
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // Return 401 for invalid tokens too (not 403)
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    console.log('✅ JWT verified for user:', user.email);
    req.user = user;
    next();
  });
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    userType: user.user_type,
    profileComplete: user.profile_complete || false,
    isApproved: user.is_approved || false
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

/**
 * Verify JWT token (utility function)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Admin Only Middleware
 * Ensures only admin users can access certain routes
 */
const adminOnly = (req, res, next) => {
  // This middleware should be used after authenticateToken
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  // Check if user is admin
  if (!adminEmail || req.user.email !== adminEmail) {
    console.log('❌ Admin access denied for user:', req.user?.email);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  console.log('✅ Admin access granted for:', req.user.email);
  next();
};

module.exports = {
  authenticateToken,
  generateToken,
  verifyToken,
  adminOnly
};
