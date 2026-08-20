const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database'); // Use centralized database config
const { upload, deleteProfilePicture, extractPublicId } = require('../utils/cloudinary');
const { sendSubmissionEmail } = require('../services/email-service');

const router = express.Router();

/**
 * GET /api/profile/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, full_name, email, mobile, roll_no, user_type, profile_complete, is_approved, profile_picture_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user.rows[0];
    const adminEmail = process.env.ADMIN_EMAIL;
    const is_admin = !!(adminEmail && userData.email && userData.email.toLowerCase().trim() === adminEmail.toLowerCase().trim());

    res.json({
      success: true,
      user: {
        ...userData,
        is_admin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/alumni
 * Get alumni profile
 */
router.get('/alumni', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Alumni only.'
      });
    }

    const profile = await pool.query(
      `SELECT ap.*, u.full_name, u.email, u.mobile, u.roll_no 
       FROM alumni_profiles ap 
       JOIN users u ON ap.user_id = u.id 
       WHERE ap.user_id = $1`,
      [req.user.id]
    );

    if (profile.rows.length === 0) {
      return res.json({
        success: true,
        profile: null,
        message: 'Profile not found. Please complete your profile.'
      });
    }

    res.json({
      success: true,
      profile: profile.rows[0]
    });

  } catch (error) {
    console.error('Get alumni profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/alumni-list
 * Get list of alumni with server-side pagination, filtering, and batch counts
 */
router.get('/alumni-list', authenticateToken, async (req, res) => {
  try {
    // Requesting user must be approved — always check DB (token may be stale)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (req.user.email !== ADMIN_EMAIL) {
      const approvalCheck = await pool.query(
        'SELECT is_approved FROM users WHERE id = $1',
        [req.user.id]
      );
      if (approvalCheck.rows.length === 0 || !approvalCheck.rows[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval.'
        });
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
    const offset = (page - 1) * limit;

    const { search, passing_year, branch, program, location } = req.query;

    // Base WHERE conditions
    const whereClauses = ["u.user_type = 'alumni'", "u.is_approved = TRUE"];
    const queryParams = [];

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(
        `(u.full_name ILIKE $${queryParams.length} OR ap.employer ILIKE $${queryParams.length} OR ap.position ILIKE $${queryParams.length} OR ap.skills::text ILIKE $${queryParams.length})`
      );
    }

    if (passing_year && passing_year !== 'all') {
      queryParams.push(parseInt(passing_year));
      whereClauses.push(`ap.passing_year = $${queryParams.length}`);
    }

    if (branch && branch !== 'all') {
      queryParams.push(branch);
      whereClauses.push(`ap.branch = $${queryParams.length}`);
    }

    if (program && program !== 'all') {
      queryParams.push(program);
      whereClauses.push(`ap.program = $${queryParams.length}`);
    }

    if (location && location !== 'all') {
      queryParams.push(`%${location}%`);
      whereClauses.push(`(ap.location ILIKE $${queryParams.length} OR ap.institution_country ILIKE $${queryParams.length})`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // 1. Get total count matching current filters
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM alumni_profiles ap 
       JOIN users u ON ap.user_id = u.id 
       ${whereSql}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    // 2. Fetch paginated list
    const listParams = [...queryParams, limit, offset];
    const alumniList = await pool.query(
      `SELECT 
        u.full_name,
        u.profile_picture_url,
        ap.employer,
        ap.position,
        ap.branch,
        ap.program,
        ap.passing_year,
        ap.location,
        ap.previous_campus,
        ap.linkedin_profile,
        ap.experience,
        ap.is_employed,
        ap.current_institution,
        ap.current_course,
        ap.institution_country,
        ap.is_pursuing_higher_education,
        ap.expected_graduation_year,
        ap.is_preparing_competitive_exams,
        ap.competitive_exam_details,
        ap.is_seeking_opportunities,
        ap.opportunity_preferences,
        ap.availability_status
       FROM alumni_profiles ap 
       JOIN users u ON ap.user_id = u.id 
       ${whereSql}
       ORDER BY ap.passing_year DESC, u.full_name ASC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    // 3. Get aggregated batch counts across all approved alumni
    const batchesResult = await pool.query(
      `SELECT ap.passing_year AS year, COUNT(*)::int AS count 
       FROM alumni_profiles ap 
       JOIN users u ON ap.user_id = u.id 
       WHERE u.user_type = 'alumni' 
         AND u.is_approved = TRUE 
         AND ap.passing_year IS NOT NULL 
       GROUP BY ap.passing_year 
       ORDER BY ap.passing_year DESC`
    );

    res.json({
      success: true,
      alumni: alumniList.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      batches: batchesResult.rows,
      message: alumniList.rows.length > 0 ? 'Alumni list retrieved successfully' : 'No alumni found'
    });

  } catch (error) {
    console.error('Get alumni list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/student-list
 * Get list of students with server-side pagination, filtering, and year counts
 */
router.get('/student-list', authenticateToken, async (req, res) => {
  try {
    // Only alumni can access student list
    if (req.user.userType !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Alumni only.'
      });
    }

    // Requesting alumni must be approved — always check DB (token may be stale)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (req.user.email !== ADMIN_EMAIL) {
      const approvalCheck = await pool.query(
        'SELECT is_approved FROM users WHERE id = $1',
        [req.user.id]
      );
      if (approvalCheck.rows.length === 0 || !approvalCheck.rows[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval.'
        });
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
    const offset = (page - 1) * limit;

    const { search, current_year, branch, semester } = req.query;

    // Base WHERE conditions
    const whereClauses = [
      "u.user_type = 'student'",
      "u.is_approved = TRUE",
      "sp.branch IS NOT NULL",
      "sp.program IS NOT NULL"
    ];
    const queryParams = [];

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(
        `(u.full_name ILIKE $${queryParams.length} OR u.roll_no ILIKE $${queryParams.length} OR sp.skills::text ILIKE $${queryParams.length} OR sp.interests::text ILIKE $${queryParams.length})`
      );
    }

    if (current_year && current_year !== 'all') {
      queryParams.push(parseInt(current_year));
      whereClauses.push(`sp.current_year = $${queryParams.length}`);
    }

    if (branch && branch !== 'all') {
      queryParams.push(branch);
      whereClauses.push(`sp.branch = $${queryParams.length}`);
    }

    if (semester && semester !== 'all') {
      queryParams.push(parseInt(semester));
      whereClauses.push(`sp.semester = $${queryParams.length}`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // 1. Get total count matching current filters
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       ${whereSql}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    // 2. Fetch paginated list
    const listParams = [...queryParams, limit, offset];
    const studentList = await pool.query(
      `SELECT 
        u.full_name,
        u.profile_picture_url,
        u.roll_no,
        sp.current_year,
        sp.branch,
        sp.program,
        sp.semester,
        sp.cgpa,
        sp.interests,
        sp.skills,
        sp.projects,
        sp.internships,
        sp.linkedin_profile,
        sp.github_profile
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       ${whereSql}
       ORDER BY sp.current_year DESC, sp.cgpa DESC, u.full_name ASC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    // 3. Get aggregated year counts across all approved students
    const batchesResult = await pool.query(
      `SELECT sp.current_year AS year, COUNT(*)::int AS count 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE u.user_type = 'student' 
         AND u.is_approved = TRUE 
         AND sp.current_year IS NOT NULL 
       GROUP BY sp.current_year 
       ORDER BY sp.current_year DESC`
    );

    res.json({
      success: true,
      students: studentList.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      batches: batchesResult.rows,
      message: studentList.rows.length > 0 ? 'Student list retrieved successfully' : 'No students found'
    });

  } catch (error) {
    console.error('Get student list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/alumni
 * Update alumni profile
 */
router.put('/alumni', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Alumni only.'
      });
    }

    const {
      full_name, age, passing_year, branch, program, is_employed,
      employer, position, experience, linkedin_profile,
      location, skills, achievements, bio, website_url, github_profile,
      mobile, previous_campus,
      // Higher education fields
      current_institution, current_course, institution_country,
      is_pursuing_higher_education, expected_graduation_year,
      // Additional status fields
      is_preparing_competitive_exams, competitive_exam_details,
      is_seeking_opportunities, opportunity_preferences
    } = req.body;

    // Data sanitization and type conversion
    const sanitizedData = {
      full_name,
      age: age ? parseInt(age) : null,
      passing_year: passing_year ? parseInt(passing_year) : null,
      branch,
      program,
      is_employed: is_employed || false,
      employer: employer || null,
      position: position || null,
      experience: experience || null,
      linkedin_profile: linkedin_profile || null,
      location: location || null,
      mobile: mobile || null,
      previous_campus: previous_campus || null,
      skills: skills || [],
      achievements: achievements || null,
      bio: bio || null,
      website_url: website_url || null,
      github_profile: github_profile || null,
      // Higher education fields - convert empty strings to null
      current_institution: current_institution || null,
      current_course: current_course || null,
      institution_country: institution_country || null,
      is_pursuing_higher_education: is_pursuing_higher_education || false,
      expected_graduation_year: expected_graduation_year ? parseInt(expected_graduation_year) : null,
      // Additional status fields
      is_preparing_competitive_exams: is_preparing_competitive_exams || false,
      competitive_exam_details: competitive_exam_details || null,
      is_seeking_opportunities: is_seeking_opportunities || false,
      opportunity_preferences: opportunity_preferences || null
    };

    // Validation
    if (!branch || !program || !sanitizedData.passing_year) {
      return res.status(400).json({
        success: false,
        message: 'Branch, program, and passing year are required'
      });
    }

    // LinkedIn profile validation
    if (!linkedin_profile || !linkedin_profile.includes('linkedin.com')) {
      return res.status(400).json({
        success: false,
        message: 'A valid LinkedIn profile URL (containing linkedin.com) is required'
      });
    }

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM alumni_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let profile;
    if (existingProfile.rows.length === 0) {
      // Create new profile
      profile = await pool.query(
        `INSERT INTO alumni_profiles 
         (user_id, age, passing_year, branch, program, is_employed, employer, position, 
          experience, linkedin_profile, location, previous_campus, skills, achievements, bio, website_url, github_profile,
          current_institution, current_course, institution_country, is_pursuing_higher_education, expected_graduation_year,
          is_preparing_competitive_exams, competitive_exam_details, is_seeking_opportunities, opportunity_preferences)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         RETURNING *`,
        [
          req.user.id, sanitizedData.age, sanitizedData.passing_year, sanitizedData.branch, 
          sanitizedData.program, sanitizedData.is_employed, sanitizedData.employer, sanitizedData.position, 
          sanitizedData.experience, sanitizedData.linkedin_profile, sanitizedData.location,
          sanitizedData.previous_campus, sanitizedData.skills, sanitizedData.achievements, sanitizedData.bio, sanitizedData.website_url, 
          sanitizedData.github_profile, sanitizedData.current_institution, sanitizedData.current_course, 
          sanitizedData.institution_country, sanitizedData.is_pursuing_higher_education, sanitizedData.expected_graduation_year,
          sanitizedData.is_preparing_competitive_exams, sanitizedData.competitive_exam_details,
          sanitizedData.is_seeking_opportunities, sanitizedData.opportunity_preferences
        ]
      );

      // Mark profile as complete and update full name and mobile if provided
      if (sanitizedData.full_name || sanitizedData.mobile) {
        // Use secure parameterized query instead of dynamic construction
        if (sanitizedData.full_name && sanitizedData.mobile) {
          await pool.query(
            'UPDATE users SET profile_complete = true, full_name = $1, mobile = $2 WHERE id = $3',
            [sanitizedData.full_name, sanitizedData.mobile, req.user.id]
          );
        } else if (sanitizedData.full_name) {
          await pool.query(
            'UPDATE users SET profile_complete = true, full_name = $1 WHERE id = $2',
            [sanitizedData.full_name, req.user.id]
          );
        } else if (sanitizedData.mobile) {
          await pool.query(
            'UPDATE users SET profile_complete = true, mobile = $1 WHERE id = $2',
            [sanitizedData.mobile, req.user.id]
          );
        }
      } else {
        await pool.query(
          'UPDATE users SET profile_complete = true WHERE id = $1',
          [req.user.id]
        );
      }

      // Send profile submission notification email if user is not yet approved
      try {
        const uRes = await pool.query('SELECT email, full_name, is_approved FROM users WHERE id = $1', [req.user.id]);
        if (uRes.rows.length > 0 && !uRes.rows[0].is_approved) {
          await sendSubmissionEmail(uRes.rows[0].email, uRes.rows[0].full_name || sanitizedData.full_name);
        }
      } catch (err) {
        console.error('Failed to trigger alumni submission email:', err.message);
      }
    } else {
      // Update existing profile
      profile = await pool.query(
        `UPDATE alumni_profiles SET 
         age = $2, passing_year = $3, branch = $4, program = $5, is_employed = $6,
         employer = $7, position = $8, experience = $9, linkedin_profile = $10,
         location = $11, previous_campus = $12, skills = $13, achievements = $14, bio = $15, 
         website_url = $16, github_profile = $17, current_institution = $18,
         current_course = $19, institution_country = $20, is_pursuing_higher_education = $21,
         expected_graduation_year = $22, is_preparing_competitive_exams = $23, competitive_exam_details = $24,
         is_seeking_opportunities = $25, opportunity_preferences = $26, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 RETURNING *`,
        [
          req.user.id, sanitizedData.age, sanitizedData.passing_year, sanitizedData.branch, 
          sanitizedData.program, sanitizedData.is_employed, sanitizedData.employer, sanitizedData.position, 
          sanitizedData.experience, sanitizedData.linkedin_profile, sanitizedData.location,
          sanitizedData.previous_campus, sanitizedData.skills, sanitizedData.achievements, sanitizedData.bio, sanitizedData.website_url, 
          sanitizedData.github_profile, sanitizedData.current_institution, sanitizedData.current_course, 
          sanitizedData.institution_country, sanitizedData.is_pursuing_higher_education, sanitizedData.expected_graduation_year,
          sanitizedData.is_preparing_competitive_exams, sanitizedData.competitive_exam_details,
          sanitizedData.is_seeking_opportunities, sanitizedData.opportunity_preferences
        ]
      );

      // Mark profile as complete and update full name and mobile if provided
      if (sanitizedData.full_name || sanitizedData.mobile) {
        // Use secure parameterized query instead of dynamic construction
        if (sanitizedData.full_name && sanitizedData.mobile) {
          await pool.query(
            'UPDATE users SET profile_complete = true, full_name = $1, mobile = $2 WHERE id = $3',
            [sanitizedData.full_name, sanitizedData.mobile, req.user.id]
          );
        } else if (sanitizedData.full_name) {
          await pool.query(
            'UPDATE users SET profile_complete = true, full_name = $1 WHERE id = $2',
            [sanitizedData.full_name, req.user.id]
          );
        } else if (sanitizedData.mobile) {
          await pool.query(
            'UPDATE users SET profile_complete = true, mobile = $1 WHERE id = $2',
            [sanitizedData.mobile, req.user.id]
          );
        }
      } else {
        await pool.query(
          'UPDATE users SET profile_complete = true WHERE id = $1',
          [req.user.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: profile.rows[0]
    });

  } catch (error) {
    console.error('Update alumni profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/student
 * Get student profile
 */
router.get('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students only.'
      });
    }

    const profile = await pool.query(
      `SELECT sp.*, u.full_name, u.email, u.mobile, u.roll_no 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.user_id = $1`,
      [req.user.id]
    );

    if (profile.rows.length === 0) {
      return res.json({
        success: true,
        profile: null,
        message: 'Profile not found. Please complete your profile.'
      });
    }

    res.json({
      success: true,
      profile: profile.rows[0]
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/student
 * Update student profile
 */
router.put('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students only.'
      });
    }

    const {
      current_year, branch, program, semester, cgpa,
      interests, skills, projects, internships,
      linkedin_profile, github_profile
    } = req.body;

    // Validation
    if (!branch || !program || !current_year || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Branch, program, current year, and semester are required'
      });
    }

    // LinkedIn profile validation
    if (!linkedin_profile || !linkedin_profile.includes('linkedin.com')) {
      return res.status(400).json({
        success: false,
        message: 'A valid LinkedIn profile URL (containing linkedin.com) is required'
      });
    }

    // Validate and format projects array
    let formattedProjects = [];
    if (projects && Array.isArray(projects)) {
      formattedProjects = projects.map(project => ({
        name: project.name || '',
        description: project.description || '',
        deployed_link: project.deployed_link || ''
      }));
    }

    // Validate and format internships array
    let formattedInternships = [];
    if (internships && Array.isArray(internships)) {
      formattedInternships = internships.map(internship => ({
        company_name: internship.company_name || '',
        position: internship.position || '',
        description: internship.description || ''
      }));
    }

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM student_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let profile;
    if (existingProfile.rows.length === 0) {
      // Create new profile
      profile = await pool.query(
        `INSERT INTO student_profiles 
         (user_id, current_year, branch, program, semester, cgpa, interests, skills, projects, internships, linkedin_profile, github_profile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.user.id, current_year, branch, program, semester, cgpa,
          interests || [], skills || [], JSON.stringify(formattedProjects), JSON.stringify(formattedInternships), linkedin_profile, github_profile
        ]
      );

      // Mark profile as complete
      await pool.query(
        'UPDATE users SET profile_complete = true WHERE id = $1',
        [req.user.id]
      );

      // Send profile submission notification email if user is not yet approved
      try {
        const uRes = await pool.query('SELECT email, full_name, is_approved FROM users WHERE id = $1', [req.user.id]);
        if (uRes.rows.length > 0 && !uRes.rows[0].is_approved) {
          await sendSubmissionEmail(uRes.rows[0].email, uRes.rows[0].full_name);
        }
      } catch (err) {
        console.error('Failed to trigger student submission email:', err.message);
      }
    } else {
      // Update existing profile
      profile = await pool.query(
        `UPDATE student_profiles SET 
         current_year = $2, branch = $3, program = $4, semester = $5, cgpa = $6,
         interests = $7, skills = $8, projects = $9, internships = $10, 
         linkedin_profile = $11, github_profile = $12, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 RETURNING *`,
        [
          req.user.id, current_year, branch, program, semester, cgpa,
          interests || [], skills || [], JSON.stringify(formattedProjects), JSON.stringify(formattedInternships), linkedin_profile, github_profile
        ]
      );

      // Mark profile as complete
      await pool.query(
        'UPDATE users SET profile_complete = true WHERE id = $1',
        [req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: profile.rows[0]
    });

  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile/upload-picture
 * Upload profile picture to Cloudinary and update user record
 */
router.post('/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get current user data to check for existing profile picture
    const currentUser = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldProfilePictureUrl = currentUser.rows[0].profile_picture_url;

    // Update user record with new profile picture URL
    const updateResult = await pool.query(
      'UPDATE users SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING profile_picture_url',
      [req.file.path, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile picture'
      });
    }

    // Delete old profile picture from Cloudinary (if exists)
    if (oldProfilePictureUrl) {
      const oldPublicId = extractPublicId(oldProfilePictureUrl);
      await deleteProfilePicture(oldPublicId);
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully!',
      profilePictureUrl: req.file.path,
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    
    // If file was uploaded to Cloudinary but database update failed, clean up
    if (req.file && req.file.filename) {
      await deleteProfilePicture(req.file.filename);
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files (JPEG, PNG, WebP) are allowed.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture. Please try again.'
    });
  }
});

/**
 * DELETE /api/profile/remove-picture
 * Remove profile picture
 */
router.delete('/remove-picture', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current profile picture URL
    const currentUser = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profilePictureUrl = currentUser.rows[0].profile_picture_url;

    if (!profilePictureUrl) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to remove'
      });
    }

    // Remove profile picture URL from database
    await pool.query(
      'UPDATE users SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // Delete from Cloudinary
    const publicId = extractPublicId(profilePictureUrl);
    await deleteProfilePicture(publicId);

    res.json({
      success: true,
      message: 'Profile picture removed successfully!'
    });

  } catch (error) {
    console.error('Profile picture removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile picture. Please try again.'
    });
  }
});

/**
 * GET /api/profile/picture
 * Get current user's profile picture URL
 */
router.get('/picture', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT profile_picture_url, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        profilePictureUrl: user.profile_picture_url,
        fullName: user.full_name,
        hasProfilePicture: !!user.profile_picture_url
      }
    });

  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile picture'
    });
  }
});

module.exports = router;
