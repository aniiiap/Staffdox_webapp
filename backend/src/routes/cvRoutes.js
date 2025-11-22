const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadCvMiddleware = require('../middleware/uploadCv');
const CvUpload = require('../models/CvUpload');
const https = require('https');
const http = require('http');
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  uploadCv,
  getCvs,
  deleteCv,
  downloadCv,
  viewCv,
  getCvsForRecruiter,
  checkCvAccess
} = require('../controllers/cvController');

// All routes require admin authentication
router.use(auth);

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Folder routes
router.post('/folders', requireAdmin, createFolder);
router.get('/folders', requireAdmin, getFolders);
router.get('/folders/:id', requireAdmin, getFolderById);
router.put('/folders/:id', requireAdmin, updateFolder);
router.delete('/folders/:id', requireAdmin, deleteFolder);

// CV routes - handle multer errors
router.post('/cvs/upload', requireAdmin, (req, res, next) => {
  uploadCvMiddleware.single('cv')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 5MB limit. Please choose a smaller file.' });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: 'File upload error' });
    }
    next();
  });
}, uploadCv);
router.get('/cvs', requireAdmin, getCvs);
router.delete('/cvs/:id', requireAdmin, deleteCv);
router.get('/cvs/:id/download', requireAdmin, downloadCv);
router.get('/cvs/:id/view', requireAdmin, viewCv);

// Recruiter CV routes (require recruiter role)
const requireRecruiter = (req, res, next) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Recruiter only.' });
  }
  next();
};

router.get('/recruiter/cvs', requireRecruiter, getCvsForRecruiter);
router.get('/recruiter/cvs/:cvId/check-access', requireRecruiter, checkCvAccess);
// Recruiter download CV with access check
const downloadCvForRecruiter = async (req, res) => {
  try {
    const cv = await CvUpload.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    const { checkCvAccessHelper } = require('../controllers/cvController');
    const hasAccess = await checkCvAccessHelper(req.user._id, req.params.cvId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Upgrade your plan to download this CV' });
    }

    // Redirect to Cloudinary URL for download
    const cloudinaryUrl = cv.cloudinaryUrl || cv.filePath;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'CV file URL not found' });
    }

    // Get Cloudinary URL with download format
    const downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Recruiter download CV error:', error);
    res.status(500).json({ message: error.message || 'Failed to download CV' });
  }
};

// Recruiter view CV with access check
const viewCvForRecruiter = async (req, res) => {
  try {
    const cv = await CvUpload.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    const { checkCvAccessHelper } = require('../controllers/cvController');
    const hasAccess = await checkCvAccessHelper(req.user._id, req.params.cvId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Upgrade your plan to view this CV' });
    }

    // For Cloudinary URLs, fetch the file and serve with inline headers
    const cloudinaryUrl = cv.cloudinaryUrl || cv.filePath;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'CV file URL not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for inline viewing
    const fetchModule = cloudinaryUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(cloudinaryUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch CV from Cloudinary' });
      }

      // Set headers for inline PDF viewing (override any download headers)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cv.originalName || 'cv.pdf'}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL
      res.redirect(cloudinaryUrl);
    });
  } catch (error) {
    console.error('Recruiter view CV error:', error);
    res.status(500).json({ message: error.message || 'Failed to view CV' });
  }
};

router.get('/recruiter/cvs/:cvId/download', requireRecruiter, downloadCvForRecruiter);
router.get('/recruiter/cvs/:cvId/view', requireRecruiter, viewCvForRecruiter);

module.exports = router;

