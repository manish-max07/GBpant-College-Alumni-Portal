import React from 'react';
import { 
  FaExclamationTriangle, 
  FaTimes, 
  FaShieldAlt, 
  FaEnvelope, 
  FaGlobe,
  FaNetworkWired
} from 'react-icons/fa';

const BlockedAccessModal = ({ isOpen, onClose, blockType, blockReason, blockedValue, contactInfo }) => {
  if (!isOpen) return null;

  // Determine modal content based on block type
  const getModalContent = () => {
    switch (blockType) {
      case 'IP_BLOCKED_DATABASE':
        return {
          icon: <FaNetworkWired className="text-red-500 text-4xl animate-pulse" />,
          title: '🚫 IP Address Blocked',
          mainMessage: `Your IP address has been blocked by the system.`,
          explanation: 'Your current IP address is not allowed to access this portal due to security restrictions.',
          details: `Blocked IP: ${blockedValue}`,
          warningColor: 'red'
        };
      
      case 'EMAIL_BLOCKED_DATABASE':
        return {
          icon: <FaEnvelope className="text-orange-500 text-4xl animate-pulse" />,
          title: '📧 Email Address Blocked',
          mainMessage: `This email address is not allowed to register.`,
          explanation: 'The email address you are trying to use has been blocked by the system.',
          details: `Blocked Email: ${blockedValue}`,
          warningColor: 'orange'
        };
      
      case 'DOMAIN_BLOCKED_DATABASE':
        return {
          icon: <FaGlobe className="text-purple-500 text-4xl animate-pulse" />,
          title: '🌐 Email Domain Blocked',
          mainMessage: `This email domain is not allowed for registration.`,
          explanation: 'The email domain you are trying to use has been blocked by the system.',
          details: `Blocked Domain: ${blockedValue}`,
          warningColor: 'purple'
        };
      
      case 'TEMP_EMAIL_BLOCKED':
        return {
          icon: <FaExclamationTriangle className="text-yellow-500 text-4xl animate-pulse" />,
          title: '⚠️ Temporary Email Detected',
          mainMessage: `Temporary email services are not allowed.`,
          explanation: 'Please use a permanent email address from a recognized email provider (Gmail, Yahoo, Outlook, etc.).',
          details: `Detected Domain: ${blockedValue || 'Temporary email service'}`,
          warningColor: 'yellow'
        };
      
      default:
        return {
          icon: <FaShieldAlt className="text-red-500 text-4xl animate-pulse" />,
          title: '🛡️ Access Blocked',
          mainMessage: `Your access has been restricted.`,
          explanation: 'Your request has been blocked due to security policies.',
          details: blockReason || 'Security restriction applied',
          warningColor: 'red'
        };
    }
  };

  const content = getModalContent();
  const isTemporaryEmail = blockType === 'TEMP_EMAIL_BLOCKED';

  // Define color schemes for different block types
  const getColorClasses = () => {
    switch (content.warningColor) {
      case 'red':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          border: 'border-red-500',
          bgSecondary: 'bg-red-50',
          borderSecondary: 'border-red-200',
          textSecondary: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-400'
        };
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          border: 'border-orange-500',
          bgSecondary: 'bg-orange-50',
          borderSecondary: 'border-orange-200',
          textSecondary: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
          icon: 'text-orange-400'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'border-purple-500',
          bgSecondary: 'bg-purple-50',
          borderSecondary: 'border-purple-200',
          textSecondary: 'text-purple-800',
          button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
          icon: 'text-purple-400'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-600',
          border: 'border-yellow-500',
          bgSecondary: 'bg-yellow-50',
          borderSecondary: 'border-yellow-200',
          textSecondary: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-400'
        };
      default:
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          border: 'border-red-500',
          bgSecondary: 'bg-red-50',
          borderSecondary: 'border-red-200',
          textSecondary: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-400'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative animate-bounce-in shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FaTimes size={20} />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 ${colors.bg} rounded-full flex items-center justify-center`}>
            {content.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold ${colors.text} text-center mb-4`}>
          {content.title}
        </h2>

        {/* Main Message */}
        <div className="text-center mb-6">
          <p className="text-gray-700 mb-4 text-lg font-semibold">
            {content.mainMessage}
          </p>
          <p className="text-gray-600 mb-4">
            {content.explanation}
          </p>
          
          {/* Details */}
          {blockedValue && (
            <div className={`${colors.bgSecondary} ${colors.borderSecondary} border rounded-lg p-3 mb-4`}>
              <p className={`text-sm ${colors.textSecondary} font-mono break-all`}>
                {content.details}
              </p>
            </div>
          )}

          {/* Block Reason */}
          {blockReason && blockReason !== 'Temporary email service' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Reason:</strong> {blockReason}
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className={`${colors.bgSecondary} border-l-4 ${colors.border} p-4 mb-6`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FaShieldAlt className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${colors.textSecondary}`}>
                <strong>Security Notice:</strong>{' '}
                {isTemporaryEmail 
                  ? 'This portal requires permanent email addresses to maintain security and ensure proper communication.'
                  : 'This restriction has been put in place to maintain the security and integrity of our platform.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {contactInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaEnvelope className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Need Help?</strong> {contactInfo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isTemporaryEmail && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold 
                       hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again with Valid Email
            </button>
          )}
          
          <button
            onClick={onClose}
            className={`w-full ${colors.button} text-white py-3 px-6 rounded-xl font-semibold 
                     transition-colors focus:outline-none focus:ring-2 
                     focus:ring-offset-2`}
          >
            {isTemporaryEmail ? 'I Understand' : 'Close'}
          </button>
        </div>

        {/* Additional Help Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            {isTemporaryEmail 
              ? 'Use Gmail, Yahoo, Outlook, or other permanent email providers'
              : 'If you believe this is an error, please contact the site administrator'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockedAccessModal;
