/**
 * 📧 Email Service - SMTP Only (Nodemailer)
 * Uses Gmail SMTP for sending transactional emails
 * 
 * Required environment variables:
 * - SMTP_USER: Gmail email address
 * - SMTP_PASS: Gmail app password (not regular password)  
 * - SMTP_HOST: Gmail SMTP server (defaults to smtp.gmail.com)
 * - SMTP_PORT: SMTP port (defaults to 587)
 */

const nodemailer = require('nodemailer');

/**
 * Create SMTP transporter (Gmail)
 */
const createSMTPTransporter = () => {
  // Check for required environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials missing');
    console.error('   Required: SMTP_USER and SMTP_PASS environment variables');
    console.error('   SMTP_USER should be your Gmail address');
    console.error('   SMTP_PASS should be your Gmail App Password (not regular password)');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // Use STARTTLS for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      // Additional options for better reliability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    console.log('✅ SMTP email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create SMTP transporter:', error.message);
    return null;
  }
};

/**
 * Email templates
 */
const getEmailTemplate = (otp, type = 'signup') => {
  const templates = {
    signup: {
      subject: '🎓 GBPANT Alumni Portal - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GB Pant College</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Alumni Portal</p>
          </div>
          <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin: 0 0 20px 0;">Welcome to Alumni Portal!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Thank you for signing up. Please verify your email address using the code below:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <div style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 12px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${otp}</div>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              ⏱️ This code will expire in <strong style="color: #dc2626;">10 minutes</strong>.
            </p>
            <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 GB Pant College Alumni Portal. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to GB Pant College Alumni Portal!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    },
    login: {
      subject: '🔐 GBPANT Alumni Portal - Login Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Login Verification</h1>
          </div>
          <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin: 0 0 20px 0;">Verify Your Login</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Enter this verification code to complete your login:</p>
            
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <div style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 12px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${otp}</div>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              ⏱️ This code will expire in <strong style="color: #dc2626;">10 minutes</strong>.
            </p>
            <p style="color: #dc2626; font-size: 13px; font-weight: 500; margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
              ⚠️ If you didn't request this login, someone may be trying to access your account. Please change your password immediately.
            </p>
          </div>
        </div>
      `,
      text: `Login Verification Code: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please change your password immediately.`
    },
    password_reset: {
      subject: '🔑 GBPANT Alumni Portal - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
          </div>
          <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin: 0 0 20px 0;">Reset Your Password</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">You requested to reset your password. Use this verification code:</p>
            
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <div style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 12px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${otp}</div>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              ⏱️ This code will expire in <strong style="color: #dc2626;">10 minutes</strong>.
            </p>
            <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #dc2626; font-weight: 600; margin: 0 0 10px 0;">⚠️ SECURITY WARNING</p>
              <p style="color: #991b1b; font-size: 13px; margin: 0; line-height: 1.6;">
                If you didn't request this password reset, someone may be trying to access your account. Please:
              </p>
              <ul style="color: #991b1b; font-size: 13px; margin: 10px 0 0 20px;">
                <li>Ignore this email and do not share the code</li>
                <li>Change your password immediately if you suspect unauthorized access</li>
                <li>Contact support if you have concerns</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      text: `Password Reset Code: ${otp}\n\nThis code will expire in 10 minutes.\n\nWARNING: If you didn't request this, someone may be trying to access your account. Please ignore this email and change your password immediately.`
    }
  };

  return templates[type] || templates.signup;
};

/**
 * Send email via SMTP (Gmail)
 */
