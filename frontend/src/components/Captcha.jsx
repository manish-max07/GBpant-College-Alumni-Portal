import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const Captcha = forwardRef(({ 
  onVerify, 
  className = "", 
  width = 200, 
  height = 60,
  difficulty = 'medium' // easy, medium, hard
}, ref) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const canvasRef = useRef(null);
  const timeoutRef = useRef(null);

  // Generate random alphanumeric string
  const generateRandomString = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const length = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 6 : 5;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };

  // Draw CAPTCHA text on canvas with distortion
  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(0.5, '#e9ecef');
    gradient.addColorStop(1, '#dee2e6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise dots
    const noiseIntensity = difficulty === 'easy' ? 30 : difficulty === 'hard' ? 80 : 50;
    for (let i = 0; i < noiseIntensity; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.3 + 0.1;
      
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Add noise lines
    const lineCount = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 6 : 4;
    for (let i = 0; i < lineCount; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const opacity = Math.random() * 0.3 + 0.1;
      
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${opacity})`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw text characters with distortion
    const charWidth = width / text.length;
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'];
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const x = i * charWidth + charWidth / 2 + (Math.random() - 0.5) * 8;
      const y = height / 2 + (Math.random() - 0.5) * 8;
      
      // Random font properties
      const fontSize = difficulty === 'easy' ? 24 : difficulty === 'hard' ? 18 : 20;
      const fontVariation = Math.random() * 6 - 3; // ±3px variation
      const font = fonts[Math.floor(Math.random() * fonts.length)];
      const rotation = (Math.random() - 0.5) * (difficulty === 'easy' ? 0.2 : difficulty === 'hard' ? 0.6 : 0.4);
      const color = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)})`;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.font = `${fontSize + fontVariation}px ${font}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add overlay distortion lines
    if (difficulty === 'hard') {
      for (let i = 0; i < 8; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  };

  // Generate new CAPTCHA
  const generateCaptcha = () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setMessage('');
    setError('');
    setUserCaptchaInput('');
    setIsVerified(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Generate new text
    const newText = generateRandomString();
    setCaptchaText(newText);

    // Use setTimeout to prevent rapid clicking issues
    timeoutRef.current = setTimeout(() => {
      drawCaptcha(newText);
      setIsGenerating(false);
    }, 50);
  };

  // Verify CAPTCHA input
  const verifyCaptcha = () => {
    if (!userCaptchaInput.trim()) {
      setError('Please enter the CAPTCHA text');
      return;
    }

    const isMatch = userCaptchaInput.toLowerCase().trim() === captchaText.toLowerCase().trim();
    
    if (isMatch) {
      setIsVerified(true);
      setMessage('CAPTCHA verified successfully!');
      setError('');
      onVerify?.(true);
    } else {
      setIsVerified(false);
      setError('CAPTCHA does not match. Please try again.');
      setMessage('');
      onVerify?.(false);
      
      // Auto-generate new CAPTCHA after failed verification
      setTimeout(() => {
        generateCaptcha();
      }, 1000);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyCaptcha();
    }
  };

  // Generate initial CAPTCHA
  useEffect(() => {
    // Generate CAPTCHA on component mount
    const initializeCaptcha = () => {
      const newText = generateRandomString();
      setCaptchaText(newText);
      
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        drawCaptcha(newText);
      }, 100);
    };

    initializeCaptcha();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      generateCaptcha();
      onVerify && onVerify(false); // Notify parent that verification is reset
    },
    refresh: () => {
      generateCaptcha();
    }
  }));

  return (
    <div className={`captcha-container ${className}`}>
      <div className="space-y-4">
        {/* CAPTCHA Canvas */}
        <div className="captcha-display">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Verification <span className="text-red-500">*</span>
          </label>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="relative border-2 border-gray-300 rounded-lg p-1 sm:p-2 bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="block w-full h-auto max-w-full"
                style={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  aspectRatio: `${width}/${height}`
                }}
              />
              
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={generateCaptcha}
              disabled={isGenerating}
              className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh CAPTCHA"
            >
              <svg 
                className={`w-5 h-5 text-gray-600 ${isGenerating ? 'animate-spin' : ''}`} 
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

          <p className="text-xs text-gray-500 mb-2">
            Enter the text shown in the image above
          </p>
        </div>

        {/* Input Field */}
        <div className="captcha-input">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={userCaptchaInput}
              onChange={(e) => setUserCaptchaInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter CAPTCHA text"
              className={`flex-1 px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                isVerified 
                  ? 'border-green-500 bg-green-50 focus:ring-green-200' 
                  : error 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={isVerified}
              autoComplete="off"
              spellCheck="false"
            />
            
            <button
              type="button"
              onClick={verifyCaptcha}
              disabled={!userCaptchaInput.trim() || isVerified || isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center text-sm text-red-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Difficulty Indicator */}
        {difficulty !== 'medium' && (
          <div className="text-xs text-gray-500">
            Difficulty: {difficulty === 'easy' ? '🟢 Easy' : '🔴 Hard'}
          </div>
        )}
      </div>
    </div>
  );
});

// Add display name for debugging
Captcha.displayName = 'Captcha';

export default Captcha;
