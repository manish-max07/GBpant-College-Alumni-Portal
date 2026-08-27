const express = require('express');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { pool } = require('../config/database');
const { sendApprovalEmail, sendApprovalWithWarningEmail, sendRejectionEmail, sendGraduationEmail, sendIncompleteRegistrationEmail } = require('../services/email-service');

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
 * Approve a user account and send approval email (with optional warnings).
 * Body: { warnings?: string[] }  — if present, sends warning email instead of regular approval.
 * Also stores warning notes on the user row (warning_notes column) for the warned-accounts list.
 */
router.put('/approve-user/:id', async (req, res) => {
  const { id } = req.params;
  const warnings = Array.isArray(req.body?.warnings) ? req.body.warnings.filter(Boolean) : [];
  const hasWarnings = warnings.length > 0;

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

    // Set is_approved = TRUE and optionally store warning notes
    if (hasWarnings) {
      await pool.query(
        `UPDATE users SET is_approved = TRUE, warning_notes = $2, warned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, warnings.join(' | ')]
      );
    } else {
      await pool.query(
        'UPDATE users SET is_approved = TRUE, warning_notes = NULL, warned_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    }

    console.log(`✅ Admin approved user: ${user.email}${hasWarnings ? ' (with warnings)' : ''}`);

    // Send appropriate approval email
    let emailSent = false;
    try {
      if (hasWarnings) {
        emailSent = await sendApprovalWithWarningEmail(user.email, user.full_name, warnings);
      } else {
        emailSent = await sendApprovalEmail(user.email, user.full_name);
      }
    } catch (err) {
      console.error('⚠️ Approval email send error:', err.message);
    }

    res.json({
      success: true,
      emailSent,
      hasWarnings,
      message: `User approved successfully.${hasWarnings ? ' Warning email sent.' : (emailSent ? ' Approval email sent.' : '')}`
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/warned-accounts
 * List all approved users who have unresolved warning notes
 */
router.get('/warned-accounts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.mobile, u.user_type,
         u.warning_notes, u.warned_at, u.created_at,
         COALESCE(ap.linkedin_profile, sp.linkedin_profile) AS linkedin_profile,
         COALESCE(ap.branch, sp.branch)                     AS branch,
         COALESCE(ap.program, sp.program)                   AS program
       FROM users u
       LEFT JOIN alumni_profiles  ap ON ap.user_id = u.id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.is_approved = TRUE AND u.warning_notes IS NOT NULL AND u.warning_notes <> ''
       ORDER BY u.warned_at ASC NULLS LAST`
    );

    res.json({ success: true, users: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Warned accounts list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/clear-warning/:id
 * Clear warning notes for a user (they fixed the issue)
 */
router.put('/clear-warning/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE users SET warning_notes = NULL, warned_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING email, full_name`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: `Warning cleared for ${result.rows[0].email}` });
  } catch (error) {
    console.error('Clear warning error:', error);
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
 * Promote all approved students by +1 semester using bulk SQL.
 * Optimised for Vercel serverless — uses only 5 DB queries total regardless of student count.
 * Students at max semester are graduated and converted to alumni accounts.
 *
 * Program max semesters: B.Tech=8, Diploma=6, M.Tech=4, UG Certificate=2
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

    // Query 1: fetch all approved students in one shot
    const { rows: students } = await client.query(
      `SELECT u.id AS user_id, u.email, u.full_name,
              sp.semester, sp.branch, sp.program, sp.skills
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.user_type = 'student' AND u.is_approved = TRUE`
    );

    if (students.length === 0) {
      await client.query('COMMIT');
      return res.json({
        success: true,
        message: 'No approved students found to promote.',
        promoted_count: 0,
        graduated_count: 0,
        promoted: [],
        graduated: []
      });
    }

    const currentYear = new Date().getFullYear();
    const toGraduate = [];
    const toPromote = [];

    for (const s of students) {
      const maxSem = MAX_SEMESTERS[s.program] || 8;
      const curSem = s.semester || 1;
      if (curSem >= maxSem) {
        toGraduate.push({ ...s, passing_year: currentYear });
      } else {
        const newSem = curSem + 1;
        const newYear = Math.ceil(newSem / 2);
        toPromote.push({ ...s, new_semester: newSem, new_year: newYear });
      }
    }

    // Query 2: bulk promote via UNNEST — single UPDATE for all promoting students
    if (toPromote.length > 0) {
      const userIds = toPromote.map(s => s.user_id);
      const newSems = toPromote.map(s => s.new_semester);
      const newYears = toPromote.map(s => s.new_year);

      await client.query(
        `UPDATE student_profiles sp
         SET semester     = data.new_sem::integer,
             current_year = data.new_year::integer,
             updated_at   = CURRENT_TIMESTAMP
         FROM (
           SELECT UNNEST($1::int[]) AS uid,
                  UNNEST($2::int[]) AS new_sem,
                  UNNEST($3::int[]) AS new_year
         ) AS data
         WHERE sp.user_id = data.uid`,
        [userIds, newSems, newYears]
      );
    }

    // Queries 3-5: bulk graduate — 3 queries instead of 3 * N queries
    let graduated = [];
    if (toGraduate.length > 0) {
      const gradIds = toGraduate.map(s => s.user_id);
      const branches = toGraduate.map(s => s.branch);
      const programs = toGraduate.map(s => s.program);
      const passingYears = toGraduate.map(() => currentYear);
      const skillsArr = toGraduate.map(s => s.skills || []);

      // Query 3: flip user_type for all graduating students at once
      await client.query(
        `UPDATE users SET user_type = 'alumni', updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1::int[])`,
        [gradIds]
      );

      // Query 4: bulk-insert alumni_profiles directly from student_profiles (copies branch, program, skills, linkedin, github)
      await client.query(
        `INSERT INTO alumni_profiles
           (user_id, branch, program, passing_year, skills, linkedin_profile, github_profile, created_at, updated_at)
         SELECT sp.user_id, sp.branch, sp.program, $2::int, COALESCE(sp.skills, ARRAY[]::text[]),
                sp.linkedin_profile, sp.github_profile,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM student_profiles sp
         WHERE sp.user_id = ANY($1::int[])
         ON CONFLICT (user_id) DO NOTHING`,
        [gradIds, currentYear]
      );

      // Query 5: archive historical student details (projects, internships, cgpa, interests, semester, etc.)
      await client.query(
        `INSERT INTO archived_student_profiles
           (user_id, program, branch, final_semester, final_year, cgpa, interests, skills, projects, internships, linkedin_profile, github_profile, graduated_at, created_at)
         SELECT sp.user_id, sp.program, sp.branch, sp.semester, sp.current_year, sp.cgpa, sp.interests, sp.skills,
                sp.projects, sp.internships, sp.linkedin_profile, sp.github_profile, CURRENT_TIMESTAMP, sp.created_at
         FROM student_profiles sp
         WHERE sp.user_id = ANY($1::int[])`,
        [gradIds]
      );

      // Query 6: delete all graduating student_profiles in one shot
      await client.query(
        `DELETE FROM student_profiles WHERE user_id = ANY($1::int[])`,
        [gradIds]
      );

      graduated = toGraduate.map(s => ({
        user_id: s.user_id,
        email: s.email,
        full_name: s.full_name,
        program: s.program,
        branch: s.branch,
        passing_year: currentYear
      }));
    }

    await client.query('COMMIT');

    // Send graduation emails BEFORE responding so Vercel serverless doesn't freeze before emails send
    if (graduated.length > 0) {
      await Promise.allSettled(
        graduated.map(g =>
          sendGraduationEmail(g.email, g.full_name, g.program, g.passing_year)
            .catch(err => console.error(`⚠️ Graduation email failed for ${g.email}:`, err.message))
        )
      );
    }

    res.json({
      success: true,
      message: `Promotion complete. ${toPromote.length} student(s) promoted, ${graduated.length} student(s) graduated to alumni.`,
      promoted_count: toPromote.length,
      graduated_count: graduated.length,
      promoted: toPromote.map(s => ({
        user_id: s.user_id,
        email: s.email,
        full_name: s.full_name,
        program: s.program,
        old_semester: s.semester,
        new_semester: s.new_semester
      })),
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

/**
 * GET /api/admin/incomplete-registrations
 * List all people who started signup but never completed it
 */
router.get('/incomplete-registrations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, mobile, user_type, attempted_at,
              last_reminder_sent_at, reminder_count
       FROM incomplete_registrations
       ORDER BY attempted_at ASC`
    );
    res.json({ success: true, users: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Incomplete registrations list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/incomplete-registrations/send-email/:id
 * Send a re-engagement email to one incomplete registration user
 */
router.post('/incomplete-registrations/send-email/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, full_name, email FROM incomplete_registrations WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    const user = result.rows[0];
    const emailSent = await sendIncompleteRegistrationEmail(user.email, user.full_name);

    if (emailSent) {
      await pool.query(
        `UPDATE incomplete_registrations
         SET last_reminder_sent_at = NOW(),
             reminder_count = COALESCE(reminder_count, 0) + 1
         WHERE id = $1`,
        [id]
      );
    }

    res.json({
      success: emailSent,
      message: emailSent ? `Reminder email sent to ${user.email}` : 'Failed to send email'
    });
  } catch (error) {
    console.error('Send incomplete registration email error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/incomplete-registrations/send-all
 * Send re-engagement emails to ALL incomplete registration users (rate-limited)
 */
router.post('/incomplete-registrations/send-all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email FROM incomplete_registrations ORDER BY attempted_at ASC'
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, sent: 0, failed: 0, message: 'No incomplete registrations found.' });
    }

    let sent = 0;
    let failed = 0;
    const sentIds = [];

    for (const user of result.rows) {
      try {
        const ok = await sendIncompleteRegistrationEmail(user.email, user.full_name);
        if (ok) {
          sent++;
          sentIds.push(user.id);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      // 600ms delay to avoid SMTP rate limits
      await new Promise(r => setTimeout(r, 600));
    }

    // Bulk update sent timestamps in one query
    if (sentIds.length > 0) {
      await pool.query(
        `UPDATE incomplete_registrations
         SET last_reminder_sent_at = NOW(),
             reminder_count = COALESCE(reminder_count, 0) + 1
         WHERE id = ANY($1::int[])`,
        [sentIds]
      );
    }

    res.json({
      success: true,
      sent,
      failed,
      total: result.rows.length,
      message: `Done. Sent: ${sent}, Failed: ${failed}`
    });
  } catch (error) {
    console.error('Send-all incomplete registrations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
