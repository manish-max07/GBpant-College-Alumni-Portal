/**
 * Advanced Email Security Middleware
 * Protects against bulk email abuse from tools like Burp Intruder
 */

const crypto = require('crypto');
const { getClientIP } = require('../utils/ip-detection');
const rateMap = new Map();
const ipTracker = new Map();
const emailTracker = new Map();
const userAgentBlacklist = new Set();
const suspiciousIPs = new Map();

// Permanently blocked IPs - manually blocked for security reasons
const permanentlyBlockedIPs = new Set([
  '103.165.29.190'  // Manually blocked IP
]);

// Clean up tracking data every 10 minutes
setInterval(() => {
  const now = Date.now();
  const cleanupThreshold = 60 * 60 * 1000; // 1 hour

  // Clean rate limiting data
  for (const [key, data] of rateMap.entries()) {
    if (now - data.windowStart > cleanupThreshold) {
      rateMap.delete(key);
    }
  }

  // Clean IP tracking data
  for (const [ip, data] of ipTracker.entries()) {
    if (now - data.firstSeen > cleanupThreshold) {
      ipTracker.delete(ip);
    }
  }

  // Clean email tracking data
  for (const [email, data] of emailTracker.entries()) {
    if (now - data.firstSeen > cleanupThreshold) {
      emailTracker.delete(email);
    }
  }

  // Clean suspicious IP data (keep for 24 hours)
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      suspiciousIPs.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Advanced rate limiting with multiple detection methods
 */
const advancedRateLimit = (req, res, next) => {
  const ip = getClientIP(req);
  const email = req.body.email;
  const userAgent = req.get('User-Agent') || '';
  const now = Date.now();

  // 0. Check if IP is permanently blocked
  if (permanentlyBlockedIPs.has(ip)) {
    logSecurityEvent('BLOCKED_PERMANENT_IP', {
      ip,
      email: email?.replace(/(.{2}).*@/, '$1***@'),
      reason: 'PERMANENTLY_BLOCKED',
      userAgent,
      endpoint: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP address has been permanently blocked.',
      errorCode: 'IP_PERMANENTLY_BLOCKED'
    });
  }

  // 1. Check if IP is already flagged as suspicious
  if (suspiciousIPs.has(ip)) {
    const suspiciousData = suspiciousIPs.get(ip);
    if (now - suspiciousData.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      logSecurityEvent('BLOCKED_SUSPICIOUS_IP', {
        ip,
        email: email?.replace(/(.{2}).*@/, '$1***@'),
        reason: suspiciousData.reason,
        userAgent
      });
      
      return res.status(429).json({
        success: false,
        message: 'Access temporarily restricted. Please try again later.',
        retryAfter: '24 hours'
      });
    }
  }

  // 2. IP-based rate limiting (aggressive for bulk attacks)
  const ipKey = `ip_${ip}`;
  let ipData = ipTracker.get(ipKey);
  
  if (!ipData) {
    ipData = { 
      count: 0, 
      firstSeen: now, 
      patterns: new Set(),
      userAgents: new Set(),
      emails: new Set()
    };
    ipTracker.set(ipKey, ipData);
  }

  ipData.count++;
  ipData.userAgents.add(userAgent);
  if (email) ipData.emails.add(email);

  // Flag IP as suspicious if too many requests in short time (increased thresholds)
  if (ipData.count > 50 && (now - ipData.firstSeen) < 5 * 60 * 1000) { // 50 requests in 5 minutes instead of 20
    flagSuspiciousIP(ip, 'HIGH_FREQUENCY_REQUESTS', { count: ipData.count, timeWindow: '5 minutes' });
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter: '15 minutes'
    });
  }

  // 3. Email-based rate limiting
  if (email) {
    const emailKey = `email_${email}`;
    let emailData = emailTracker.get(emailKey);
    
    if (!emailData) {
      emailData = { count: 0, firstSeen: now, ips: new Set() };
      emailTracker.set(emailKey, emailData);
    }

    emailData.count++;
    emailData.ips.add(ip);

    // Flag if same email used from multiple IPs quickly
    if (emailData.ips.size > 3 && (now - emailData.firstSeen) < 30 * 60 * 1000) { // 3+ IPs in 30 minutes
      flagSuspiciousIP(ip, 'EMAIL_MULTI_IP_ABUSE', { email: email.replace(/(.{2}).*@/, '$1***@'), ips: emailData.ips.size });
      
      return res.status(429).json({
        success: false,
        message: 'Suspicious activity detected. Please contact support.',
        retryAfter: '1 hour'
      });
    }
  }

  // 4. User-Agent analysis
  if (isAutomatedTool(userAgent)) {
    flagSuspiciousIP(ip, 'AUTOMATED_TOOL_DETECTED', { userAgent });
    
    return res.status(429).json({
      success: false,
      message: 'Automated requests are not allowed.',
      retryAfter: '24 hours'
    });
  }

  next();
};

