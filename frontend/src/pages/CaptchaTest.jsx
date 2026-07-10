import React, { useState } from 'react';
import Captcha from '../components/Captcha';

export default function CaptchaTest() {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleCaptchaVerify = (isVerified) => {
    setVerificationStatus(isVerified);
    console.log('CAPTCHA Verification:', isVerified);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!verificationStatus) {
      alert('Please verify the CAPTCHA before submitting!');
      return;
    }
    
    setFormSubmitted(true);
    alert('Form submitted successfully!');
  };

  const resetForm = () => {
    setVerificationStatus(null);
    setFormSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          CAPTCHA Test Page
        </h1>
        
        {!formSubmitted ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Sample form field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your name"
              />
            </div>
            
            {/* Sample email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your email"
              />
            </div>
            
            {/* CAPTCHA Component */}
            <div className="border-t pt-6">
              <Captcha 
                onVerify={handleCaptchaVerify}
                difficulty="medium"
                width={250}
                height={70}
              />
            </div>

            {/* Verification Status */}
            {verificationStatus !== null && (
              <div className={`p-3 rounded-lg text-center font-medium ${
                verificationStatus 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {verificationStatus 
                  ? '✅ CAPTCHA verified successfully!' 
                  : '❌ CAPTCHA verification failed.'}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!verificationStatus}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                verificationStatus
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Form
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-semibold text-green-600">Success!</h2>
            <p className="text-gray-600">Your form has been submitted successfully.</p>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Difficulty Examples */}
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center text-green-600">Easy Mode</h3>
          <Captcha 
            onVerify={(verified) => console.log('Easy CAPTCHA:', verified)}
            difficulty="easy"
            width={200}
            height={50}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center text-yellow-600">Medium Mode</h3>
          <Captcha 
            onVerify={(verified) => console.log('Medium CAPTCHA:', verified)}
            difficulty="medium"
            width={200}
            height={60}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center text-red-600">Hard Mode</h3>
          <Captcha 
            onVerify={(verified) => console.log('Hard CAPTCHA:', verified)}
            difficulty="hard"
            width={200}
            height={70}
          />
        </div>
      </div>
    </div>
  );
}
