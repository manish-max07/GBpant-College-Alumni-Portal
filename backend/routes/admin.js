const express = require('express');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/email-service');

const router = express.Router();

// Apply auth + adminOnly to ALL routes in this router
router.use(authenticateToken, adminOnly);

/**
 * GET /api/admin/pending-users
 * List users who have completed their profile but are not yet approved
 */
router.get('/pending-users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.roll_no,
        u.user_type,
        u.profile_complete,
        u.is_approved,
        u.created_at,
        COALESCE(ap.linkedin_profile, sp.linkedin_profile) AS linkedin_profile,
        ap.branch AS alumni_branch,
        ap.program AS alumni_program,
        ap.passing_year,
        sp.branch AS student_branch,
        sp.program AS student_program,
        sp.current_year
       FROM users u
       LEFT JOIN alumni_profiles ap ON ap.user_id = u.id AND u.user_type = 'alumni'
       LEFT JOIN student_profiles sp ON sp.user_id = u.id AND u.user_type = 'student'
       WHERE u.is_approved = FALSE
         AND u.profile_complete = TRUE
         AND u.email != $1
       ORDER BY u.created_at ASC`,
      [process.env.ADMIN_EMAIL]
    );

    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/approve-user/:id
 * Approve a user account and send approval email
 */
router.put('/approve-user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get the user first so we can email them
    const userResult = await pool.query(
      'SELECT id, email, full_name, is_approved FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.is_approved) {
      return res.status(400).json({ success: false, message: 'User is already approved' });
    }

    // Set is_approved = TRUE
    await pool.query(
       'UPDATE users SET is_approved = TRUE WHERE id = $1',
       [id]
    );

    console.log(`✅ Admin approved user: ${user.email}`);

    // Send approval email - awaited for serverless environments (Vercel)
    let emailSent = false;
    try {
      emailSent = await sendApprovalEmail(user.email, user.full_name);
    } catch (err) {
      console.error('⚠️ Approval email send error:', err.message);
    }

    res.json({
      success: true,
      emailSent,
      message: `User approved successfully.${emailSent ? ' Approval email sent.' : ''}`
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/reject-user/:id
 * Reject and delete a user account
 */
router.put('/reject-user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Protect the admin account
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Cannot reject/delete the admin account'
      });
    }

    // Send rejection email before deleting account records
    try {
      await sendRejectionEmail(user.email, user.full_name, req.body?.reason);
    } catch (err) {
      console.error('⚠️ Rejection email send error:', err.message);
    }

    // Delete profile records first (cascading may handle this, but be explicit)
    await pool.query('DELETE FROM alumni_profiles WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM student_profiles WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    console.log(`🗑️ Admin rejected & deleted user: ${user.email}`);

    res.json({
      success: true,
      message: `User ${user.email} has been rejected and their account deleted.`
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users/search?q=query
 * Search users by email, full_name, mobile, roll_no
 */
router.get('/users/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  try {
    const searchTerm = `%${q.trim()}%`;
    const result = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.roll_no,
        u.user_type,
        u.profile_complete,
        u.is_approved,
        u.created_at
       FROM users u
       WHERE (
         u.email     ILIKE $1 OR
         u.full_name ILIKE $1 OR
         u.mobile    ILIKE $1 OR
         u.roll_no   ILIKE $1
       )
       ORDER BY u.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );

    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user account
 */
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Protect the admin account from deletion
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'The admin account cannot be deleted'
      });
    }

    // Delete profile records first
    await pool.query('DELETE FROM alumni_profiles WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM student_profiles WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    console.log(`🗑️ Admin permanently deleted user: ${user.email}`);

    res.json({
      success: true,
      message: `User "${user.full_name}" (${user.email}) has been permanently deleted.`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
