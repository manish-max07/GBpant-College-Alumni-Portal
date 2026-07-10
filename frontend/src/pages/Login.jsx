import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import Captcha from '../components/Captcha';
import Layout from '../components/Layout';
import BlockedAccessModal from '../components/BlockedAccessModal';
import SuspiciousEmailModal from '../components/SuspiciousEmailModal';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBlockedAccessModal, setShowBlockedAccessModal] = useState(false);
  const [showSuspiciousEmailModal, setShowSuspiciousEmailModal] = useState(false);
  const [blockingInfo, setBlockingInfo] = useState({});
  const captchaRef = useRef(null);
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for login notification flag
  useEffect(() => {
    const showNotification = localStorage.getItem('show_login_notification');
    if (showNotification === 'true') {
      setShowNotificationModal(true);
      localStorage.removeItem('show_login_notification'); // Remove flag after showing
    }
  }, []);

  const handleCaptchaVerify = (isVerified) => {
    setCaptchaVerified(isVerified);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check CAPTCHA verification first
    if (!captchaVerified) {
      toast.error('Please verify the CAPTCHA before logging in');
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', formData);
      
      if (response.data.requiresOtp) {
        // Store email for OTP verification
        localStorage.setItem('login_email', formData.email);
        toast.success('OTP sent to your email for verification');
        navigate('/verify-otp');
      } else {
        // Direct login (no OTP required)
        localStorage.setItem('token', response.data.token);
        toast.success('Login successful!');
        
        // Refresh auth state to get user data
        await checkAuthStatus();
        
        // Check if user needs to complete profile
        if (response.data.needsProfile) {
          navigate('/first-time');
        } else if (response.data.userType === 'alumni') {
          navigate('/alumni-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      }
    } catch (error) {
      // Check for different types of blocking errors
      const errorType = error.response?.data?.errorType;
      const errorData = error.response?.data;
      
      if (errorType === 'DOMAIN_BLOCKED_DATABASE') {
        // Show SuspiciousEmailModal for domain blocked in database
        setShowSuspiciousEmailModal(true);
      } else if (errorType === 'IP_BLOCKED_DATABASE' || 
          errorType === 'EMAIL_BLOCKED_DATABASE') {
        // Set blocking info for the modal
        setBlockingInfo({
          blockType: errorType,
          blockReason: errorData.message,
          blockedValue: errorData.blockedIP || errorData.blockedEmail,
          contactInfo: errorData.contactInfo
        });
        setShowBlockedAccessModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
      
      // Reset CAPTCHA on login failure for security
      setCaptchaVerified(false);
      
      // Add a small delay before resetting captcha to ensure user sees the error
      setTimeout(() => {
        if (captchaRef.current) {
          captchaRef.current.reset();
          toast.info('Please verify the new CAPTCHA to try again', {
            duration: 3000,
            icon: '🔄'
          });
        }
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Layout showNav={false} showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex justify-center mb-6 group">
              <img 
                src="/logo1.png" 
                alt="GBPANT Alumni Portal" 
                className="h-20 sm:h-24 md:h-28 lg:h-48 w-auto object-contain group-hover:scale-105 transition-all duration-200"
              />
            </Link>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600">
              Sign in to access your alumni portal and connect with the community
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="your.email@example.com"
                    autoComplete="email"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    📧
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    🔒
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* CAPTCHA Component */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Verification
                </label>
                <div className="flex justify-center p-2 bg-slate-50 rounded-xl overflow-hidden">
                  <div className="w-full max-w-[280px] flex justify-center">
                    <Captcha
                      ref={captchaRef}
                      onVerify={handleCaptchaVerify}
                      difficulty="medium"
                      width={isMobile ? 240 : 280}
                      height={isMobile ? 50 : 60}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-slate-600">Remember me</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FaSignInAlt />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">New to GBPANT Alumni?</span>
              </div>
            </div>

            {/* Sign up link */}
            <div className="mt-6 text-center">
              <Link
                to="/signup"
                className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <FaUserPlus className="mr-2" />
                Create Account
              </Link>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:underline"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Login Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-4 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Registration Completed Successfully!
              </h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-800 font-semibold mb-3">
                📧 Login with your email and recently created password to complete your profile
              </p>
              <p className="text-blue-700 text-sm">
                This step is mandatory for first-time login to access all features of the alumni portal.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Access Modal */}
      <BlockedAccessModal
        isOpen={showBlockedAccessModal}
        onClose={() => setShowBlockedAccessModal(false)}
        blockType={blockingInfo.blockType}
        blockReason={blockingInfo.blockReason}
        blockedValue={blockingInfo.blockedValue}
        contactInfo={blockingInfo.contactInfo}
      />

      {/* Suspicious Email Modal for Domain Blocking */}
      <SuspiciousEmailModal
        isOpen={showSuspiciousEmailModal}
        onClose={() => setShowSuspiciousEmailModal(false)}
      />
    </Layout>
  );
}
