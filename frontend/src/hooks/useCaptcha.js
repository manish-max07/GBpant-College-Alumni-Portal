import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Custom hook for CAPTCHA functionality
 * @param {Object} options - Configuration options
 * @returns {Object} CAPTCHA state and methods
 */
export const useCaptcha = (options = {}) => {
  const {
    autoVerify = true,
    showToasts = true,
    onVerified,
    onError
  } = options;

  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const componentRef = useRef(null);

  // Generate new CAPTCHA
  const generateCaptcha = useCallback(async () => {
    setLoading(true);
    setError('');
    setVerified(false);
    setCaptchaInput('');
    setAttempts(0);
    
    try {
      const response = await axios.post('/api/captcha/generate');
      
      if (response.data.success) {
        setCaptchaImage(response.data.imageData);
        setSessionId(response.data.sessionId);
        
        if (showToasts) {
          toast.success('New CAPTCHA generated');
        }
      } else {
        throw new Error(response.data.message || 'Failed to generate CAPTCHA');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load CAPTCHA';
      setError(message);
      
      if (showToasts) {
        toast.error(message);
      }
      
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [showToasts, onError]);

  // Verify CAPTCHA
  const verifyCaptcha = useCallback(async (inputValue = captchaInput) => {
    if (!inputValue.trim()) {
      const message = 'Please enter the CAPTCHA';
      setError(message);
      return false;
    }

    if (!sessionId) {
      const message = 'CAPTCHA session expired. Please refresh.';
      setError(message);
      await generateCaptcha();
      return false;
    }

    setVerifying(true);
    setError('');
    setAttempts(prev => prev + 1);

    try {
      const response = await axios.post('/api/captcha/verify', {
        sessionId,
        captcha: inputValue.trim()
      });

      if (response.data.success) {
        setVerified(true);
        setError('');
        
        if (showToasts) {
          toast.success('CAPTCHA verified successfully!');
        }
        
        onVerified?.(true);
        return true;
      } else {
        const message = response.data.message || 'Incorrect CAPTCHA';
        setError(message);
        
        if (response.data.shouldRegenerate) {
          setTimeout(() => generateCaptcha(), 1000);
        }
        
        if (showToasts && attempts >= 2) {
          toast.error('Multiple incorrect attempts. Please try the new CAPTCHA.');
        }
        
        onVerified?.(false);
        return false;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'CAPTCHA verification failed';
      setError(message);
      
      if (showToasts) {
        toast.error(message);
      }
      
      onError?.(error);
      return false;
    } finally {
      setVerifying(false);
    }
  }, [captchaInput, sessionId, attempts, showToasts, onVerified, onError, generateCaptcha]);

  // Update input value
  const setCaptchaValue = useCallback((value) => {
    setCaptchaInput(value);
    setError('');
    setVerified(false);
    
    // Auto-verify if enabled and value has reasonable length
    if (autoVerify && value.trim().length >= 4) {
      const timeoutId = setTimeout(() => {
        verifyCaptcha(value);
      }, 500); // Debounce auto-verification
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoVerify, verifyCaptcha]);

  // Reset CAPTCHA state
  const resetCaptcha = useCallback(() => {
    setCaptchaInput('');
    setVerified(false);
    setError('');
    setAttempts(0);
    generateCaptcha();
  }, [generateCaptcha]);

  // Check if CAPTCHA is ready for form submission
  const isReady = verified && !loading && !verifying;

  // Get validation message for forms
  const getValidationMessage = useCallback(() => {
    if (!captchaInput.trim()) {
      return 'CAPTCHA is required';
    }
    if (error) {
      return error;
    }
    if (!verified) {
      return 'Please verify the CAPTCHA';
    }
    return '';
  }, [captchaInput, error, verified]);

  return {
    // State
    captchaImage,
    captchaInput,
    sessionId,
    loading,
    verifying,
    verified,
    error,
    attempts,
    isReady,
    
    // Methods
    generateCaptcha,
    verifyCaptcha,
    setCaptchaValue,
    resetCaptcha,
    getValidationMessage,
    
    // Ref for component
    componentRef
  };
};

/**
 * Higher-order component for forms with CAPTCHA
 * @param {React.Component} WrappedComponent - Component to wrap
 * @returns {React.Component} Enhanced component with CAPTCHA
 */
export const withCaptcha = (WrappedComponent) => {
  return function CaptchaEnhancedComponent(props) {
    const captcha = useCaptcha(props.captchaOptions);
    
    return (
      <WrappedComponent
        {...props}
        captcha={captcha}
      />
    );
  };
};

export default useCaptcha;