/**
 * Request pattern analysis to detect bulk attacks
 */
const patternAnalysis = (req, res, next) => {
  const ip = getClientIP(req);
  const now = Date.now();
  const requestFingerprint = generateRequestFingerprint(req);

  const patternKey = `pattern_${ip}`;
  let patternData = rateMap.get(patternKey);

  if (!patternData) {
    patternData = { 
      requests: [], 
      patterns: new Map(),
      windowStart: now 
    };
    rateMap.set(patternKey, patternData);
  }

  // Keep only requests from last 10 minutes
  patternData.requests = patternData.requests.filter(req => now - req.timestamp < 10 * 60 * 1000);
  
  // Add current request
  patternData.requests.push({
    timestamp: now,
    fingerprint: requestFingerprint,
    endpoint: req.originalUrl,
    method: req.method
  });

  // Analyze patterns
  if (patternData.requests.length >= 5) {
    const intervals = [];
    for (let i = 1; i < patternData.requests.length; i++) {
      intervals.push(patternData.requests[i].timestamp - patternData.requests[i-1].timestamp);
    }

    // Check for regular intervals (automated tools)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Low variance in intervals indicates automation (made less strict)
    if (stdDev < 500 && avgInterval < 2000 && patternData.requests.length > 10) { // More strict conditions
      flagSuspiciousIP(ip, 'AUTOMATED_PATTERN_DETECTED', { 
        avgInterval: Math.round(avgInterval), 
        stdDev: Math.round(stdDev),
        requestCount: patternData.requests.length
      });
      
      return res.status(429).json({
        success: false,
        message: 'Automated behavior detected. Please try again later.',
        retryAfter: '1 hour'
      });
    }
  }

  next();
};

/**
 * Email frequency limits per IP and globally
 */
const emailFrequencyLimit = (req, res, next) => {
  const ip = getClientIP(req);
  const email = req.body.email;
  const now = Date.now();

  if (!email) {
    return next();
  }

  // Per-IP email limits (stricter)
  const ipEmailKey = `ip_email_${ip}`;
  let ipEmailData = rateMap.get(ipEmailKey);

  if (!ipEmailData) {
    ipEmailData = { count: 0, windowStart: now, emails: new Set() };
    rateMap.set(ipEmailKey, ipEmailData);
  }

  // Reset window if expired (5 minutes)
  if (now - ipEmailData.windowStart > 5 * 60 * 1000) {
    ipEmailData.count = 0;
    ipEmailData.emails.clear();
    ipEmailData.windowStart = now;
  }

  ipEmailData.count++;
  ipEmailData.emails.add(email);

  // Limit: 3 emails per 5 minutes per IP
  if (ipEmailData.count > 3) {
    logSecurityEvent('EMAIL_FREQUENCY_LIMIT_EXCEEDED', {
      ip,
      emailCount: ipEmailData.count,
      uniqueEmails: ipEmailData.emails.size,
      timeWindow: '5 minutes'
    });

    return res.status(429).json({
      success: false,
      message: 'Too many email requests. Please wait before requesting another email.',
      retryAfter: '5 minutes'
    });
  }

  // Additional check: if trying many different emails from same IP
  if (ipEmailData.emails.size > 5) {
    flagSuspiciousIP(ip, 'MULTIPLE_EMAIL_ABUSE', { uniqueEmails: ipEmailData.emails.size });
    
    return res.status(429).json({
      success: false,
      message: 'Suspicious activity detected.',
      retryAfter: '1 hour'
    });
  }

  next();
};

/**
 * CAPTCHA bypass detection - More lenient approach
 */
const captchaBypassDetection = (req, res, next) => {
  // Skip CAPTCHA bypass detection in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const ip = getClientIP(req);
  const userAgent = req.get('User-Agent') || '';

  // Only flag if there are clear signs of automation bypass attempts
  // (The frontend handles CAPTCHA verification, so we don't expect captcha field in body)
  
  // Check for rapid automated requests without proper headers
  if (isAutomatedTool(userAgent)) {
    const bypassKey = `automated_bypass_${ip}`;
    let bypassData = rateMap.get(bypassKey);

    if (!bypassData) {
      bypassData = { attempts: 0, windowStart: Date.now() };
      rateMap.set(bypassKey, bypassData);
    }

    bypassData.attempts++;

    // Only flag after many automated attempts
    if (bypassData.attempts > 10) {
      flagSuspiciousIP(ip, 'AUTOMATED_TOOL_DETECTED', { 
        attempts: bypassData.attempts,
        userAgent: userAgent.substring(0, 100)
      });
      
      return res.status(400).json({
        success: false,
        message: 'Please use a regular browser to access this service.'
      });
    }
  }

  next();
};

