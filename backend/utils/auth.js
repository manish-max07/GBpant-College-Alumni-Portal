const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendOTPEmail: sendEmailViaService, isValidEmail: validateEmailFormat } = require('../services/email-service');

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hashed password
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

/**
 * Generate session ID for OTP
 */
const generateSessionId = () => {
  return crypto.randomUUID();
};

// Old SMTP code removed - now using services/email-service.js
// See bottom of file for legacy SMTP implementation (kept for reference)

/**
 * Send OTP email with enhanced security and validation
 * Optimized for Vercel deployment with SMTP support
 */
const sendOTPEmail = async (email, otp, type = 'signup', userAgent = '', ipAddress = '') => {
  // Input validation
  if (!email || !otp || !type) {
    console.error('Missing required parameters for email sending');
    return false;
  }

  // Validate email format using new service
  if (!validateEmailFormat(email)) {
    console.error(`Invalid email format: ${email}`);
    return false;
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    console.error('Invalid OTP format');
    return false;
  }

  // Validate email type
  const allowedTypes = ['signup', 'login', 'password_reset'];
  if (!allowedTypes.includes(type)) {
    console.error(`Invalid email type: ${type}`);
    return false;
  }

  try {
    // Use email service - SMTP works perfectly on Vercel (ports 587/465 supported)
    console.log(`📧 Initiating ${type} email to ${email.replace(/(.{2}).*@/, '$1***@')} [Vercel SMTP]`);
    
    const result = await sendEmailViaService(email, otp, type);
    
    if (result) {
      // Security logging for successful sends
      console.log(`✅ ${type} email sent successfully via Vercel SMTP`, {
        recipient: email.replace(/(.{2}).*@/, '$1***@'),
        type: type,
        ip: ipAddress || 'unknown',
        userAgent: userAgent ? userAgent.substring(0, 100) : 'unknown',
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        success: true
      });
    } else {
      // Log failure for monitoring
      console.error(`❌ Failed to send ${type} email on Vercel`, {
        recipient: email.replace(/(.{2}).*@/, '$1***@'),
        type: type,
        ip: ipAddress || 'unknown',
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        success: false
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', {
      type: type,
      email: email.replace(/(.{2}).*@/, '$1***@'),
      error: error.message
    });
    return false;
  }
};

// ============================================================================
// LEGACY SMTP CODE - KEPT FOR REFERENCE/FALLBACK
// This old implementation is preserved but not used by default
// Current email service uses SMTP only (Resend has been removed)
// ============================================================================

/**
 * Email transporter setup with enhanced security (LEGACY - for reference)
 */
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('📧 Email configuration missing. OTP emails will not be sent.');
    return null;
  }

  // Validate email configuration
  if (!isValidEmail(process.env.SMTP_USER)) {
    console.error('❌ Invalid SMTP_USER email format');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Enhanced security options
      requireTLS: true,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true
      },
      // Rate limiting and connection pooling
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14 // max 14 emails per second
    });

    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate mobile number (International format with or without country code prefix)
 */
const isValidMobile = (mobile) => {
  // Remove any spaces, hyphens, or parentheses
  const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Check for international format with country code
  // Supports: +91xxxxxxxxxx, 91xxxxxxxxxx, or xxxxxxxxxx (Indian numbers)
  const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return mobileRegex.test(cleanMobile);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateOTP,
  generateSessionId,
  sendOTPEmail,
  isValidEmail,
  isValidPassword,
  isValidMobile
};
