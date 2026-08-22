import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import Captcha from '../components/Captcha';
import PhoneInput from '../components/PhoneInput';
import Layout from '../components/Layout';
import SuspiciousEmailModal from '../components/SuspiciousEmailModal';
import BlockedAccessModal from '../components/BlockedAccessModal';
import api from '../utils/api';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    rollNo: '',
    isCurrentStudent: false
  });
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState(false);
  const [showSuspiciousEmailModal, setShowSuspiciousEmailModal] = useState(false);
  const [showBlockedAccessModal, setShowBlockedAccessModal] = useState(false);
  const [blockingInfo, setBlockingInfo] = useState({});
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCaptchaVerify = (isVerified) => {
    setCaptchaVerified(isVerified);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
      // Clear roll number if switching to alumni
      ...(name === 'isCurrentStudent' && !checked ? { rollNo: '' } : {})
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check CAPTCHA verification first
    if (!captchaVerified) {
      toast.error('Please verify the CAPTCHA before signing up');
      return;
    }

    // Validate student roll number requirement
    if (formData.isCurrentStudent && (!formData.rollNo || formData.rollNo.trim() === '')) {
      toast.error('Roll number is required for current students');
      return;
    }
    
    // Show confirmation modal instead of directly submitting
    setShowConfirmModal(true);
  };

  const handleConfirmSignup = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        rollNo: formData.isCurrentStudent ? formData.rollNo : null,
        isCurrentStudent: formData.isCurrentStudent
      };

      const response = await api.post('/api/auth/signup', submitData);

      // Handle already registered user response
      if (response.data.alreadyRegistered) {
        setShowAlreadyRegisteredModal(true);
        return;
      }
      
      // Store session ID, email and user type for OTP verification
      localStorage.setItem('signup_sessionId', response.data.sessionId);
      localStorage.setItem('signup_email', formData.email);
      localStorage.setItem('signup_name', formData.fullName);
      localStorage.setItem('signup_userType', response.data.userType);
      
      toast.success(response.data.message);
      navigate('/verify-otp');
    } catch (error) {
      if (error.response?.data?.alreadyRegistered) {
        setShowAlreadyRegisteredModal(true);
        return;
      }
      // Check for different types of blocking errors
      const errorType = error.response?.data?.errorType;
      const errorData = error.response?.data;
      
      if (errorType === 'TEMP_EMAIL_DETECTED' || errorType === 'TEMP_EMAIL_BLOCKED') {
        setShowSuspiciousEmailModal(true);
      } else if (errorType === 'DOMAIN_BLOCKED_DATABASE') {
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
        toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
      }
      
      // Reset CAPTCHA on signup failure for security
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

  return (
    <Layout showNav={false} showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex justify-center mb-6 group">
              <img 
                src="/logo1.png" 
                alt="GBPANT Alumni Portal" 
                className="h-20 sm:h-24 md:h-28 lg:h-48 w-auto object-contain group-hover:scale-105 transition-all duration-200"
              />
            </Link>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Join Our Community</h2>
            <p className="text-slate-600">
              Connect with fellow GBPANT alumni and current students worldwide
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm font-medium shadow-sm">
              <span>💻</span>
              <span>Tip: Please preferably use a <strong>PC or Laptop</strong> for a seamless registration experience.</span>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Account Type Selection */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Account Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  !formData.isCurrentStudent 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="isCurrentStudent"
                    value={false}
                    checked={!formData.isCurrentStudent}
                    onChange={(e) => setFormData({...formData, isCurrentStudent: false, rollNo: ''})}
                    className="sr-only"
                  />
                  <div className="text-center w-full">
                    <div className="text-2xl mb-2">🎓</div>
                    <div className="font-semibold">Alumni</div>
                    <div className="text-sm opacity-75">Graduate</div>
                  </div>
                  {!formData.isCurrentStudent && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>

                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.isCurrentStudent 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="isCurrentStudent"
                    value={true}
                    checked={formData.isCurrentStudent}
                    onChange={(e) => setFormData({...formData, isCurrentStudent: true})}
                    className="sr-only"
                  />
                  <div className="text-center w-full">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-semibold">Student</div>
                    <div className="text-sm opacity-75">Current</div>
                  </div>
                  {formData.isCurrentStudent && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Full Name */}
              <div>
                <label 
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="Enter your full name"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    👤
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label 
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address *
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
                <p className="text-xs text-slate-500 mt-1">
                  We'll send verification code to this email
                </p>
              </div>

              {/* Mobile */}
              <div>
                <label 
                  htmlFor="mobile"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Mobile Number *
                </label>
                <PhoneInput
                  value={formData.mobile}
                  onChange={(phone) => setFormData({...formData, mobile: phone})}
                  placeholder="Enter your mobile number"
                  required={true}
                />
              </div>

              {/* Roll Number - Only for students */}
              {formData.isCurrentStudent && (
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <label 
                    htmlFor="rollNo"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Roll Number *
                  </label>
                  <div className="relative">
                    <input
                      id="rollNo"
                      type="text"
                      name="rollNo"
                      required={formData.isCurrentStudent}
                      value={formData.rollNo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white"
                      placeholder="Enter your roll number"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                      🎯
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Required for current students for verification
                  </p>
                </div>
              )}

              {/* Privacy Note */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Privacy Protected</h4>
                    <p className="text-sm text-green-700">
                      <strong>Note:</strong> Personal information such as mobile numbers and email addresses is not visible to either alumni or students.
                    </p>
                  </div>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Security Verification
                </label>
                <div className="flex justify-center p-2 bg-slate-50 rounded-xl overflow-hidden">
                  <div className="w-full max-w-[300px] flex justify-center">
                    <Captcha
                      ref={captchaRef}
                      onVerify={handleCaptchaVerify}
                      difficulty="medium"
                      width={isMobile ? 260 : 300}
                      height={isMobile ? 60 : 70}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating your account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FaUserPlus />
                    <span>Create Account</span>
                  </div>
                )}
              </button>

              {/* Terms */}
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Privacy Policy
                </Link>
              </p>
            </form>

            {/* Divider */}
            <div className="px-6 pb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Already have an account?</span>
                </div>
              </div>

              {/* Login link */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <FaSignInAlt className="mr-2" />
                  Sign In Instead
                </Link>
              </div>

              {/* Back to Home */}
              <div className="mt-4 text-center">
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
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-4 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Account Type
              </h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-semibold mb-2">
                You have chosen {formData.isCurrentStudent ? 'Student' : 'Alumni'} account type
              </p>
              <p className="text-blue-700">
                {formData.isCurrentStudent 
                  ? "You are currently studying in GB Pant DSEU Campus"
                  : "You have graduated from the GB Pant Engineering college or GB Pant Polytechnic or GB Pant DSEU Okhla Campus"
                }
              </p>
            </div>
            
            <p className="text-sm text-gray-600 mb-8 text-center">
              If you have chosen the wrong account type, cancel this and choose the right account type. Click CONFIRM to send OTP and continue the process.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignup}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                {loading ? 'Sending OTP...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspicious Email Modal */}
      <SuspiciousEmailModal 
        isOpen={showSuspiciousEmailModal}
        onClose={() => setShowSuspiciousEmailModal(false)}
      />

      {/* Blocked Access Modal */}
      <BlockedAccessModal
        isOpen={showBlockedAccessModal}
        onClose={() => setShowBlockedAccessModal(false)}
        blockType={blockingInfo.blockType}
        blockReason={blockingInfo.blockReason}
        blockedValue={blockingInfo.blockedValue}
        contactInfo={blockingInfo.contactInfo}
      />

      {/* Already Registered Modal */}
      {showAlreadyRegisteredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Account Already Exists!
            </h3>
            
            <p className="text-slate-600 text-sm mb-4">
              An account with the email <strong>{formData.email}</strong> is already registered on the portal. You do not need to sign up again.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
              <p className="text-blue-900 font-semibold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <span>📧 Instructions Sent to Your Email:</span>
              </p>
              <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                We have just sent an email with login & password reset links. Please check your inbox and <strong>Spam / Promotions section</strong>.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-left">
              <p className="text-amber-900 text-xs sm:text-sm">
                🔑 <strong>Forgot your password?</strong> You can reset it instantly by clicking below.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/login', { state: { email: formData.email } })}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Log In Now
              </button>
              <button
                type="button"
                onClick={() => navigate('/forgot-password', { state: { email: formData.email } })}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition-colors"
              >
                Reset Password
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAlreadyRegisteredModal(false)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
