import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PendingApproval = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top gradient banner */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-40">
                <span className="text-4xl">⏳</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Account Under Review</h1>
            <p className="text-amber-100 text-sm">GB Pant College Alumni Portal</p>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Status badge */}
            <div className="flex items-center justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-4 py-2 text-sm font-semibold">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Pending Admin Approval
              </span>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-700 text-base leading-relaxed mb-3">
                Thank you for completing your profile! Your account is currently
                being reviewed by our admin team.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                You will receive an <strong>email notification</strong> at your registered
                email address once your account has been approved. This usually takes
                less than 24 hours.
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-500 text-xl flex-shrink-0">📧</span>
                <div>
                  <p className="text-blue-800 font-semibold text-sm">Email Notification</p>
                  <p className="text-blue-600 text-xs mt-0.5">
                    We'll send you an email as soon as your account is approved.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-500 text-xl flex-shrink-0">🛡️</span>
                <div>
                  <p className="text-green-800 font-semibold text-sm">Secure Verification</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    This process ensures all portal members are genuine GB Pant alumni or students.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-purple-500 text-xl flex-shrink-0">⏱️</span>
                <div>
                  <p className="text-purple-800 font-semibold text-sm">Review Time</p>
                  <p className="text-purple-600 text-xs mt-0.5">
                    Accounts are typically approved within 24 hours on business days.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 px-6 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>🚪</span>
              Sign Out
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              Have questions? Contact{' '}
              <a href="mailto:manishkumar995852@gmail.com" className="text-indigo-500 hover:underline">
                the admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
