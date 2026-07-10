const express = require('express');
const router = express.Router();
const { generateCaptchaChallenge, verifyCaptchaChallenge } = require('../utils/captcha');

// Store CAPTCHA data temporarily (in production, use Redis or database)
const captchaStore = new Map();

/**
 * Generate new CAPTCHA challenge
 * POST /api/captcha/generate
 */
router.post('/generate', (req, res) => {
  try {
    const captchaData = generateCaptchaChallenge();
    const sessionId = require('crypto').randomUUID();
    
    // Store CAPTCHA data with session ID
    captchaStore.set(sessionId, {
      hash: captchaData.hash,
      timestamp: captchaData.timestamp,
      attempts: 0
    });
    
    // Clean up expired sessions (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of captchaStore.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) {
        captchaStore.delete(key);
      }
    }
    
    res.json({
      success: true,
      sessionId,
      imageData: captchaData.imageData,
      timestamp: captchaData.timestamp
    });
  } catch (error) {
    console.error('CAPTCHA generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CAPTCHA. Please try again.'
    });
  }
});

/**
 * Verify CAPTCHA response
 * POST /api/captcha/verify
 */
router.post('/verify', (req, res) => {
  try {
    const { sessionId, captcha } = req.body;
    
    if (!sessionId || !captcha) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and CAPTCHA are required.'
      });
    }
    
    const storedData = captchaStore.get(sessionId);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        shouldRegenerate: true,
        message: 'CAPTCHA session not found or expired.'
      });
    }
    
    // Increment attempt counter
    storedData.attempts += 1;
    
    // Limit attempts to prevent brute force
    if (storedData.attempts > 3) {
      captchaStore.delete(sessionId);
      return res.status(400).json({
        success: false,
        shouldRegenerate: true,
        message: 'Too many attempts. Please generate a new CAPTCHA.'
      });
    }
    
    const result = verifyCaptchaChallenge(
      captcha,
      storedData.hash,
      storedData.timestamp
    );
    
    if (result.success) {
      // Remove from store on successful verification
      captchaStore.delete(sessionId);
    } else if (result.shouldRegenerate) {
      // Remove from store if regeneration is needed
      captchaStore.delete(sessionId);
    }
    
    res.json(result);
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify CAPTCHA. Please try again.'
    });
  }
});

/**
 * Get CAPTCHA statistics (for admin/debugging)
 * GET /api/captcha/stats
 */
router.get('/stats', (req, res) => {
  const stats = {
    activeSessions: captchaStore.size,
    sessions: Array.from(captchaStore.entries()).map(([id, data]) => ({
      id: id.substring(0, 8) + '...',
      timestamp: new Date(data.timestamp).toISOString(),
      attempts: data.attempts,
      age: Date.now() - data.timestamp
    }))
  };
  
  res.json(stats);
});

module.exports = router;
