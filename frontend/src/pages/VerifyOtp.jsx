import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  const email = localStorage.getItem('signup_email') || localStorage.getItem('login_email');
  const sessionId = localStorage.getItem('signup_sessionId') || localStorage.getItem('login_sessionId');
  const userType = localStorage.getItem('signup_userType') || 'user';
  const isLoginFlow = localStorage.getItem('login_email');

  useEffect(() => {
    if (!email || (!isLoginFlow && !sessionId)) {
      navigate('/signup');
      return;
    }

    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    console.log('=== STARTING OTP VERIFICATION ===');
    console.log('OTP String:', otpString);
    console.log('Session ID:', sessionId);
    console.log('Is Login Flow:', isLoginFlow);

    try {
      const endpoint = isLoginFlow ? '/api/auth/verify-login-otp' : '/api/auth/verify-otp';
      const requestData = isLoginFlow 
        ? { email, otp: otpString }
        : { sessionId, otp: otpString };

      console.log('Making request to:', endpoint);
      console.log('Request data:', requestData);

      const response = await api.post(endpoint, requestData);
      
      console.log('=== OTP VERIFICATION SUCCESS ===');
      console.log('Full Response:', response);
      console.log('Response Data:', response.data);
      console.log('Response Status:', response.status);

      if (isLoginFlow) {
        // Login flow - store token and check if profile exists
        console.log('Processing login flow');
        localStorage.setItem('token', response.data.token);
        localStorage.removeItem('login_email');
        
        // Refresh auth state to get user data
        await checkAuthStatus();
        
        toast.success('Login successful!');
        
        if (response.data.needsProfile) {
          navigate('/first-time');
        } else if (response.data.userType === 'alumni') {
          navigate('/alumni-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      } else {
        // Signup flow - show user info and proceed to password setting
        console.log('=== PROCESSING SIGNUP FLOW ===');
        console.log('Response sessionId:', response.data.sessionId);
        console.log('Response userType:', response.data.userType);
        console.log('Response userData:', response.data.userData);
        
        // Store session info for password setting FIRST
        console.log('Setting password_sessionId to:', response.data.sessionId);
        localStorage.setItem('password_sessionId', response.data.sessionId);
        localStorage.setItem('user_type', response.data.userType);
        
        console.log('Current localStorage after setting:');
        console.log('password_sessionId:', localStorage.getItem('password_sessionId'));
        console.log('user_type:', localStorage.getItem('user_type'));
        
        toast.success(response.data.message);
        console.log('About to navigate to /set-password...');
        
        // Navigate to set password page with delay to ensure localStorage is updated
        setTimeout(() => {
          console.log('In setTimeout, clearing old localStorage items...');
          // Clear signup-related localStorage after navigation
          localStorage.removeItem('signup_email');
          localStorage.removeItem('signup_sessionId');
          localStorage.removeItem('signup_userType');
          
          console.log('Navigating to /set-password now...');
          // Navigate to set password page
          navigate('/set-password', { 
            state: { 
              userData: response.data.userData,
              userType: response.data.userType
            }
          });
        }, 100);
      }
    } catch (error) {
      console.error('=== OTP VERIFICATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      if (error.response?.data) {
        console.error('Server error message:', error.response.data.message);
      }
      
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== OTP VERIFICATION COMPLETED ===');
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const endpoint = isLoginFlow ? '/api/auth/resend-login-otp' : '/api/auth/resend-otp';
      const requestData = isLoginFlow 
        ? { email } 
        : { sessionId };
        
      await api.post(endpoint, requestData);
      toast.success('OTP resent successfully!');
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
          <div className="text-gray-600">
            <p>Enter the 6-digit code sent to</p>
            <p className="font-semibold text-blue-600">{email}</p>
            {!isLoginFlow && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Registering as: <span className="font-semibold capitalize">{userType}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
              >
                {resendLoading ? 'Resending...' : 'Resend OTP'}
              </button>
            ) : (
              <p className="text-gray-500">
                Resend OTP in {timer} seconds
              </p>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                localStorage.removeItem('signup_email');
                localStorage.removeItem('signup_sessionId');
                localStorage.removeItem('signup_userType');
                localStorage.removeItem('login_email');
                localStorage.removeItem('login_sessionId');
                navigate(isLoginFlow ? '/login' : '/signup');
              }}
              className="text-gray-600 hover:text-gray-700 font-semibold"
            >
              ← Back to {isLoginFlow ? 'Login' : 'Signup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
