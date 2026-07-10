// Cloudinary configuration and upload utilities
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // This should be in your .env file
});

// Configure multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gbpant-alumni-profiles', // Organize uploads in a specific folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: 'fill',
        gravity: 'face', // Focus on face if detected
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ],
    // Ensure file size is under 5MB
    bytes_step: 1000,
    max_bytes: 5000000 // 5MB limit
  },
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Utility function to delete old profile picture from Cloudinary
const deleteProfilePicture = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted old profile picture: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting old profile picture:', error);
    // Don't throw error as this is cleanup - main upload should still work
  }
};

// Extract public_id from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  
  try {
    const parts = cloudinaryUrl.split('/');
    const fileWithExtension = parts[parts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    return `gbpant-alumni-profiles/${publicId}`;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteProfilePicture,
  extractPublicId
};
