/**
 * Secure IP Detection Utility for Production
 * 
 * This module provides secure IP detection for Express.js apps deployed on Render.
 * It properly handles proxy headers while maintaining security best practices.
 */

/**
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * @param {string} ip - The IP address to validate
 * @returns {boolean} - True if valid IP, false otherwise
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 validation - more strict than basic regex
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipv4Match = ip.match(ipv4Regex);
  if (ipv4Match) {
    // Ensure each octet is 0-255
    const octets = ipv4Match.slice(1).map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }
  
  // IPv6 validation (simplified but secure)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Regex.test(ip)) {
    return true;
  }
  
  // Special IPv6 cases
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:')) {
    return true;
  }
  
  return false;
}

/**
 * Safely extracts the real client IP from Express request
 * @param {Object} req - Express request object
 * @returns {string} - The client's real IP address
 */
function getClientIP(req) {
  // Method 1: X-Forwarded-For header (most common for proxies like Render)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // Take the first one (original client IP)
    const clientIP = xForwardedFor.split(',')[0].trim();
    
    if (isValidIP(clientIP)) {
      // Log for debugging (only in production with DEBUG_IPS=true)
      if (process.env.DEBUG_IPS === 'true') {
        console.log(`✅ Real client IP from X-Forwarded-For: ${clientIP}`);
      }
      return clientIP;
    }
  }

  // Method 2: Express req.ip (works when trust proxy is set correctly)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1' && isValidIP(req.ip)) {
    if (process.env.DEBUG_IPS === 'true') {
      console.log(`✅ Real IP from Express req.ip: ${req.ip}`);
    }
    return req.ip;
  }

  // Method 3: Other proxy headers (fallback)
  const alternativeHeaders = ['x-real-ip', 'x-client-ip', 'x-forwarded', 'forwarded-for', 'forwarded'];
  
  for (const header of alternativeHeaders) {
    const headerValue = req.headers[header];
    if (headerValue && isValidIP(headerValue)) {
      if (process.env.DEBUG_IPS === 'true') {
        console.log(`✅ Real IP from ${header}: ${headerValue}`);
      }
      return headerValue;
    }
  }

  // Method 4: Connection remote address (fallback)
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress && remoteAddress !== '::1' && remoteAddress !== '127.0.0.1' && isValidIP(remoteAddress)) {
    if (process.env.DEBUG_IPS === 'true') {
      console.log(`✅ Real IP from connection: ${remoteAddress}`);
    }
    return remoteAddress;
  }

  // Fallback: localhost (development or when real IP can't be determined)
  if (process.env.DEBUG_IPS === 'true') {
    console.log(`⚠️ No real IP detected, using localhost fallback`);
  }
  return '::1';
}

/**
 * Enhanced IP logging middleware for production debugging
 * Only runs when DEBUG_IPS environment variable is set to 'true'
 */
function ipDebugMiddleware(req, res, next) {
  // Only run if explicitly enabled
  if (process.env.DEBUG_IPS !== 'true') {
    return next();
  }
  
  // Only log for API requests, not static files
  if (req.path.includes('.') || req.path.includes('favicon') || req.path.includes('static')) {
    return next();
  }
  
  const realIP = getClientIP(req);
  
  console.log('\n🔍 === IP DEBUG INFO ===');
  console.log(`📍 Real Client IP: ${realIP}`);
  console.log(`🌐 Express req.ip: ${req.ip}`);
  console.log(`🔗 X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'Not set'}`);
  console.log(`📡 User-Agent: ${req.headers['user-agent']?.substring(0, 100) || 'Not set'}`);
  console.log(`🛣️  Endpoint: ${req.method} ${req.path}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('========================\n');
  
  next();
}

/**
 * Production-safe IP logging middleware
 * Logs real IPs for security monitoring without debug info
 */
function securityIPLogging(req, res, next) {
  // Only log for authentication and security-critical endpoints
  const securityEndpoints = ['/api/auth/', '/api/profile/', '/api/debug/'];
  const isSecurityEndpoint = securityEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isSecurityEndpoint) {
    const realIP = getClientIP(req);
    console.log(`🛡️ Security Request: ${req.method} ${req.path} from IP: ${realIP}`);
  }
  
  next();
}

module.exports = {
  getClientIP,
  isValidIP,
  ipDebugMiddleware,
  securityIPLogging
};
