const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure multer for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Sanitize original filename
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create unique filename with timestamp and user ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?._id?.toString() || 'anonymous';
    
    // Determine resource type based on file extension
    const ext = sanitizedOriginal.split('.').pop().toLowerCase();
    const resourceType = ext === 'pdf' ? 'raw' : 'raw'; // PDFs and docs should be 'raw' type
    
    return {
      folder: 'staffdox/resumes', // Organize files in Cloudinary
      public_id: `resume-${userId}-${uniqueSuffix}`,
      resource_type: resourceType, // Use 'raw' for PDFs and documents
      allowed_formats: ['pdf', 'doc', 'docx'], // Only allow these formats
    };
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const ext = file.originalname.split('.').pop().toLowerCase();
  const mimeType = file.mimetype;
  
  // Check both extension and MIME type for security
  if (allowedTypes.includes(`.${ext}`) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    console.warn(`File upload rejected: ${file.originalname} (ext: .${ext}, mime: ${mimeType})`);
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow one file at a time
  }
});

module.exports = upload;
