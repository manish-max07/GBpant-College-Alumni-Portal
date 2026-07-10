/**
 * Enhanced Error Handler for Frontend
 * Provides user-friendly messages for security-related errors
 */

export class SecurityErrorHandler {
  static handleApiError(error, context = '') {
    const response = error.response;
    
    if (!response) {
      return {
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        showRetry: true,
        retryDelay: 5000
      };
    }

    const status = response.status;
    const data = response.data || {};

    switch (status) {
      case 429:
        return this.handleRateLimit(data, context);
      
      case 400:
        return this.handleValidationError(data, context);
      
      case 403:
        return this.handleForbidden(data, context);
      
      case 500:
        return this.handleServerError(data, context);
      
      default:
        return {
          type: 'unknown',
          title: 'Something went wrong',
          message: data.message || 'An unexpected error occurred. Please try again.',
          showRetry: true,
          retryDelay: 3000
        };
    }
  }

  static handleRateLimit(data, context) {
    const message = data.message || 'Too many requests';
    const retryAfter = data.retryAfter || '15 minutes';
    
    let userFriendlyMessage = '';
    let title = 'Please wait';
    let retryDelay = 15 * 60 * 1000; // 15 minutes default

    // Parse retry time
    if (retryAfter.includes('minute')) {
      const minutes = parseInt(retryAfter);
      retryDelay = minutes * 60 * 1000;
    } else if (retryAfter.includes('hour')) {
      const hours = parseInt(retryAfter);
      retryDelay = hours * 60 * 60 * 1000;
    } else if (retryAfter.includes('second')) {
      const seconds = parseInt(retryAfter);
      retryDelay = seconds * 1000;
    }

    if (message.toLowerCase().includes('automated')) {
      title = 'Security Check';
      userFriendlyMessage = 'Our security system has detected unusual activity. Please try again later using a regular web browser.';
    } else if (message.toLowerCase().includes('suspicious')) {
      title = 'Security Alert';
      userFriendlyMessage = 'For security reasons, we need to temporarily limit requests. Please try again later.';
    } else if (context === 'email' || context === 'otp') {
      title = 'Email Limit Reached';
      userFriendlyMessage = `To prevent spam, we limit how often verification emails can be sent. Please wait ${retryAfter} before requesting another email.`;
    } else if (context === 'password-reset') {
      title = 'Password Reset Limit';
      userFriendlyMessage = `For security, password reset attempts are limited. Please wait ${retryAfter} before trying again.`;
    } else {
      title = 'Rate Limit Reached';
      userFriendlyMessage = `You're making requests too quickly. Please wait ${retryAfter} and try again.`;
    }

    return {
      type: 'rate_limit',
      title,
      message: userFriendlyMessage,
      showRetry: true,
      retryDelay,
      retryAfter,
      canRetryNow: false
    };
  }

  static handleValidationError(data, context) {
    const message = data.message || 'Invalid input';
    
    if (message.toLowerCase().includes('captcha')) {
      return {
        type: 'captcha',
        title: 'CAPTCHA Required',
        message: 'Please complete the CAPTCHA verification to continue.',
        showRetry: false,
        requiresCaptcha: true
      };
    }

    if (message.toLowerCase().includes('email format') || message.toLowerCase().includes('invalid email')) {
      return {
        type: 'validation',
        title: 'Invalid Email',
        message: 'Please enter a valid email address (e.g., example@domain.com).',
        showRetry: false,
        field: 'email'
      };
    }

    if (message.toLowerCase().includes('valid email address') || message.toLowerCase().includes('temp')) {
      return {
        type: 'validation',
        title: 'Email Not Allowed',
        message: 'Please use a permanent email address from a standard email provider.',
        showRetry: false,
        field: 'email'
      };
    }

    return {
      type: 'validation',
      title: 'Invalid Input',
      message,
      showRetry: false
    };
  }

  static handleForbidden(data, context) {
    return {
      type: 'forbidden',
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action. Please try logging in again.',
      showRetry: false,
      requiresLogin: true
    };
  }

  static handleServerError(data, context) {
    return {
      type: 'server_error',
      title: 'Server Error',
      message: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
      showRetry: true,
      retryDelay: 60000 // 1 minute
    };
  }

