const { pool } = require('../config/database'); // Use centralized database config

class OTPSessionManager {
  constructor() {
    // Use the centralized database pool instead of creating a new one
    this.pool = pool;
  }

  /**
   * Create a new OTP session
   */
  async createSession({ email, otp, otpType, userType, fullName, mobile, rollNo }) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      const result = await this.pool.query(`
        INSERT INTO otp_sessions (
          email, otp, otp_type, user_type, full_name, mobile, roll_no, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING session_id, expires_at
      `, [email, otp, otpType, userType, fullName, mobile, rollNo, expiresAt]);

      return {
        sessionId: result.rows[0].session_id,
        expiresAt: result.rows[0].expires_at
      };
    } catch (error) {
      console.error('Error creating OTP session:', error);
      throw error;
    }
  }

  /**
   * Get OTP session by session ID
   */
  async getSession(sessionId) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM otp_sessions 
        WHERE session_id = $1 AND expires_at > NOW()
      `, [sessionId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting OTP session:', error);
      throw error;
    }
  }

  /**
   * Verify OTP for a session
   */
  async verifyOTP(sessionId, otp) {
    try {
      console.log(`Verifying OTP for session: ${sessionId}, OTP: ${otp}`);
      
      const session = await this.getSession(sessionId);
      console.log('Retrieved session:', session);
      
      if (!session) {
        return { success: false, message: 'Invalid or expired session' };
      }

      if (session.attempts >= session.max_attempts) {
        await this.deleteSession(sessionId);
        return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
      }

      if (session.otp !== otp) {
        // Increment attempts
        await this.pool.query(`
          UPDATE otp_sessions 
          SET attempts = attempts + 1 
          WHERE session_id = $1
        `, [sessionId]);
        
        return { 
          success: false, 
          message: 'Invalid OTP', 
          attemptsLeft: session.max_attempts - session.attempts - 1 
        };
      }

      // Mark as verified
      await this.pool.query(`
        UPDATE otp_sessions 
        SET verified = TRUE, updated_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);

      console.log('OTP verification successful');
      return { success: true, session };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Update session type (e.g., from signup to set_password)
   */
  async updateSessionType(sessionId, newType) {
    try {
      await this.pool.query(`
        UPDATE otp_sessions 
        SET otp_type = $1, updated_at = NOW()
        WHERE session_id = $2
      `, [newType, sessionId]);
    } catch (error) {
      console.error('Error updating session type:', error);
      throw error;
    }
  }

  /**
   * Resend OTP for existing session
   */
  async resendOTP(sessionId, newOtp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      const result = await this.pool.query(`
        UPDATE otp_sessions 
        SET otp = $1, attempts = 0, expires_at = $2, updated_at = NOW()
        WHERE session_id = $3
        RETURNING email, user_type, otp_type
      `, [newOtp, expiresAt, sessionId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    try {
      await this.pool.query(`
        DELETE FROM otp_sessions WHERE session_id = $1
      `, [sessionId]);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const result = await this.pool.query(`
        DELETE FROM otp_sessions WHERE expires_at < NOW()
      `);
      console.log(`Cleaned up ${result.rowCount} expired OTP sessions`);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Get session for password setting (must be verified signup session)
   */
  async getVerifiedSignupSession(sessionId) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM otp_sessions 
        WHERE session_id = $1 
        AND verified = TRUE 
        AND otp_type = 'signup'
        AND expires_at > NOW()
      `, [sessionId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting verified signup session:', error);
      throw error;
    }
  }
}

module.exports = OTPSessionManager;
