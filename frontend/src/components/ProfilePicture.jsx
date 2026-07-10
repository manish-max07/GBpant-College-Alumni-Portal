import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuth from '../hooks/useAuth';

const ProfilePicture = ({ size = 'large', showEditButton = true, className = '' }) => {
  const { user, checkAuthStatus } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { container: 'w-12 h-12', text: 'text-lg', button: 'w-4 h-4' },
    medium: { container: 'w-16 h-16', text: 'text-xl', button: 'w-5 h-5' },
    large: { container: 'w-24 h-24', text: 'text-2xl', button: 'w-6 h-6' },
    xlarge: { container: 'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28', text: 'text-3xl sm:text-4xl lg:text-5xl', button: 'w-7 h-7' }
  };

  const config = sizeConfig[size] || sizeConfig.large;

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadingProgress(0);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await api.post('/api/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadingProgress(100);

      if (response.data.success) {
        toast.success('Profile picture updated successfully!');
        // Refresh user data to show new profile picture
        await checkAuthStatus();
        setShowModal(false); // Close modal after successful upload
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      setUploadingProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    document.getElementById('profile-picture-input').click();
  };

  // Handle remove profile picture
  const handleRemovePicture = async () => {
    try {
      const response = await api.delete('/api/profile/remove-picture');
      if (response.data.success) {
        toast.success('Profile picture removed successfully!');
        await checkAuthStatus();
        setShowModal(false); // Close modal after successful removal
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove profile picture');
    }
  };

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        {/* Profile Picture or Initial */}
        <div className={`${config.container} rounded-3xl border-2 border-white/30 overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center relative`}>
          {user?.profile_picture_url ? (
            <img
              src={user.profile_picture_url}
              alt={`${user.full_name}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`${config.text} font-bold text-white`}>
              {getInitials(user?.full_name)}
            </span>
          )}
          
          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-xs">{uploadingProgress}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        {showEditButton && (
          <button
            onClick={() => setShowModal(true)}
            className={`absolute -bottom-2 -right-2 z-10 ${config.button} bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-110`}
            disabled={uploading}
            title="Edit profile picture"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Hidden file input */}
        <input
          id="profile-picture-input"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Profile Picture</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={uploading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Large Profile Picture Display */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-2xl border-4 border-gray-200 overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center relative">
                {user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={`${user.full_name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {getInitials(user?.full_name)}
                  </span>
                )}
                
                {/* Upload Progress Overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                      <div className="text-sm">{uploadingProgress}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Edit Profile Picture Button */}
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{uploading ? 'Uploading...' : 'Upload New Picture'}</span>
              </button>

              {/* Delete Profile Picture Button */}
              {user?.profile_picture_url && (
                <button
                  onClick={handleRemovePicture}
                  disabled={uploading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove Picture</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                onClick={() => setShowModal(false)}
                disabled={uploading}
                className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* File Size Info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePicture;