  /**
   * Get user-friendly retry message with countdown
   */
  static getRetryMessage(retryDelay) {
    const minutes = Math.ceil(retryDelay / (60 * 1000));
    
    if (minutes < 1) {
      return 'You can try again in less than a minute.';
    } else if (minutes === 1) {
      return 'You can try again in about 1 minute.';
    } else if (minutes < 60) {
      return `You can try again in about ${minutes} minutes.`;
    } else {
      const hours = Math.ceil(minutes / 60);
      return `You can try again in about ${hours} hour${hours > 1 ? 's' : ''}.`;
    }
  }

  /**
   * Check if enough time has passed to retry
   */
  static canRetryNow(lastAttempt, retryDelay) {
    if (!lastAttempt) return true;
    return Date.now() - lastAttempt >= retryDelay;
  }

  /**
   * Get helpful tips based on error type
   */
  static getSecurityTips(errorType) {
    const tips = {
      rate_limit: [
        'Wait for the specified time before trying again',
        'Make sure you\'re using a regular web browser',
        'Avoid refreshing the page repeatedly',
        'Check if you have any browser extensions that might be interfering'
      ],
      automated: [
        'Make sure you\'re using a regular web browser (Chrome, Firefox, Safari)',
        'Disable any automation tools or browser extensions',
        'Clear your browser cache and cookies',
        'Try from a different device or network if the issue persists'
      ],
      captcha: [
        'Complete the CAPTCHA verification carefully',
        'Make sure images are fully loaded before selecting',
        'Try refreshing the CAPTCHA if it\'s unclear',
        'Ensure JavaScript is enabled in your browser'
      ],
      validation: [
        'Double-check your email address for typos',
        'Use a standard email provider (Gmail, Outlook, etc.)',
        'Avoid temporary or disposable email services',
        'Make sure all required fields are filled out correctly'
      ]
    };

    return tips[errorType] || tips.rate_limit;
  }
}

/**
 * React Hook for handling security errors
 */
export function useSecurityErrorHandler() {
  const [error, setError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  // Countdown timer for retry
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setInterval(() => {
        setRetryCountdown(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryCountdown]);

  const handleError = (apiError, context = '') => {
    const errorInfo = SecurityErrorHandler.handleApiError(apiError, context);
    setError(errorInfo);
    setLastAttemptTime(Date.now());
    
    if (errorInfo.retryDelay) {
      setRetryCountdown(errorInfo.retryDelay);
    }
    
    return errorInfo;
  };

  const clearError = () => {
    setError(null);
    setRetryCountdown(0);
  };

  const canRetry = () => {
    if (!error || !error.retryDelay) return true;
    return retryCountdown === 0;
  };

  const getTimeUntilRetry = () => {
    return Math.ceil(retryCountdown / 1000);
  };

  return {
    error,
    handleError,
    clearError,
    canRetry: canRetry(),
    timeUntilRetry: getTimeUntilRetry(),
    retryMessage: error && error.retryDelay ? 
      SecurityErrorHandler.getRetryMessage(retryCountdown) : null,
    securityTips: error ? SecurityErrorHandler.getSecurityTips(error.type) : []
  };
}

/**
 * Enhanced Error Display Component
 */
export function SecurityErrorAlert({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const getAlertColor = (type) => {
    switch (type) {
      case 'rate_limit': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'forbidden': return 'bg-red-50 border-red-200 text-red-800';
      case 'validation': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'server_error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'rate_limit': return '⏰';
      case 'forbidden': return '🚫';
      case 'validation': return '⚠️';
      case 'server_error': return '❌';
      case 'captcha': return '🔒';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getAlertColor(error.type)}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3" role="img" aria-label="alert">
          {getIcon(error.type)}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{error.title}</h3>
          <p className="mb-3">{error.message}</p>
          
          {error.retryAfter && (
            <p className="text-sm mb-3">
              <strong>Wait time:</strong> {error.retryAfter}
            </p>
          )}
          
          {error.showRetry && onRetry && (
            <div className="flex items-center gap-3">
              <button
                onClick={onRetry}
                disabled={error.canRetryNow === false}
                className={`px-4 py-2 rounded font-medium ${
                  error.canRetryNow === false
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {error.canRetryNow === false ? 'Please Wait' : 'Try Again'}
              </button>
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 rounded text-gray-600 hover:text-gray-800"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecurityErrorHandler;
