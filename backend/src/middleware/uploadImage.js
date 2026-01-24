const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure multer for Cloudinary storage - Images only
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Sanitize original filename
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create unique filename with timestamp and user ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?._id?.toString() || 'anonymous';
    
    return {
      folder: 'staffdox/blog-images', // Organize blog images separately
      public_id: `blog-image-${userId}-${uniqueSuffix}`,
      resource_type: 'image' // Use 'image' type for images
    };
  }
});

// File filter to only allow image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const ext = file.originalname.split('.').pop().toLowerCase();
  const mimeType = file.mimetype;
  
  // Check both extension and MIME type for security
  if (allowedTypes.includes(`.${ext}`) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    console.warn(`Image upload rejected: ${file.originalname} (ext: .${ext}, mime: ${mimeType})`);
    cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
    files: 1 // Only allow one file at a time
  }
});

module.exports = upload;

