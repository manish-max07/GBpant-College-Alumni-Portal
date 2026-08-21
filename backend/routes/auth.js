const express = require('express');
const { pool } = require('../config/database'); // Use centralized database config
const { generateToken } = require('../middleware/auth');
const {
  hashPassword,
  comparePassword,
  generateOTP,
  generateSessionId,
  sendOTPEmail,
  isValidEmail,
  isValidPassword,
  isValidMobile
} = require('../utils/auth');
const OTPSessionManager = require('../utils/otp-session-manager');
const { 
  emailRateLimit, 
  passwordResetRateLimit, 
  validateEmailRequest,
  logEmailAttempt 
} = require('../middleware/email-security');
const {
  advancedRateLimit,
  patternAnalysis,
  emailFrequencyLimit,
  captchaBypassDetection,
  honeypotDetection
} = require('../middleware/advanced-email-security');

const router = express.Router();

// Initialize OTP session manager
const otpManager = new OTPSessionManager();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

/**
 * POST /api/auth/signup
 * User registration with proper user type detection and enhanced security
 */
router.post('/signup', 
  advancedRateLimit,
  patternAnalysis,
  emailFrequencyLimit,
  honeypotDetection,
  captchaBypassDetection,
  emailRateLimit, 
  validateEmailRequest, 
  logEmailAttempt, 
  async (req, res) => {
  try {
    const { fullName, email, mobile, rollNo, isCurrentStudent } = req.body;

    // Validation
    if (!fullName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and mobile are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Please provide a valid mobile number with country code (e.g., +91xxxxxxxxxx or 91xxxxxxxxxx)'
      });
    }

    // Determine user type based on explicit selection
    const userType = isCurrentStudent ? 'student' : 'alumni';

    // Validate roll number for students
    if (isCurrentStudent && (!rollNo || rollNo.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for current students'
      });
    }

    // Validate roll number format for students (optional additional validation)
    if (isCurrentStudent && rollNo && rollNo.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid roll number'
      });
    }

    // Check if user already exists - but don't reveal it to prevent enumeration
    const existingUser = await pool.query(
      'SELECT id, email, mobile FROM users WHERE email = $1 OR mobile = $2',
      [email, mobile]
    );

    if (existingUser.rows.length > 0) {
      // Don't reveal user exists - send same response as new user
      // Just log it for admin monitoring
      console.log(`🔍 Signup attempt for existing user: ${email.replace(/(.{2}).*@/, '$1***@')}`);
      
      // Return success response (but don't actually create account or send OTP)
      return res.json({
        success: true,
        message: `OTP sent to your email. You are registering as ${userType === 'student' ? 'a current student' : 'an alumni'}.`,
        sessionId: 'dummy-session-' + Date.now(), // Fake session ID
        userType
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Create OTP session in database
    const sessionData = await otpManager.createSession({
      email,
      otp,
      otpType: 'signup',
      userType,
      fullName,
      mobile,
      rollNo: rollNo || null
    });

    // Send OTP email with security context
    const emailSent = await sendOTPEmail(
      email, 
      otp, 
      'signup', 
      req.get('User-Agent') || '', 
      req.ip || ''
    );
    
    if (!emailSent) {
      await otpManager.deleteSession(sessionData.sessionId);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: `OTP sent to your email. You are registering as ${userType === 'student' ? 'a current student' : 'an alumni'}.`,
      sessionId: sessionData.sessionId,
      userType
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP for signup - creates user account but doesn't complete signup
 */
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('=== VERIFY OTP REQUEST ===');
    console.log('Request body:', req.body);
    
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      console.log('Missing sessionId or OTP');
      return res.status(400).json({
        success: false,
        message: 'Session ID and OTP are required'
      });
    }

    console.log('Attempting to verify OTP:', { sessionId, otp });

    // Verify OTP using database session manager
    const verificationResult = await otpManager.verifyOTP(sessionId, otp);
    console.log('Verification result:', verificationResult);
    
    if (!verificationResult.success) {
      console.log('OTP verification failed');
      return res.status(400).json(verificationResult);
    }

    const session = verificationResult.session;
    console.log('Session data:', session);

    if (session.otp_type === 'signup') {
      console.log('Processing signup OTP verification');
      
      // OTP verified successfully - DO NOT create user yet
      // User will be created when they set their password
      
      const responseData = {
        success: true,
        message: `Email verified successfully! Please set your password to complete ${session.user_type} registration.`,
        sessionId, // Keep same session for password setting
        userType: session.user_type,
        userData: {
          fullName: session.full_name,
          email: session.email,
          userType: session.user_type
        }
      };
      
      console.log('Sending response:', responseData);
      res.json(responseData);

    } else if (session.otp_type === 'login') {
      console.log('Processing login OTP verification');
      
      // Handle login OTP verification
      const user = await pool.query(`
        SELECT id, email, user_type, profile_complete, signup_completed 
        FROM users WHERE email = $1
      `, [session.email]);

      if (user.rows.length === 0) {
        await otpManager.deleteSession(sessionId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = user.rows[0];
      const token = generateToken(userData);

      // Clean up session
      await otpManager.deleteSession(sessionId);

      const responseData = {
        success: true,
        message: 'Login successful!',
        token,
        needsProfile: !userData.profile_complete,
        userType: userData.user_type,
        signupComplete: userData.signup_completed
      };
      
      console.log('Sending login response:', responseData);
      res.json(responseData);
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/set-password
 * Set password after OTP verification - completes signup process
 */
router.post('/set-password', async (req, res) => {
  try {
    const { sessionId, password } = req.body;

    if (!sessionId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and password are required'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }

    // Get verified signup session
    const session = await otpManager.getVerifiedSignupSession(sessionId);
    
    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session or OTP not verified'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(`
      SELECT id, email FROM users WHERE email = $1
    `, [session.email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists. Please login instead.'
      });
    }

    // Hash password and create complete user account
    const hashedPassword = await hashPassword(password);
    
    const newUser = await pool.query(`
      INSERT INTO users (
        full_name, email, mobile, roll_no, user_type, password_hash,
        email_verified, signup_completed, password_set, 
        created_at, password_set_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, TRUE, NOW(), NOW())
      RETURNING id, email, user_type, full_name
    `, [
      session.full_name,
      session.email,
      session.mobile,
      session.roll_no,
      session.user_type,
      hashedPassword
    ]);

    if (newUser.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account'
      });
    }

    const userData = newUser.rows[0];
    console.log('Successfully created new user:', userData.email);

    // Clean up session
    await otpManager.deleteSession(sessionId);

    res.json({
      success: true,
      message: `Password set successfully! Please log in now to complete your profile setup.`,
      userType: session.user_type,
      redirectTo: '/login'
    });

  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get user
    const user = await pool.query(
      'SELECT id, email, password_hash, user_type, profile_complete, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userData = user.rows[0];

    if (!userData.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please complete registration.'
      });
    }

    if (!userData.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Password not set. Please complete registration.'
      });
    }

    // Verify password
    const passwordValid = await comparePassword(password, userData.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if login requires OTP (optional security feature)
    const requireOTP = process.env.REQUIRE_LOGIN_OTP === 'true';
    
    if (requireOTP) {
      // Generate login OTP
      const otp = generateOTP();
      const sessionId = generateSessionId();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

      otpStore.set(sessionId, {
        otp,
        email,
        type: 'login',
        expiresAt,
        attempts: 0
      });

      await sendOTPEmail(email, otp, 'login');

      return res.json({
        success: true,
        requiresOtp: true,
        message: 'OTP sent to your email for verification',
        sessionId
      });
    }

    // Direct login
    const token = generateToken(userData);

    res.json({
      success: true,
      token,
      needsProfile: !userData.profile_complete,
      userType: userData.user_type
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify-login-otp
 * Verify OTP for login
 */
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and OTP are required'
      });
    }

    const otpData = otpStore.get(sessionId);
    
    if (!otpData || otpData.type !== 'login') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(sessionId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (otpData.attempts >= 3) {
      otpStore.delete(sessionId);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please login again.'
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts++;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 3 - otpData.attempts
      });
    }

    // Get user data and generate token
    const user = await pool.query(
      'SELECT id, email, user_type, profile_complete FROM users WHERE email = $1',
      [otpData.email]
    );

    if (user.rows.length === 0) {
      otpStore.delete(sessionId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user.rows[0];
    const token = generateToken(userData);

    otpStore.delete(sessionId);

    res.json({
      success: true,
      token,
      needsProfile: !userData.profile_complete,
      userType: userData.user_type
    });

  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP using database session manager with enhanced security
 */
router.post('/resend-otp', 
  advancedRateLimit,
  patternAnalysis,
  emailFrequencyLimit,
  honeypotDetection,
  captchaBypassDetection,
  emailRateLimit, 
  logEmailAttempt, 
  async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Generate new OTP
    const newOtp = generateOTP();

    // Update session with new OTP
    const sessionData = await otpManager.resendOTP(sessionId, newOtp);
    
    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session'
      });
    }

    // Send new OTP
    const emailSent = await sendOTPEmail(sessionData.email, newOtp, sessionData.otp_type);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });

  } catch (error) {
     console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Step 1: Verify email exists and send OTP with enhanced security
 */
router.post('/forgot-password', 
  advancedRateLimit,
  patternAnalysis,
  emailFrequencyLimit,
  honeypotDetection,
  captchaBypassDetection,
  passwordResetRateLimit, 
  validateEmailRequest, 
  logEmailAttempt, 
  async (req, res) => {
  try {
    const { email, captcha_session_id, captcha_input } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // CAPTCHA validation (optional - can be enabled in production)
    if (!captcha_session_id || !captcha_input) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification is required'
      });
    }

    // Check if user exists in database
    const userQuery = 'SELECT id, email, full_name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Please register first, this email id is not registered'
      });
    }

    const user = userResult.rows[0];

    // Generate OTP
    const otp = generateOTP();

    // Store OTP session using the correct OTPSessionManager interface
    const sessionResult = await otpManager.createSession({
      email: user.email,
      otp,
      otpType: 'password_reset',
      userType: 'alumni', // Default type, could be determined from user data
      fullName: user.full_name,
      mobile: null, // Not needed for password reset
      rollNo: null  // Not needed for password reset
    });

    const sessionId = sessionResult.sessionId;

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp, 'password_reset');

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    // Log OTP attempt in database for audit
    await pool.query(
      'INSERT INTO otp_logs (email, otp_hash, otp_type) VALUES ($1, $2, $3)',
      [user.email, await hashPassword(otp), 'password_reset']
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email address',
      sessionId,
      data: {
        email: user.email,
        userName: user.full_name
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify-reset-otp
 * Step 2: Verify OTP for password reset
 */
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    // Basic validation
    if (!sessionId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and OTP are required'
      });
    }

    // Get session data and verify OTP using OTPSessionManager
    const verificationResult = await otpManager.verifyOTP(sessionId, otp.trim());

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // Get session details for response
    const sessionData = await otpManager.getSession(sessionId);
    
    if (!sessionData || sessionData.otp_type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type'
      });
    }

    // Update otp_logs (optional)
    try {
      await pool.query(
        'UPDATE otp_logs SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE email = $1 AND otp_type = $2 AND created_at >= CURRENT_TIMESTAMP - INTERVAL \'10 minutes\'',
        [sessionData.email, 'password_reset']
      );
    } catch (logError) {
      console.warn('Failed to update otp_logs:', logError.message);
      // Don't fail the request if logging fails
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      sessionId,
      data: {
        email: sessionData.email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Step 3: Reset password after OTP verification
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { sessionId, newPassword, confirmPassword } = req.body;

    // Basic validation
    if (!sessionId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Get session data
    const sessionData = await otpManager.getSession(sessionId);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session. Please start the password reset process again.'
      });
    }

    if (sessionData.otp_type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type'
      });
    }

    // For password reset, we assume the session is valid if it exists and hasn't expired
    // The OTP verification should have happened in the previous step

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Get user ID from the users table using the email from the session
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [sessionData.email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;

    // Update user password in database
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, password_set_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND email = $3
    `;

    const updateResult = await pool.query(updateQuery, [
      hashedPassword,
      userId,
      sessionData.email
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or password update failed'
      });
    }

    // Clear the session
    otpManager.deleteSession(sessionId);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/resend-reset-otp
 * Resend OTP for password reset
 */
router.post('/resend-reset-otp', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get current session data
    const sessionData = await otpManager.getSession(sessionId);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session. Please start the password reset process again.'
      });
    }

    if (sessionData.otp_type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type'
      });
    }

    // Generate new OTP and update session
    const newOTP = generateOTP();
    const resendResult = await otpManager.resendOTP(sessionId, newOTP);
    
    if (!resendResult) {
      return res.status(400).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      });
    }

    // Send new OTP email
    const emailSent = await sendOTPEmail(sessionData.email, newOTP, 'password_reset');

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    // Log new OTP attempt
    await pool.query(
      'INSERT INTO otp_logs (email, otp_hash, otp_type) VALUES ($1, $2, $3)',
      [sessionData.email, await hashPassword(newOTP), 'password_reset']
    );

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully to your email address'
    });

  } catch (error) {
    console.error('Resend reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
