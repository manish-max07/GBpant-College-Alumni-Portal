const jwt = require('jsonwebtoken');

/**
 * JWT Token Debugging Utilities
 */
class TokenValidator {
  
  /**
   * Decode JWT token without verification (for debugging)
   */
  static decodeToken(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      return decoded;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration info
   */
  static getTokenInfo(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        return { error: 'Invalid token format' };
      }

      const now = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp < now;
      const timeToExpiry = decoded.exp - now;
      
      return {
        payload: decoded,
        isExpired,
        expiresAt: new Date(decoded.exp * 1000),
        timeToExpiry: timeToExpiry > 0 ? timeToExpiry : 0,
        timeToExpiryHuman: timeToExpiry > 0 ? TokenValidator.formatDuration(timeToExpiry) : 'Expired'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Verify token with detailed error info
   */
  static verifyTokenDetailed(token, secret) {
    try {
      const verified = jwt.verify(token, secret);
      return {
        valid: true,
        payload: verified,
        message: 'Token is valid'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.name,
        message: error.message,
        details: TokenValidator.getErrorDetails(error)
      };
    }
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes`;
    } else {
      return `${Math.floor(seconds / 3600)} hours`;
    }
  }

  /**
   * Get detailed error information
   */
  static getErrorDetails(error) {
    switch (error.name) {
      case 'TokenExpiredError':
        return 'The token has expired and needs to be refreshed';
      case 'JsonWebTokenError':
        return 'The token is malformed or invalid';
      case 'NotBeforeError':
        return 'The token is not active yet';
      default:
        return 'Unknown token error';
    }
  }

  /**
   * Debug middleware for logging token issues
   */
  static debugMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('\n🔍 JWT Debug Info:');
    console.log('================');
    console.log('URL:', req.method, req.originalUrl);
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (token) {
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
      
      const tokenInfo = TokenValidator.getTokenInfo(token);
      console.log('Token Info:', tokenInfo);
      
      const verification = TokenValidator.verifyTokenDetailed(token, process.env.JWT_SECRET);
      console.log('Verification:', verification);
    } else {
      console.log('No token provided');
    }
    console.log('================\n');
    
    next();
  }
}

module.exports = TokenValidator;