/**
 * Generate request fingerprint for pattern analysis
 */
function generateRequestFingerprint(req) {
  const data = {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    contentType: req.get('Content-Type')
  };
  
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
}

/**
 * Check if User-Agent indicates automated tool
 */
function isAutomatedTool(userAgent) {
  const automatedTools = [
    'burp',
    'intruder', 
    'scanner',
    'python-requests',
    'curl',
    'wget',
    'postman',
    'insomnia',
    'httpie',
    'nikto',
    'sqlmap',
    'nessus',
    'openvas',
    'zap',
    'nuclei',
    'masscan',
    'nmap',
    'gobuster',
    'dirb',
    'ffuf',
    'wfuzz'
  ];

  const lowerUA = userAgent.toLowerCase();
  return automatedTools.some(tool => lowerUA.includes(tool));
}

/**
 * Clear suspicious IP flag (for administrative purposes)
 */
const clearSuspiciousIP = (ip) => {
  suspiciousIPs.delete(ip);
  // Also clear other tracking data for this IP
  for (const [key, value] of rateMap.entries()) {
    if (key.includes(ip)) {
      rateMap.delete(key);
    }
  }
  for (const [key, value] of ipTracker.entries()) {
    if (key.includes(ip)) {
      ipTracker.delete(key);
    }
  }
  console.log(`✅ Cleared suspicious IP flag for: ${ip}`);
};

/**
 * Flag suspicious IP address
 */
function flagSuspiciousIP(ip, reason, metadata = {}) {
  suspiciousIPs.set(ip, {
    reason,
    metadata,
    timestamp: Date.now()
  });

  logSecurityEvent('IP_FLAGGED_SUSPICIOUS', {
    ip,
    reason,
    metadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Security event logging
 */
function logSecurityEvent(eventType, data) {
  console.warn(`🚨 SECURITY EVENT: ${eventType}`, {
    ...data,
    timestamp: new Date().toISOString()
  });

  // In production, you might want to send this to a security monitoring service
  // or write to a dedicated security log file
}

/**
 * Honeypot field detection
 */
const honeypotDetection = (req, res, next) => {
  // Check for common honeypot field names that shouldn't be filled
  const honeypotFields = ['website', 'url', 'phone2', 'email2', 'name2', 'address', 'fax'];
  
  for (const field of honeypotFields) {
    if (req.body[field] && req.body[field].trim() !== '') {
      flagSuspiciousIP(getClientIP(req), 'HONEYPOT_TRIGGERED', { field, value: req.body[field] });
      
      // Return success but don't actually send email
      return res.json({
        success: true,
        message: 'OTP sent successfully! Please check your email.'
      });
    }
  }

  next();
};

/**
 * Add IP to permanent block list
 */
function addPermanentBlockedIP(ip, reason = 'MANUAL_BLOCK') {
  permanentlyBlockedIPs.add(ip);
  logSecurityEvent('IP_PERMANENTLY_BLOCKED', {
    ip,
    reason,
    timestamp: new Date().toISOString()
  });
  console.log(`🔒 IP ${ip} has been permanently blocked`);
}

/**
 * Remove IP from permanent block list
 */
function removePermanentBlockedIP(ip) {
  const wasBlocked = permanentlyBlockedIPs.delete(ip);
  if (wasBlocked) {
    logSecurityEvent('IP_UNBLOCKED', {
      ip,
      timestamp: new Date().toISOString()
    });
    console.log(`🔓 IP ${ip} has been unblocked`);
  }
  return wasBlocked;
}

/**
 * Get list of permanently blocked IPs
 */
function getPermanentlyBlockedIPs() {
  return Array.from(permanentlyBlockedIPs);
}

/**
 * Get security statistics (for monitoring dashboard)
 */
const getSecurityStats = () => {
  return {
    activeRateLimits: rateMap.size,
    trackedIPs: ipTracker.size,
    trackedEmails: emailTracker.size,
    suspiciousIPs: suspiciousIPs.size,
    permanentlyBlockedIPs: permanentlyBlockedIPs.size,
    blacklistedUserAgents: userAgentBlacklist.size
  };
};

module.exports = {
  advancedRateLimit,
  patternAnalysis,
  emailFrequencyLimit,
  captchaBypassDetection,
  honeypotDetection,
  getSecurityStats,
  flagSuspiciousIP,
  clearSuspiciousIP,
  addPermanentBlockedIP,
  removePermanentBlockedIP,
  getPermanentlyBlockedIPs
};
