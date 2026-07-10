import React from 'react';
import SimpleCaptcha from '../components/SimpleCaptcha';
import Captcha from '../components/Captcha';

export default function DebugCaptcha() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1>CAPTCHA Debug Page</h1>
        <p>Testing both simple and advanced CAPTCHA components</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>1. Simple CAPTCHA (Debug Version)</h2>
        <SimpleCaptcha />
      </div>

      <div>
        <h2>2. Advanced CAPTCHA Component</h2>
        <div style={{ maxWidth: '400px', margin: '20px auto' }}>
          <Captcha
            onVerify={(verified) => {
              console.log('Advanced CAPTCHA verified:', verified);
              alert(`Advanced CAPTCHA: ${verified ? 'SUCCESS' : 'FAILED'}`);
            }}
            difficulty="easy"
            width={250}
            height={60}
          />
        </div>
      </div>
    </div>
  );
}
