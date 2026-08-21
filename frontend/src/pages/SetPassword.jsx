import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSetSuccessfully, setPasswordSetSuccessfully] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId = localStorage.getItem('password_sessionId');
  const userType = localStorage.getItem('user_type');
  const userData = location.state?.userData;

  console.log('SetPassword Component - Debug Info:', {
    sessionId,
    userType,
    userData,
    allLocalStorage: Object.fromEntries(Object.entries(localStorage)),
    locationState: location.state
  });

  useEffect(() => {
    console.log('SetPassword useEffect triggered');
    console.log('SessionId check:', sessionId);
    console.log('Password set successfully:', passwordSetSuccessfully);
    console.log('Current localStorage:', Object.fromEntries(Object.entries(localStorage)));
    
    // Don't redirect to signup if password was already set successfully
    if (passwordSetSuccessfully) {
      console.log('Password was set successfully, not redirecting to signup');
      return;
    }
    
    if (!sessionId) {
      console.log('No sessionId found, redirecting to signup');
      navigate('/signup');
    } else {
      console.log('SessionId found, staying on SetPassword page');
    }
  }, [sessionId, navigate, passwordSetSuccessfully]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Password requirement checkers
  const hasMinLength = formData.password.length >= 8;
  const hasLowercase = /(?=.*[a-z])/.test(formData.password);
  const hasUppercase = /(?=.*[A-Z])/.test(formData.password);
  const hasNumber = /(?=.*\d)/.test(formData.password);
  const hasValidCharacters = /^[a-zA-Z\d@$!%*?&]*$/.test(formData.password);

  const validatePassword = () => {
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/(?=.*[a-z])/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter');
      return false;
    }
    
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!/(?=.*\d)/.test(formData.password)) {
      toast.error('Password must contain at least one number');
      return false;
    }
    
    if (!/^[a-zA-Z\d@$!%*?&]*$/.test(formData.password)) {
      toast.error('Password can only contain letters, numbers, and these special characters: @$!%*?&');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setLoading(true);

    try {
      console.log('Submitting password...', { sessionId });
      const response = await api.post('/api/auth/set-password', {
        sessionId,
        password: formData.password
      });

      console.log('Password set successfully:', response.data);

      // Set flag to prevent useEffect from redirecting to signup
      setPasswordSetSuccessfully(true);

      // Clean up localStorage
      localStorage.removeItem('password_sessionId');
      localStorage.removeItem('user_type');
      localStorage.removeItem('signup_email');
      
      // Set flag to show notification modal on login page
      localStorage.setItem('show_login_notification', 'true');
      
      // Show success message emphasizing profile setup
      toast.success(response.data.message || 'Password set! Please log in now to complete your profile.', {
        duration: 5000
      });
      
      // Navigate to login page
      const redirectTo = response.data.redirectTo || '/login';
      console.log('Navigating to:', redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Set password error:', error);
      toast.error(error.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your Password</h2>
          <div className="text-gray-600">
            {userData && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-blue-800">Welcome, {userData.fullName}!</p>
                <p className="text-sm text-blue-600">
                  Registering as: <span className="font-semibold capitalize">{userType}</span>
                </p>
                <p className="text-sm text-blue-600">Email: {userData.email}</p>
              </div>
            )}
            <p>Create a secure password to complete your {userType} registration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12"
                placeholder="Enter password (min 8 characters)"
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="mt-2 text-xs">
              <p className="text-gray-600 mb-2">Password requirements:</p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
                <p className="text-amber-800 font-medium text-xs">
                  ⚠️ Special characters allowed: <span className="font-mono bg-amber-100 px-1 rounded">@$!%*?&</span> only
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  Characters like #^()+-= are not permitted
                </p>
              </div>
              <ul className="space-y-1">
                <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasMinLength ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {hasMinLength ? '✓' : '○'}
                  </span>
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasLowercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {hasLowercase ? '✓' : '○'}
                  </span>
                  Include lowercase letters (a-z)
                </li>
                <li className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasUppercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {hasUppercase ? '✓' : '○'}
                  </span>
                  Include uppercase letters (A-Z)
                </li>
                <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasNumber ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {hasNumber ? '✓' : '○'}
                  </span>
                  Include at least one number (0-9)
                </li>
                <li className={`flex items-center gap-2 ${hasValidCharacters ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    hasValidCharacters ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {hasValidCharacters ? '✓' : '✗'}
                  </span>
                  Only use allowed special characters: @$!%*?&
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Confirm your password"
            />
            {formData.confirmPassword && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formData.password === formData.confirmPassword 
                  ? '✓ Passwords match' 
                  : '✗ Passwords do not match'
                }
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !formData.password || !formData.confirmPassword || !hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasValidCharacters || formData.password !== formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('signup_email');
              navigate('/signup');
            }}
            className="text-gray-600 hover:text-gray-700 font-semibold"
          >
            ← Back to Signup
          </button>
        </div>
      </div>
    </div>
  );
}
