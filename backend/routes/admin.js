const express = require('express');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const { sendApprovalEmail, sendRejectionEmail, sendGraduationEmail } = require('../services/email-service');

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

/**
 * POST /api/admin/promote-students
 * Promote all approved students by +1 semester.
 * Students who exceed their program's max semester are graduated → converted to alumni.
 *
 * Program max semesters:
 *   B.Tech          → 8
 *   Diploma         → 6
 *   M.Tech          → 4
 *   UG Certificate  → 2
 *   (default/others → 8)
 */
router.post('/promote-students', async (req, res) => {
  const MAX_SEMESTERS = {
    'B.Tech': 8,
    'Diploma': 6,
    'M.Tech': 4,
    'UG Certificate': 2
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch all approved students with their profile data
    const studentsResult = await client.query(
      `SELECT u.id AS user_id, u.email, u.full_name,
              sp.id AS profile_id, sp.semester, sp.current_year, sp.branch, sp.program,
              sp.skills, sp.interests, sp.projects, sp.internships, sp.cgpa
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.user_type = 'student' AND u.is_approved = TRUE`
    );

    const students = studentsResult.rows;
    const promoted = [];
    const graduated = [];

    const currentYear = new Date().getFullYear();

    for (const student of students) {
      const maxSem = MAX_SEMESTERS[student.program] || 8;
      const currentSem = student.semester || 1;

      if (currentSem >= maxSem) {
        // Graduate this student → convert to alumni
        const passingYear = currentYear;

        // 1. Change user_type to 'alumni'
        await client.query(
          `UPDATE users SET user_type = 'alumni', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [student.user_id]
        );

        // 2. Create alumni_profiles row (copy basics from student profile)
        //    Check if one already exists (edge case guard)
        const existingAlumni = await client.query(
          'SELECT id FROM alumni_profiles WHERE user_id = $1',
          [student.user_id]
        );

        if (existingAlumni.rows.length === 0) {
          await client.query(
            `INSERT INTO alumni_profiles
               (user_id, branch, program, passing_year, skills, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              student.user_id,
              student.branch,
              student.program,
              passingYear,
              student.skills || []
            ]
          );
        }

        // 3. Delete student_profiles row
        await client.query(
          'DELETE FROM student_profiles WHERE user_id = $1',
          [student.user_id]
        );

        graduated.push({
          user_id: student.user_id,
          email: student.email,
          full_name: student.full_name,
          program: student.program,
          branch: student.branch,
          passing_year: passingYear
        });

        // Send graduation email (non-blocking, errors don't roll back)
        sendGraduationEmail(student.email, student.full_name, student.program, passingYear)
          .catch(err => console.error(`⚠️ Graduation email failed for ${student.email}:`, err.message));

        console.log(`🎓 Graduated student → alumni: ${student.email} (${student.program}, sem ${currentSem}/${maxSem})`);

      } else {
        // Promote: +1 semester, +1 current_year every 2 semesters (every even→odd transition)
        const newSem = currentSem + 1;
        // current_year increments when semester crosses odd boundary (1→2 means still year 1, 2→3 means year 2, etc.)
        const newYear = Math.ceil(newSem / 2);

        await client.query(
          `UPDATE student_profiles
           SET semester = $1, current_year = $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $3`,
          [newSem, newYear, student.user_id]
        );

        promoted.push({
          user_id: student.user_id,
          email: student.email,
          full_name: student.full_name,
          program: student.program,
          old_semester: currentSem,
          new_semester: newSem
        });

        console.log(`📈 Promoted student: ${student.email} | sem ${currentSem} → ${newSem}`);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Promotion complete. ${promoted.length} student(s) promoted, ${graduated.length} student(s) graduated to alumni.`,
      promoted_count: promoted.length,
      graduated_count: graduated.length,
      promoted,
      graduated
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Promotion error:', error);
    res.status(500).json({ success: false, message: 'Promotion failed: ' + error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
