// Test Profile Picture Component
import React from 'react';
import ProfilePicture from '../components/ProfilePicture';

const TestProfilePicture = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Profile Picture Component Test</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Small */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Small</h3>
            <ProfilePicture size="small" />
          </div>
          
          {/* Medium */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Medium</h3>
            <ProfilePicture size="medium" />
          </div>
          
          {/* Large */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Large</h3>
            <ProfilePicture size="large" />
          </div>
          
          {/* XLarge */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">XLarge</h3>
            <ProfilePicture size="xlarge" />
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>You should see a small blue edit button in the bottom-right of each profile circle</li>
            <li>Click the edit button to upload a profile picture (max 200KB)</li>
            <li>Supported formats: JPEG, PNG, WebP</li>
            <li>After uploading, you should see the image instead of initials</li>
            <li>A red remove button should appear when an image is uploaded</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestProfilePicture;
