const { pool } = require('../config/database');

// Cache for blocked entities to avoid database queries on every request
let blockedEntitiesCache = {
  ips: new Set(),
  emails: new Set(),
  domains: new Set(),
  lastUpdated: 0
};

// Function to refresh blocked entities cache from database
const refreshBlockedEntitiesCache = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Refreshing blocked entities cache...');
    }
    const query = `
      SELECT entity_type, entity_value 
      FROM blocked_entities 
      WHERE is_blocked = true 
      AND (
        is_permanent = true OR 
        (blocked_until IS NOT NULL AND blocked_until > NOW()) OR
        (expires_at IS NOT NULL AND expires_at > NOW())
      )
    `;
    
    const result = await pool.query(query);
    
    // Clear and rebuild cache
    blockedEntitiesCache.ips.clear();
    blockedEntitiesCache.emails.clear();
    blockedEntitiesCache.domains.clear();
    
    result.rows.forEach(row => {
      switch(row.entity_type) {
        case 'ip':
          blockedEntitiesCache.ips.add(row.entity_value);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🔴 Added IP to cache: ${row.entity_value}`);
          }
          break;
        case 'email':
          blockedEntitiesCache.emails.add(row.entity_value.toLowerCase());
          if (process.env.NODE_ENV !== 'production') {
            console.log(`📧 Added email to cache: ${row.entity_value}`);
          }
          break;
        case 'domain':
          blockedEntitiesCache.domains.add(row.entity_value.toLowerCase());
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🌐 Added domain to cache: ${row.entity_value}`);
          }
          break;
      }
    });
    
    blockedEntitiesCache.lastUpdated = Date.now();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Database blocked entities cache refreshed:', {
        ips: Array.from(blockedEntitiesCache.ips),
        emails: Array.from(blockedEntitiesCache.emails),
        domains: Array.from(blockedEntitiesCache.domains),
        total: result.rows.length
      });
    } else {
      console.log('✅ Database blocked entities cache refreshed:', {
        ips: blockedEntitiesCache.ips.size,
        emails: blockedEntitiesCache.emails.size,
        domains: blockedEntitiesCache.domains.size,
        total: result.rows.length
      });
    }
    
  } catch (error) {
    console.error('❌ Error refreshing blocked entities cache:', error);
  }
};

// Refresh cache every 30 seconds
setInterval(refreshBlockedEntitiesCache, 30 * 1000);
// Initial cache load
setTimeout(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Initial blocked entities cache load...');
  }
  refreshBlockedEntitiesCache();
}, 1000); // Wait 1 second after server start

// IP blocking middleware - checks database blocked IPs
const checkDatabaseBlockedIP = (req, res, next) => {
  // Get all possible IP addresses from the request
  const possibleIPs = [];
  
  // Primary IP sources (in order of priority)
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
  
  // Remove duplicates and filter out internal IPs for logging
  const uniqueIPs = [...new Set(possibleIPs)];
  const clientIP = uniqueIPs[0] || 'unknown';
  
  // Debug logging only in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 IP Detection Debug:`, {
      clientIP: clientIP,
      allDetectedIPs: uniqueIPs,
      headers: {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip']
      },
      cachedBlockedIPs: Array.from(blockedEntitiesCache.ips)
    });
  }
  
  // Check ALL possible IPs against the blocked list
  const blockedIP = uniqueIPs.find(ip => blockedEntitiesCache.ips.has(ip));
  
  if (blockedIP) {
    console.warn(`🚨 DATABASE BLOCKED IP ACCESS ATTEMPT:`, {
      blockedIP: blockedIP,
      allDetectedIPs: uniqueIPs,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip']
      }
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP address has been blocked by the administrator.',
      errorType: 'IP_BLOCKED_DATABASE',
      blockedIP: blockedIP,
      contactInfo: 'If you believe this is an error, please contact support.'
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ IPs ${uniqueIPs.join(', ')} allowed - not in blocked list`);
  }
  
  next();
};

// Email blocking middleware - checks database blocked emails and domains
const checkDatabaseBlockedEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(); // Skip if no email in request
  }

  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  
  // Check database blocked emails (cached)
  if (blockedEntitiesCache.emails.has(emailLower)) {
    console.warn(`🚨 DATABASE BLOCKED EMAIL ACCESS ATTEMPT:`, {
      email: emailLower,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({
      success: false,
      message: 'This email address has been blocked by the administrator and cannot be used for registration.',
      errorType: 'EMAIL_BLOCKED_DATABASE',
      blockedEmail: email,
      contactInfo: 'If you believe this is an error, please contact support.'
    });
  }
  
  // Check database blocked domains (cached)
  if (domain && blockedEntitiesCache.domains.has(domain)) {
    console.warn(`🚨 DATABASE BLOCKED DOMAIN ACCESS ATTEMPT:`, {
      email: emailLower,
      domain: domain,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({
      success: false,
      message: 'This email domain has been blocked by the administrator and cannot be used for registration.',
      errorType: 'DOMAIN_BLOCKED_DATABASE',
      blockedDomain: domain,
      contactInfo: 'If you believe this is an error, please contact support.'
    });
  }

  next();
};

// Combined middleware for both IP and email checking
const databaseBlockingMiddleware = (req, res, next) => {
  // First check IP blocking
  checkDatabaseBlockedIP(req, res, (err) => {
    if (err || res.headersSent) return;
    
    // Then check email/domain blocking (only for requests with email)
    checkDatabaseBlockedEmail(req, res, next);
  });
};

// Middleware specifically for auth routes (includes both IP and email checks)
const authDatabaseBlocking = (req, res, next) => {
  databaseBlockingMiddleware(req, res, next);
};

// Middleware specifically for general routes (only IP checks)
const generalDatabaseBlocking = (req, res, next) => {
  checkDatabaseBlockedIP(req, res, next);
};

// Export refresh function for manual cache refresh
const manualRefreshCache = () => {
  console.log('🔄 Manual cache refresh requested');
  return refreshBlockedEntitiesCache();
};

// Get current cache stats
const getCacheStats = () => {
  return {
    ips: blockedEntitiesCache.ips,
    emails: blockedEntitiesCache.emails,
    domains: blockedEntitiesCache.domains,
    counts: {
      ips: blockedEntitiesCache.ips.size,
      emails: blockedEntitiesCache.emails.size,
      domains: blockedEntitiesCache.domains.size
    },
    lastUpdated: blockedEntitiesCache.lastUpdated,
    lastUpdatedISO: new Date(blockedEntitiesCache.lastUpdated).toISOString()
  };
};

module.exports = {
  databaseBlockingMiddleware,
  authDatabaseBlocking,
  generalDatabaseBlocking,
  checkDatabaseBlockedIP,
  checkDatabaseBlockedEmail,
  manualRefreshCache,
  getCacheStats
};
