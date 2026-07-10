import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import BlockedAccessModal from '../components/BlockedAccessModal';
import SuspiciousEmailModal from '../components/SuspiciousEmailModal';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaKey,
  FaCog,
  FaShieldAlt,
  FaUserCog,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaExclamationTriangle,
  FaCheck
} from 'react-icons/fa';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Modal state for blocked access
  const [showBlockedAccessModal, setShowBlockedAccessModal] = useState(false);
  const [showSuspiciousEmailModal, setShowSuspiciousEmailModal] = useState(false);
  const [blockingInfo, setBlockingInfo] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setResetEmail(response.data.user.email);
      } else {
        toast.error('Failed to load user data');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Let ProtectedRoute handle redirect
      } else {
        toast.error('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Email is required');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: resetEmail
      });

      if (response.data.success) {
        toast.success('Password reset link sent to your email!');
        setShowResetPassword(false);
        // Optionally navigate to verify OTP page
        navigate('/verify-otp', { 
          state: { 
            email: resetEmail, 
            type: 'password_reset',
            message: 'Check your email for the reset code'
          } 
        });
      } else {
        toast.error(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Check if it's a blocking error
      const errorData = error.response?.data;
      const blockingTypes = ['IP_BLOCKED_DATABASE', 'EMAIL_BLOCKED_DATABASE', 'TEMP_EMAIL_BLOCKED'];
      
      if (errorData?.blockingType === 'DOMAIN_BLOCKED_DATABASE') {
        // Show SuspiciousEmailModal for domain blocked in database
        setShowSuspiciousEmailModal(true);
      } else if (errorData?.blockingType && blockingTypes.includes(errorData.blockingType)) {
        setBlockingInfo({
          type: errorData.blockingType,
          value: errorData.blockedValue || resetEmail,
          reason: errorData.reason,
          expiresAt: errorData.expiresAt,
          adminEmail: errorData.adminEmail || 'admin@gbpant.ac.in'
        });
        setShowBlockedAccessModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send password reset email');
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <FaCog className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                Account Settings
              </h1>
              <p className="text-blue-100 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2">
                Manage your account preferences, security settings, and profile information.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-8">
            <div className="flex items-center space-x-4 sm:space-x-6 mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                {user?.full_name?.charAt(0)?.toUpperCase() || <FaUser />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  {user?.full_name || 'User'}
                </h2>
                <p className="text-slate-600 mb-2">{user?.email}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <FaShieldAlt className="w-3 h-3 mr-1.5" />
                  {user?.user_type?.charAt(0)?.toUpperCase() + user?.user_type?.slice(1) || 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Options */}
          <div className="space-y-6 sm:space-y-8">
            {/* Security Settings */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FaLock className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Security Settings</h3>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                {/* Reset Password */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mt-1 flex-shrink-0">
                      <FaKey className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        Reset Password
                      </h4>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Change your account password for better security. A reset link will be sent to your email.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResetPassword(true)}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    <FaKey className="w-4 h-4 mr-2" />
                    Reset Password
                  </button>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-red-50 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                    <FaUserCog className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Account Management</h3>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                {/* Logout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-red-50 rounded-xl sm:rounded-2xl hover:bg-red-100 transition-colors">
                  <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mt-1 flex-shrink-0">
                      <FaSignOutAlt className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                        Sign Out
                      </h4>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Securely log out from your account. You'll need to sign in again to access your dashboard.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Modal */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaKey className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Reset Password</h3>
                <p className="text-slate-600 text-sm sm:text-base">
                  We'll send a reset code to your email address.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all bg-white text-slate-900"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPasswordLoading}
                    className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {resetPasswordLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <FaKey className="w-4 h-4 mr-2" />
                    )}
                    {resetPasswordLoading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Confirm Sign Out</h3>
                <p className="text-slate-600 text-sm sm:text-base">
                  Are you sure you want to sign out? You'll need to log in again to access your account.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold flex items-center justify-center"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
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
