const express = require('express');
const { pool } = require('../config/database'); // Use centralized database config
const { 
  clearSuspiciousIP, 
  getSecurityStats, 
  addPermanentBlockedIP, 
  removePermanentBlockedIP, 
  getPermanentlyBlockedIPs 
} = require('../middleware/advanced-email-security');

const router = express.Router();

/**
 * GET /api/debug/fix-otp-constraint
 * Fix the OTP constraint to allow 'set_password' type
 */
router.get('/fix-otp-constraint', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing OTP sessions constraint...');
    
    // Drop the existing check constraint
    await client.query(`
      ALTER TABLE otp_sessions DROP CONSTRAINT IF EXISTS otp_sessions_otp_type_check;
    `);
    console.log('✅ Dropped existing constraint');
    
    // Add the updated constraint with 'set_password' included
    await client.query(`
      ALTER TABLE otp_sessions ADD CONSTRAINT otp_sessions_otp_type_check 
      CHECK (otp_type IN ('signup', 'login', 'password_reset', 'set_password'));
    `);
    console.log('✅ Added updated constraint with set_password');
    
    // Verify the constraint was updated
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'otp_sessions'::regclass 
      AND conname = 'otp_sessions_otp_type_check';
    `);
    
    res.json({
      success: true,
      message: 'OTP constraint fixed successfully!',
      constraint: result.rows[0] || null
    });
    
  } catch (error) {
    console.error('❌ Error fixing OTP constraint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix constraint',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/debug/get-otp/:sessionId
 * Get OTP for a session (for testing purposes)
 */
router.get('/get-otp/:sessionId', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { sessionId } = req.params;
    
    const result = await client.query(`
      SELECT session_id, email, otp, otp_type, expires_at, verified
      FROM otp_sessions 
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [sessionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error getting OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/debug/clear-blocked-ip
 * Clear blocked/suspicious IP for testing
 */
router.post('/clear-blocked-ip', (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }
    
    clearSuspiciousIP(ip);
    
    res.json({
      success: true,
      message: `Cleared suspicious IP flag for ${ip}`,
      securityStats: getSecurityStats()
    });
    
  } catch (error) {
    console.error('❌ Error clearing blocked IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear blocked IP',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/security-stats
 * Get current security tracking statistics
 */
router.get('/security-stats', (req, res) => {
  try {
    const stats = getSecurityStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error getting security stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security stats',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/blocked-ips
 * Get all currently blocked/suspicious IPs with details
 */
router.get('/blocked-ips', (req, res) => {
  try {
    const stats = getSecurityStats();
    
    res.json({
      success: true,
      totalBlockedIPs: stats.suspiciousIPs || 0,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting blocked IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked IPs',
      error: error.message
    });
  }
});

/**
 * POST /api/debug/unblock-all-ips
 * Clear all blocked IPs (nuclear option)
 */
router.post('/unblock-all-ips', (req, res) => {
  try {
    // Clear common localhost IPs
    clearSuspiciousIP('::1'); // IPv6 localhost
    clearSuspiciousIP('127.0.0.1'); // IPv4 localhost
    
    console.log('🔓 Admin cleared all blocked IPs');
    
    res.json({
      success: true,
      message: 'Cleared all blocked IPs and security tracking',
      newStats: getSecurityStats(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error unblocking IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock IPs',
      error: error.message
    });
  }
});

/**
 * POST /api/debug/block-ip
 * Permanently block a specific IP address
 */
router.post('/block-ip', (req, res) => {
  try {
    const { ip, reason = 'MANUAL_ADMIN_BLOCK' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    // Validate IP format (basic validation)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    addPermanentBlockedIP(ip, reason);
    
    res.json({
      success: true,
      message: `IP ${ip} has been permanently blocked`,
      blockedIP: ip,
      reason: reason,
      permanentlyBlockedIPs: getPermanentlyBlockedIPs(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error blocking IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block IP',
      error: error.message
    });
  }
});

/**
 * POST /api/debug/unblock-ip
 * Remove IP from permanent block list
 */
router.post('/unblock-ip', (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    const wasBlocked = removePermanentBlockedIP(ip);
    
    if (wasBlocked) {
      res.json({
        success: true,
        message: `IP ${ip} has been unblocked`,
        unblockedIP: ip,
        permanentlyBlockedIPs: getPermanentlyBlockedIPs(),
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        message: `IP ${ip} was not in the blocked list`,
        permanentlyBlockedIPs: getPermanentlyBlockedIPs()
      });
    }
    
  } catch (error) {
    console.error('❌ Error unblocking IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock IP',
      error: error.message
    });
  }
});

/**
 * GET /api/debug/permanently-blocked-ips
 * Get list of permanently blocked IPs
 */
router.get('/permanently-blocked-ips', (req, res) => {
  try {
    const blockedIPs = getPermanentlyBlockedIPs();
    
    res.json({
      success: true,
      permanentlyBlockedIPs: blockedIPs,
      totalPermanentBlocks: blockedIPs.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting permanently blocked IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get permanently blocked IPs',
      error: error.message
    });
  }
});

module.exports = router;
