import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const SuspiciousEmailModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative animate-bounce-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={20} />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="text-red-500 text-4xl animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-600 text-center mb-4">
          🚨 Suspicious Email Detected
        </h2>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-700 mb-4 text-lg">
            You are <strong>NOT ALLOWED</strong> to sign up with this email address.
          </p>
          <p className="text-red-600 font-semibold mb-2">
            ⚠️ Your IP address will be blocked for suspicious activity
          </p>
          <p className="text-sm text-gray-600">
            Please use a valid, permanent email address from a recognized email provider 
            (Gmail, Yahoo, Outlook, etc.) to create your account.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Security Notice:</strong> Temporary email services are not allowed. 
                This helps us maintain the security and integrity of our platform.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold 
                   hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 
                   focus:ring-red-500 focus:ring-offset-2"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default SuspiciousEmailModal;
