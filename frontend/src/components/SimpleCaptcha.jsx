import React, { useState, useRef, useEffect } from 'react';

const SimpleCaptcha = () => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const canvasRef = useRef(null);

  const generateCaptcha = () => {
    console.log('Generating CAPTCHA...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    // Generate simple text
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setCaptchaText(text);
    console.log('Generated text:', text);

    // Clear and draw
    canvas.width = 200;
    canvas.height = 60;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 200, 60);
    
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 100, 35);
    
    console.log('CAPTCHA drawn successfully');
  };

  const verifyCaptcha = () => {
    console.log('Verifying CAPTCHA:', userInput, 'vs', captchaText);
    if (userInput.toUpperCase() === captchaText.toUpperCase()) {
      setMessage('✅ Correct!');
    } else {
      setMessage('❌ Incorrect, try again');
      setTimeout(generateCaptcha, 1000);
    }
  };

  useEffect(() => {
    console.log('Component mounted, generating CAPTCHA...');
    setTimeout(generateCaptcha, 100);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
      <h2>Simple CAPTCHA Test</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <canvas 
          ref={canvasRef}
          width="200"
          height="60"
          style={{ 
            border: '2px solid #ccc', 
            borderRadius: '4px',
            display: 'block',
            margin: '10px 0'
          }}
        />
        
        <button 
          onClick={generateCaptcha}
          style={{
            padding: '5px 10px',
            marginLeft: '10px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter CAPTCHA"
          style={{
            padding: '8px',
            fontSize: '16px',
            width: '200px',
            marginRight: '10px'
          }}
        />
        <button 
          onClick={verifyCaptcha}
          style={{
            padding: '8px 16px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Verify
        </button>
      </div>

      {message && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '14px',
          color: message.includes('✅') ? 'green' : 'red'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <div>Debug Info:</div>
        <div>Current CAPTCHA: {captchaText}</div>
        <div>User Input: {userInput}</div>
        <div>Canvas Ref: {canvasRef.current ? 'Found' : 'Not Found'}</div>
      </div>
    </div>
  );
};

export default SimpleCaptcha;
