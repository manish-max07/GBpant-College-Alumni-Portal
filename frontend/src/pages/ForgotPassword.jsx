import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Captcha from '../components/Captcha';
import Layout from '../components/Layout';
import BlockedAccessModal from '../components/BlockedAccessModal';
import SuspiciousEmailModal from '../components/SuspiciousEmailModal';
import api from '../utils/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email & Captcha, 2: OTP Verification, 3: Reset Password
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  // Step 1 state
  const [email, setEmail] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaRef = useRef(null);
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Step 3 state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Modal state
  const [showBlockedAccessModal, setShowBlockedAccessModal] = useState(false);
  const [showSuspiciousEmailModal, setShowSuspiciousEmailModal] = useState(false);
  const [blockingInfo, setBlockingInfo] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [resendTimer, resendDisabled]);

  const handleCaptchaVerify = (isVerified) => {
    setCaptchaVerified(isVerified);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!captchaVerified) {
      toast.error('Please verify the CAPTCHA');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: email.trim(),
        captcha_session_id: 'dev-session',
        captcha_input: 'dev-captcha'
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setUserEmail(response.data.data.email);
        setUserName(response.data.data.userName);
        setStep(2);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Check if it's a blocking error
      const errorData = error.response?.data;
      const blockingTypes = ['IP_BLOCKED_DATABASE', 'EMAIL_BLOCKED_DATABASE', 'TEMP_EMAIL_BLOCKED'];
      
      if (errorData?.blockingType === 'DOMAIN_BLOCKED_DATABASE') {
        // Show SuspiciousEmailModal for domain blocked in database
        setShowSuspiciousEmailModal(true);
      } else if (errorData?.blockingType && blockingTypes.includes(errorData.blockingType)) {
        setBlockingInfo({
          type: errorData.blockingType,
          value: errorData.blockedValue || email,
          reason: errorData.reason,
          expiresAt: errorData.expiresAt,
          adminEmail: errorData.adminEmail || 'admin@gbpant.ac.in'
        });
        setShowBlockedAccessModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
      
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.refresh();
      }
      setCaptchaVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/verify-reset-otp', {
        sessionId,
        otp: otp.trim()
      });

      if (response.data.success) {
        setStep(3);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;

    setLoading(true);
    try {
      const response = await api.post('/api/auth/resend-reset-otp', {
        sessionId
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setResendDisabled(true);
        setResendTimer(60); // 60 seconds cooldown
        setOtp(''); // Clear OTP input
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to resend OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (!passwordData.confirmPassword.trim()) {
      toast.error('Please confirm your password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/reset-password', {
        sessionId,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              ${step >= stepNumber 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`
                w-16 h-1 rounded
                ${step > stepNumber ? 'bg-indigo-600' : 'bg-gray-200'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Reset Your Password</h1>
        <p className="mt-2 text-gray-600">
          Enter your email address and we'll send you an OTP to reset your password
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your registered email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Verification
          </label>
          <Captcha
            ref={captchaRef}
            onVerify={handleCaptchaVerify}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !captchaVerified}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
        <p className="mt-2 text-gray-600">
          We've sent a 6-digit code to <strong>{userEmail}</strong>
        </p>
        {userName && (
          <p className="text-sm text-gray-500">
            Hello {userName}! Please check your email for the verification code.
          </p>
        )}
      </div>

      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
            Enter 6-Digit OTP
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength="6"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendDisabled || loading}
            className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendDisabled 
              ? `Resend OTP in ${resendTimer}s` 
              : 'Resend OTP'
            }
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Set New Password</h1>
        <p className="mt-2 text-gray-600">
          Create a strong password for your account
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="mt-1 relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L4.93 4.93m0 0L9.878 9.878m-4.95-4.95l4.95 4.95" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L4.93 4.93m0 0L9.878 9.878m-4.95-4.95l4.95 4.95" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {renderStepIndicator()}
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Access Modal */}
      <BlockedAccessModal 
        isOpen={showBlockedAccessModal}
        onClose={() => setShowBlockedAccessModal(false)}
        blockingInfo={blockingInfo}
      />

      {/* Suspicious Email Modal for Domain Blocking */}
      <SuspiciousEmailModal
        isOpen={showSuspiciousEmailModal}
        onClose={() => setShowSuspiciousEmailModal(false)}
      />
    </Layout>
  );
}