const sendViaSMTP = async (email, otp, type = 'signup') => {
  const transporter = createSMTPTransporter();
  
  if (!transporter) {
    console.error('❌ SMTP transporter not available');
    console.error('   Check your EMAIL_USER and EMAIL_PASS environment variables');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    // Verify SMTP connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const template = getEmailTemplate(otp, type);
    
    const mailOptions = {
      from: `"GBPANT Alumni Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully via SMTP');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', email.replace(/(.{2}).*@/, '$1***@'));
    
    return { success: true, messageId: info.messageId, provider: 'smtp' };

  } catch (error) {
    console.error('❌ SMTP send error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed - check EMAIL_USER and EMAIL_PASS');
      console.error('   Make sure EMAIL_PASS is a Gmail App Password, not regular password');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('   Connection failed - SMTP ports may be blocked');
      console.error('   On Render free tier, upgrade to paid plan to use SMTP');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Main send email function - SMTP only
 */
const sendOTPEmail = async (email, otp, type = 'signup') => {
  // Validate inputs
  if (!email || !otp) {
    console.error('❌ Missing email or OTP');
    return false;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    console.error('❌ Invalid email format:', email);
    return false;
  }

  // Validate OTP format (should be 6 digits)
  if (!/^\d{6}$/.test(otp)) {
    console.error('❌ Invalid OTP format - must be 6 digits');
    return false;
  }

  console.log(`📧 Sending ${type} OTP via SMTP to ${email.replace(/(.{2}).*@/, '$1***@')}`);

  try {
    const result = await sendViaSMTP(email, otp, type);

    if (result.success) {
      console.log(`✅ Email sent successfully via SMTP`);
      return true; // Return boolean for backward compatibility
    } else {
      console.error(`❌ Failed to send email: ${result.error}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return false;
  }
};

/**
 * Send account approval notification email
 */
const sendApprovalEmail = async (email, fullName) => {
  if (!email) {
    console.error('❌ Missing email for approval notification');
    return false;
  }

  const transporter = createSMTPTransporter();
  if (!transporter) {
    console.error('❌ SMTP transporter not available for approval email');
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GB Pant College</h1>
        <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Alumni Portal</p>
      </div>
      <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #059669; margin: 0 0 20px 0;">✅ Account Approved!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Dear <strong>${fullName || 'User'}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          We're delighted to inform you that your GB Pant College Alumni Portal account has been reviewed and <strong style="color: #059669;">approved</strong>!
        </p>
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; text-align: center; border-radius: 10px; margin: 30px 0;">
          <p style="color: white; font-size: 18px; font-weight: bold; margin: 0;">You can now log in and access all features of the alumni portal.</p>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          As a verified member, you can now:
        </p>
        <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; padding-left: 20px;">
          <li>Browse the alumni and student directory</li>
          <li>Connect with fellow alumni and current students</li>
          <li>Share your professional journey and achievements</li>
          <li>Update your profile anytime from your dashboard</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
            Login to Portal →
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          If you have any questions, feel free to reach out to the admin team.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} GB Pant College Alumni Portal. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"GBPANT Alumni Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Your GBPANT Alumni Portal Account Has Been Approved!',
      html,
      text: `Dear ${fullName || 'User'},\n\nYour GB Pant College Alumni Portal account has been approved! You can now log in and access all features.\n\nLogin at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login\n\nWelcome to the community!`
    });

    console.log('✅ Approval email sent to:', email.replace(/(.{2}).*@/, '$1***@'));
    console.log('   Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send approval email:', error.message);
    return false;
  }
};


/**
 * Send profile submission confirmation email (under review)
 */
const sendSubmissionEmail = async (email, fullName) => {
  if (!email) {
    console.error('❌ Missing email for submission notification');
    return false;
  }

  const transporter = createSMTPTransporter();
  if (!transporter) {
    console.error('❌ SMTP transporter not available for submission email');
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GB Pant College</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">Alumni Portal</p>
      </div>
      <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #d97706; margin: 0 0 20px 0;">📝 Profile Submitted for Review</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Dear <strong>${fullName || 'User'}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for completing your profile on the GB Pant College Alumni Portal! Your profile details have been submitted and are currently <strong>under review</strong> by our administration team.
        </p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
            ⏳ <strong>Next Steps:</strong> Once our admin verifies your details, you will receive an approval email. You will then be officially onboarded and gain full access to all features, including the Alumni & Student directories.
          </p>
        </div>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 0;">
            ⚠️ <strong>Important Notice:</strong> Please ensure all submitted academic and personal information is accurate. If details cannot be verified, the account will be deleted.
          </p>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          If you have any questions, feel free to reach out to the administration team.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} GB Pant College Alumni Portal. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"GBPANT Alumni Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '📝 Profile Submitted for Verification - GBPANT Alumni Portal',
      html,
      text: `Dear ${fullName || 'User'},\n\nYour profile details for GB Pant College Alumni Portal have been submitted for administrator review.\n\nYou will receive an approval email once your profile is verified. In case details are unverified, the account will be deleted.\n\nThank you for your patience!`
    });

    console.log('✅ Submission confirmation email sent to:', email.replace(/(.{2}).*@/, '$1***@'));
    console.log('   Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send submission email:', error.message);
    return false;
  }
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  sendOTPEmail,
  isValidEmail,
  sendApprovalEmail,
  sendSubmissionEmail,
  // Export individual methods for testing
  sendViaSMTP,
  createSMTPTransporter
};

