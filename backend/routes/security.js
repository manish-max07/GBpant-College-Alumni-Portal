/**
 * Security monitoring routes and utilities
 */

const express = require('express');
const router = express.Router();
const { getSecurityStats } = require('../middleware/advanced-email-security');

// Security monitoring dashboard (for admin use)
router.get('/security-stats', (req, res) => {
  // In production, add admin authentication here
  const stats = getSecurityStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
