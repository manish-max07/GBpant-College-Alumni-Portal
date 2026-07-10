import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CaptchaComponent = ({ 
  onVerified, 
  onError, 
  className = "", 
  required = true,
  disabled = false 
}) => {
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  // Generate new CAPTCHA
  const generateCaptcha = useCallback(async () => {
    setLoading(true);
    setError('');
    setVerified(false);
    setCaptchaInput('');
    
    try {
      const response = await axios.post('/api/captcha/generate');
      
      if (response.data.success) {
        setCaptchaImage(response.data.imageData);
        setSessionId(response.data.sessionId);
      } else {
        throw new Error(response.data.message || 'Failed to generate CAPTCHA');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load CAPTCHA';
      setError(message);
      toast.error(message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Verify CAPTCHA
  const verifyCaptcha = useCallback(async (inputValue = captchaInput) => {
    if (!inputValue.trim()) {
      setError('Please enter the CAPTCHA');
      return false;
    }

    if (!sessionId) {
      setError('CAPTCHA session expired. Please refresh.');
      await generateCaptcha();
      return false;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await axios.post('/api/captcha/verify', {
        sessionId,
        captcha: inputValue.trim()
      });

      if (response.data.success) {
        setVerified(true);
        setError('');
        toast.success('CAPTCHA verified successfully!');
        onVerified?.(true);
        return true;
      } else {
        setError(response.data.message || 'Incorrect CAPTCHA');
        
        if (response.data.shouldRegenerate) {
          setTimeout(() => generateCaptcha(), 1000);
        }
        
        onVerified?.(false);
        return false;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'CAPTCHA verification failed';
      setError(message);
      toast.error(message);
      onError?.(error);
      return false;
    } finally {
      setVerifying(false);
    }
  }, [captchaInput, sessionId, onVerified, onError, generateCaptcha]);

  // Auto-generate CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Handle input change
  const handleInputChange = (e) => {
    setCaptchaInput(e.target.value);
    setError('');
    setVerified(false);
  };

  // Handle input blur (auto-verify)
  const handleInputBlur = () => {
    if (captchaInput.trim() && !verified && !verifying) {
      verifyCaptcha();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyCaptcha();
    }
  };

  // Public method to verify CAPTCHA (can be called by parent)
  const verify = () => verifyCaptcha();

  // Expose verify method to parent
  React.useImperativeHandle(React.forwardRef((props, ref) => ref), () => ({
    verify,
    isVerified: verified,
    reset: generateCaptcha
  }));

  return (
    <div className={`captcha-component ${className}`}>
      <div className="space-y-3">
        {/* CAPTCHA Image */}
        <div className="captcha-image-container">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Verification {required && <span className="text-red-500">*</span>}
          </label>
          
          <div className="flex items-center space-x-3">
            <div className="relative bg-gray-100 border border-gray-300 rounded-lg p-2 min-h-[60px] flex items-center justify-center">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading...</span>
                </div>
              ) : captchaImage ? (
                <img 
                  src={captchaImage} 
                  alt="CAPTCHA" 
                  className="max-w-full h-auto"
                  style={{ maxHeight: '60px' }}
                />
              ) : (
                <span className="text-sm text-gray-500">Failed to load CAPTCHA</span>
              )}
            </div>
            
            <button
              type="button"
              onClick={generateCaptcha}
              disabled={loading || disabled}
              className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh CAPTCHA"
            >
              <svg 
                className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* CAPTCHA Input */}
        <div className="captcha-input-container">
          <div className="relative">
            <input
              type="text"
              value={captchaInput}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyPress={handleKeyPress}
              disabled={loading || disabled || verified}
              placeholder="Enter the text shown above"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                verified 
                  ? 'border-green-500 bg-green-50 focus:ring-green-200' 
                  : error 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              maxLength={10}
              autoComplete="off"
              spellCheck="false"
            />
            
            {verifying && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {verified && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}

          {/* Success Message */}
          {verified && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              CAPTCHA verified successfully
            </p>
          )}
        </div>

        {/* Manual Verify Button (optional) */}
        {captchaInput && !verified && !verifying && (
          <button
            type="button"
            onClick={() => verifyCaptcha()}
            disabled={loading || disabled}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Verify CAPTCHA
          </button>
        )}
      </div>
    </div>
  );
};

export default CaptchaComponent;
