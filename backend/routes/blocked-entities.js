const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(adminOnly);

// GET /api/admin/blocked-entities - Get all blocked entities
router.get('/', async (req, res) => {
  try {
    console.log('📊 Admin getting blocked entities list');
    
    const query = `
      SELECT 
        id,
        entity_type,
        entity_value,
        blocked_at,
        blocked_until,
        blocked_by,
        block_reason as reason,
        is_permanent,
        is_blocked,
        expires_at,
        CASE 
          WHEN is_permanent = true THEN true
          WHEN blocked_until IS NULL AND expires_at IS NULL THEN false
          WHEN blocked_until IS NOT NULL AND blocked_until > NOW() THEN true
          WHEN expires_at IS NOT NULL AND expires_at > NOW() THEN true
          ELSE false
        END as is_active
      FROM blocked_entities 
      ORDER BY blocked_at DESC
    `;
    
    const result = await pool.query(query);
    
    console.log(`✅ Found ${result.rows.length} blocked entities`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching blocked entities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked entities',
      error: error.message
    });
  }
});

// GET /api/admin/blocked-entities/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Admin getting blocked entities statistics');
    
    const query = `
      SELECT 
        entity_type,
        COUNT(*) as total,
        COUNT(CASE 
          WHEN is_permanent = true OR 
               (blocked_until IS NOT NULL AND blocked_until > NOW()) OR
               (expires_at IS NOT NULL AND expires_at > NOW()) OR
               is_blocked = true
          THEN 1 
        END) as active,
        COUNT(CASE 
          WHEN is_permanent = false AND 
               (blocked_until IS NULL OR blocked_until <= NOW()) AND
               (expires_at IS NULL OR expires_at <= NOW()) AND
               is_blocked = false
          THEN 1 
        END) as expired
      FROM blocked_entities 
      GROUP BY entity_type
      ORDER BY entity_type
    `;
    
    const result = await pool.query(query);
    
    // Calculate totals
    const totals = {
      total: 0,
      active: 0,
      expired: 0
    };
    
    const stats = {};
    result.rows.forEach(row => {
      stats[row.entity_type] = {
        total: parseInt(row.total),
        active: parseInt(row.active),
        expired: parseInt(row.expired)
      };
      
      totals.total += parseInt(row.total);
      totals.active += parseInt(row.active);
      totals.expired += parseInt(row.expired);
    });
    
    console.log('✅ Blocked entities statistics:', { stats, totals });
    
    res.json({
      success: true,
      data: {
        by_type: stats,
        totals: totals
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching blocked entities stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// POST /api/admin/blocked-entities - Add new blocked entity
router.post('/', async (req, res) => {
  try {
    const { entity_type, entity_value, duration_hours, reason } = req.body;
    const admin_email = req.user.email;
    
    console.log('🚫 Admin adding blocked entity:', {
      type: entity_type,
      value: entity_value,
      duration: duration_hours,
      reason: reason
    });
    
    // Validate required fields
    if (!entity_type || !entity_value) {
      return res.status(400).json({
        success: false,
        message: 'Entity type and value are required'
      });
    }
    
    // Validate entity type
    const validTypes = ['ip', 'email', 'domain'];
    if (!validTypes.includes(entity_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be ip, email, or domain'
      });
    }
    
    // Calculate blocked_until based on duration
    let blocked_until = null;
    let is_permanent = false;
    
    if (duration_hours && duration_hours > 0) {
      blocked_until = new Date(Date.now() + (duration_hours * 60 * 60 * 1000));
    } else {
      is_permanent = true;
    }
    
    // Check if entity already exists
    const existingQuery = 'SELECT id FROM blocked_entities WHERE entity_type = $1 AND entity_value = $2';
    const existing = await pool.query(existingQuery, [entity_type, entity_value]);
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Entity is already blocked'
      });
    }
    
    // Insert new blocked entity
    const insertQuery = `
      INSERT INTO blocked_entities (
        entity_type, 
        entity_value, 
        blocked_until, 
        blocked_by, 
        block_reason, 
        is_permanent,
        is_blocked,
        expires_at,
        blocked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      entity_type,
      entity_value,
      blocked_until,
      admin_email,
      reason || 'Added by admin',
      is_permanent,
      true, // is_blocked
      blocked_until // also set expires_at to the same value
    ]);
    
    console.log('✅ Successfully added blocked entity:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'Entity blocked successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error adding blocked entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add blocked entity',
      error: error.message
    });
  }
});

// PUT /api/admin/blocked-entities/:id - Update blocked entity (mainly for unblocking or extending time)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, duration_hours, reason } = req.body;
    const admin_email = req.user.email;
    
    console.log('🔄 Admin updating blocked entity:', {
      id,
      action,
      duration: duration_hours,
      reason
    });
    
    // Validate action
    const validActions = ['unblock', 'extend', 'make_permanent'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be unblock, extend, or make_permanent'
      });
    }
    
    // Check if entity exists
    const existingQuery = 'SELECT * FROM blocked_entities WHERE id = $1';
    const existing = await pool.query(existingQuery, [id]);
    
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blocked entity not found'
      });
    }
    
    let updateQuery;
    let updateParams;
    
    if (action === 'unblock') {
      // Set blocked_until to past date and is_blocked to false to effectively unblock
      updateQuery = `
        UPDATE blocked_entities 
        SET blocked_until = NOW() - INTERVAL '1 minute', 
            is_permanent = false,
            is_blocked = false,
            unblocked_at = NOW(),
            unblocked_by = $3::text,
            block_reason = COALESCE($2::text, block_reason)
        WHERE id = $1::integer 
        RETURNING *
      `;
      updateParams = [parseInt(id), reason || null, admin_email];
      
    } else if (action === 'extend') {
      // Extend the blocking time
      if (!duration_hours || duration_hours <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration hours required for extend action'
        });
      }
      
      const new_blocked_until = new Date(Date.now() + (duration_hours * 60 * 60 * 1000));
      updateQuery = `
        UPDATE blocked_entities 
        SET blocked_until = $2::timestamp, 
            expires_at = $2::timestamp,
            is_permanent = false,
            is_blocked = true,
            block_reason = COALESCE($3::text, block_reason)
        WHERE id = $1::integer 
        RETURNING *
      `;
      updateParams = [parseInt(id), new_blocked_until, reason || null];
      
    } else if (action === 'make_permanent') {
      // Make the block permanent
      updateQuery = `
        UPDATE blocked_entities 
        SET blocked_until = NULL, 
            expires_at = NULL,
            is_permanent = true,
            is_blocked = true,
            block_reason = COALESCE($2::text, block_reason)
        WHERE id = $1::integer 
        RETURNING *
      `;
      updateParams = [parseInt(id), reason || null];
    }
    
    const result = await pool.query(updateQuery, updateParams);
    
    console.log('✅ Successfully updated blocked entity:', result.rows[0]);
    
    res.json({
      success: true,
      message: `Entity ${action}ed successfully`,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error updating blocked entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blocked entity',
      error: error.message
    });
  }
});

// DELETE /api/admin/blocked-entities/:id - Permanently remove blocked entity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin_email = req.user.email;
    
    console.log('🗑️ Admin permanently deleting blocked entity:', id);
    
    // Check if entity exists
    const existingQuery = 'SELECT * FROM blocked_entities WHERE id = $1';
    const existing = await pool.query(existingQuery, [id]);
    
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blocked entity not found'
      });
    }
    
    // Delete the entity
    const deleteQuery = 'DELETE FROM blocked_entities WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);
    
    console.log('✅ Successfully deleted blocked entity:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'Blocked entity permanently removed',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error deleting blocked entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blocked entity',
      error: error.message
    });
  }
});

module.exports = router;
