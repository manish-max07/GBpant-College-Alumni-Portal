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
                Profile Submitted & Under Verification
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Registration Complete — Awaiting Admin Approval
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                You have successfully registered and submitted your profile details. Your profile will now be reviewed and verified by the administration.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                You will receive an <strong>email notification</strong> once approved, after which you will be <strong>officially onboarded</strong> and can access all portal features (including Alumni & Student directories).
              </p>
            </div>

            {/* Warning banner */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
                <p className="text-red-800 text-xs leading-relaxed font-medium">
                  <strong>Notice:</strong> Please ensure all submitted academic and personal information is accurate. In case any provided details are incorrect or unverified, your account will be deleted.
                </p>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-500 text-lg flex-shrink-0">📧</span>
                <div>
                  <p className="text-blue-800 font-semibold text-xs">Email Confirmation</p>
                  <p className="text-blue-600 text-xs mt-0.5">
                    An email will be sent to your registered address as soon as your account is approved.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-500 text-lg flex-shrink-0">🎓</span>
                <div>
                  <p className="text-green-800 font-semibold text-xs">Full Access Upon Approval</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    Connect with alumni, view student profiles, and participate in portal networking.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 text-base"
            >
              <span>✅</span>
              OK — Sign Out
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              Have questions? Contact{' '}
              {import.meta.env.VITE_ADMIN_EMAIL ? (
                <a href={`mailto:${import.meta.env.VITE_ADMIN_EMAIL}`} className="text-indigo-500 hover:underline">
                  the admin
                </a>
              ) : (
                <a href="/contact" className="text-indigo-500 hover:underline">
                  support
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
