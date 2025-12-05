const CvFolder = require('../models/CvFolder');
const CvUpload = require('../models/CvUpload');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const https = require('https');
const http = require('http');

// Create a new CV folder
const createFolder = async (req, res) => {
  try {
    const { name, description, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // Check if folder with same name already exists
    const existingFolder = await CvFolder.findOne({ 
      name: name.trim(),
      createdBy: req.user._id 
    });

    if (existingFolder) {
      return res.status(400).json({ message: 'A folder with this name already exists' });
    }

    const folder = await CvFolder.create({
      name: name.trim(),
      description: description?.trim() || '',
      role: role?.trim() || '',
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: error.message || 'Failed to create folder' });
  }
};

// Get all folders with CV count (optimized with aggregation)
const getFolders = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    // Use aggregation to get folders with CV counts in a single query
    const foldersWithCount = await CvFolder.aggregate([
      { $match: { createdBy: userId } },
      {
        $lookup: {
          from: 'cvuploads',
          localField: '_id',
          foreignField: 'folder',
          as: 'cvs'
        }
      },
      {
        $addFields: {
          cvCount: { $size: '$cvs' }
        }
      },
      {
        $project: {
          cvs: 0 // Don't return the full CV array, just the count
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Populate createdBy separately (needed for ObjectId conversion)
    const populatedFolders = await CvFolder.populate(foldersWithCount, {
      path: 'createdBy',
      select: 'firstName lastName email'
    });

    res.json({ folders: populatedFolders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch folders' });
  }
};

// Get folder by ID with CVs
const getFolderById = async (req, res) => {
  try {
    const folder = await CvFolder.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Verify ownership
    if (folder.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const cvs = await CvUpload.find({ folder: folder._id })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const folderObj = folder.toObject();
    folderObj.cvs = cvs;
    folderObj.cvCount = cvs.length;

    res.json({ folder: folderObj });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch folder' });
  }
};

// Update folder
const updateFolder = async (req, res) => {
  try {
    const { name, description, role } = req.body;

    const folder = await CvFolder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Verify ownership
    if (folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if new name conflicts with existing folder
    if (name && name.trim() !== folder.name) {
      const existingFolder = await CvFolder.findOne({ 
        name: name.trim(),
        createdBy: req.user._id,
        _id: { $ne: folder._id }
      });

      if (existingFolder) {
        return res.status(400).json({ message: 'A folder with this name already exists' });
      }
    }

    if (name) folder.name = name.trim();
    if (description !== undefined) folder.description = description?.trim() || '';
    if (role !== undefined) folder.role = role?.trim() || '';

    await folder.save();

    res.json({
      message: 'Folder updated successfully',
      folder
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ message: error.message || 'Failed to update folder' });
  }
};

// Delete folder (and all CVs in it)
const deleteFolder = async (req, res) => {
  try {
    const folder = await CvFolder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Verify ownership
    if (folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all CVs in this folder
    const cvs = await CvUpload.find({ folder: folder._id });

    // Delete all CV files from Cloudinary
    for (const cv of cvs) {
      if (cv.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(cv.cloudinaryPublicId);
        } catch (err) {
          console.error(`Error deleting file from Cloudinary ${cv.cloudinaryPublicId}:`, err);
          // Continue with deletion even if Cloudinary deletion fails
        }
      }
    }

    // Delete all CV records
    await CvUpload.deleteMany({ folder: folder._id });

    // Delete folder
    await CvFolder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Folder and all CVs deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete folder' });
  }
};

// Upload CV to a folder
const uploadCv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { folderId, candidateName, candidateEmail, notes } = req.body;

    if (!folderId) {
      // Delete uploaded file from Cloudinary if folderId is missing
      if (req.file.public_id) {
        try {
          await cloudinary.uploader.destroy(req.file.public_id);
        } catch (err) {
          console.error('Error deleting file from Cloudinary:', err);
        }
      }
      return res.status(400).json({ message: 'Folder ID is required' });
    }

    // Verify folder exists and user owns it
    const folder = await CvFolder.findById(folderId);
    if (!folder) {
      // Delete uploaded file from Cloudinary if folder doesn't exist
      if (req.file.public_id) {
        try {
          await cloudinary.uploader.destroy(req.file.public_id);
        } catch (err) {
          console.error('Error deleting file from Cloudinary:', err);
        }
      }
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (folder.createdBy.toString() !== req.user._id.toString()) {
      // Delete uploaded file from Cloudinary if user doesn't own folder
      if (req.file.public_id) {
        try {
          await cloudinary.uploader.destroy(req.file.public_id);
        } catch (err) {
          console.error('Error deleting file from Cloudinary:', err);
        }
      }
      return res.status(403).json({ message: 'Access denied' });
    }

    // Extract Cloudinary URL and public_id from multer-storage-cloudinary
    // multer-storage-cloudinary stores the result in req.file
    // Debug: Log the file object structure to see what properties are available
    if (process.env.NODE_ENV === 'development') {
      console.log('Uploaded CV file object:', JSON.stringify(req.file, null, 2));
    }
    
    const cloudinaryUrl = req.file.path || req.file.url || req.file.secure_url;
    const cloudinaryPublicId = req.file.public_id || req.file.filename || req.file.publicId;
    
    if (!cloudinaryUrl) {
      console.error('❌ Cloudinary URL not found in req.file:', req.file);
      return res.status(500).json({ 
        message: 'Failed to get Cloudinary URL from uploaded file',
        debug: process.env.NODE_ENV === 'development' ? { file: req.file } : undefined
      });
    }

    // Create CV upload record
    const cvUpload = await CvUpload.create({
      originalName: req.file.originalname,
      fileName: req.file.filename || cloudinaryPublicId,
      filePath: cloudinaryUrl, // Store Cloudinary URL in filePath for backward compatibility
      cloudinaryUrl: cloudinaryUrl, // Primary Cloudinary URL
      cloudinaryPublicId: cloudinaryPublicId, // For deletion purposes
      fileSize: req.file.size || 0,
      mimeType: req.file.mimetype || req.file.content_type || 'application/pdf',
      folder: folderId,
      uploadedBy: req.user._id,
      candidateName: candidateName?.trim() || '',
      candidateEmail: candidateEmail?.trim() || '',
      notes: notes?.trim() || ''
    });

    // Update folder CV count (optional - can be calculated on the fly)
    await CvFolder.findByIdAndUpdate(folderId, {
      $inc: { cvCount: 1 }
    });

    res.status(201).json({
      message: 'CV uploaded successfully',
      cv: cvUpload
    });
  } catch (error) {
    console.error('Upload CV error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Clean up uploaded file from Cloudinary if error occurred
    if (req.file) {
      const publicId = req.file.public_id || req.file.filename;
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error cleaning up file from Cloudinary:', err);
        }
      }
    }

    res.status(500).json({ 
      message: error.message || 'Failed to upload CV',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all CVs (optionally filtered by folder) - optimized
const getCvs = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = {};

    // If folderId is provided, verify ownership and filter by that folder directly
    if (folderId) {
      const folder = await CvFolder.findOne({ 
        _id: folderId,
        createdBy: req.user._id 
      }).select('_id').lean();
      
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      // Only show CVs from the specified folder
      query.folder = folderId;
    } else {
      // Get folder IDs in parallel with CV query for better performance
      const userFolders = await CvFolder.find({ createdBy: req.user._id }).select('_id').lean();
      const folderIds = userFolders.map(f => f._id);
      
      if (folderIds.length === 0) {
        return res.json({ cvs: [] });
      }
      
      // Only show CVs from user's folders
      query.folder = { $in: folderIds };
    }

    // Select only needed fields for faster queries
    const cvs = await CvUpload.find(query)
      .populate('folder', 'name role')
      .populate('uploadedBy', 'firstName lastName email')
      .select('originalName fileName filePath cloudinaryUrl cloudinaryPublicId fileSize mimeType folder uploadedBy candidateName candidateEmail notes commentReason commentDescription createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ cvs });
  } catch (error) {
    console.error('Get CVs error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch CVs' });
  }
};

// Update CV comments (reason & description)
const updateCvComments = async (req, res) => {
  try {
    const { reason, description } = req.body;

    const cv = await CvUpload.findById(req.params.id).populate('folder');

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Verify ownership through folder
    if (cv.folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    cv.commentReason = reason || '';
    cv.commentDescription = description || '';
    await cv.save();

    res.json({
      message: 'CV comments updated successfully',
      cv
    });
  } catch (error) {
    console.error('Update CV comments error:', error);
    res.status(500).json({ message: error.message || 'Failed to update CV comments' });
  }
};

// Delete CV
const deleteCv = async (req, res) => {
  try {
    const cv = await CvUpload.findById(req.params.id)
      .populate('folder');

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Verify ownership through folder
    if (cv.folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from Cloudinary
    if (cv.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(cv.cloudinaryPublicId);
      } catch (err) {
        console.error(`Error deleting file from Cloudinary ${cv.cloudinaryPublicId}:`, err);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    // Delete CV record
    await CvUpload.findByIdAndDelete(req.params.id);

    // Update folder CV count
    await CvFolder.findByIdAndUpdate(cv.folder._id, {
      $inc: { cvCount: -1 }
    });

    res.json({ message: 'CV deleted successfully' });
  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete CV' });
  }
};

// Download CV
const downloadCv = async (req, res) => {
  try {
    const cv = await CvUpload.findById(req.params.id)
      .populate('folder');

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Verify ownership through folder
    if (cv.folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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
    console.error('Download CV error:', error);
    res.status(500).json({ message: error.message || 'Failed to download CV' });
  }
};

// View CV inline
const viewCv = async (req, res) => {
  try {
    const cv = await CvUpload.findById(req.params.id)
      .populate('folder');

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Verify ownership through folder
    if (cv.folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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
    console.error('View CV error:', error);
    res.status(500).json({ message: error.message || 'Failed to view CV' });
  }
};

// Get CVs for recruiters (with plan-based filtering)
const getCvsForRecruiter = async (req, res) => {
  try {
    // Get all CVs from all folders (admin-uploaded CVs)
    const allCvs = await CvUpload.find({})
      .populate('folder', 'name role')
      .populate('uploadedBy', 'firstName lastName email')
      .select('originalName fileName filePath cloudinaryUrl cloudinaryPublicId fileSize mimeType folder uploadedBy candidateName candidateEmail notes createdAt')
      .lean()
      .sort({ createdAt: -1 });

    // Get user's plan info
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('plan');
    
    // Define plan limits for CV access
    const planLimits = {
      'Free': { maxCvs: Infinity, teaserCvs: 0 }, // unlimited CVs accessible
      'Starter': { maxCvs: 10, teaserCvs: 0 },
      'Professional': { maxCvs: 50, teaserCvs: 0 },
      'Enterprise': { maxCvs: Infinity, teaserCvs: 0 }
    };

    const hasActivePlan = user?.plan?.isActive && user?.plan?.name && 
      (!user?.plan?.endDate || new Date(user.plan.endDate) > new Date());
    
    const planName = hasActivePlan ? user.plan.name : 'Free';
    const limits = planLimits[planName] || planLimits['Free'];

    // Mark CVs based on plan limits
    const cvsWithAccess = allCvs.map((cv, index) => {
      const cvObj = { ...cv };
      
      // Access based on maxCvs limit; hide CVs beyond the limit for Free plan
      if (limits.maxCvs === Infinity || index < limits.maxCvs) {
        cvObj.hasAccess = true;
        cvObj.isBlurred = false;
      } else if (planName === 'Free') {
        // For Free plan, don't even show CVs beyond the limit
        cvObj.hasAccess = false;
        cvObj.isBlurred = false;
        cvObj.hidden = true;
      } else {
        // Paid plans: show but blur CVs beyond the limit
        cvObj.hasAccess = false;
        cvObj.isBlurred = true;
      }
      
      return cvObj;
    }).filter(cv => !cv.hidden); // Filter out hidden CVs for free plan

    res.json({ 
      cvs: cvsWithAccess,
      planInfo: {
        planName,
        hasActivePlan,
        maxCvs: limits.maxCvs,
        accessibleCount: cvsWithAccess.filter(cv => cv.hasAccess).length,
        totalCount: allCvs.length
      }
    });
  } catch (error) {
    console.error('Get CVs for recruiter error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch CVs' });
  }
};

// Helper function to check CV access (returns boolean, doesn't send response)
const checkCvAccessHelper = async (userId, cvId) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('plan');
    
    const planLimits = {
      'Free': { maxCvs: Infinity },
      'Starter': { maxCvs: 10 },
      'Professional': { maxCvs: 50 },
      'Enterprise': { maxCvs: Infinity }
    };

    const hasActivePlan = user?.plan?.isActive && user?.plan?.name && 
      (!user?.plan?.endDate || new Date(user.plan.endDate) > new Date());
    
    const planName = hasActivePlan ? user.plan.name : 'Free';
    const limits = planLimits[planName] || planLimits['Free'];

    // Get all CVs to determine this CV's position
    const allCvs = await CvUpload.find({})
      .sort({ createdAt: -1 })
      .select('_id')
      .lean();
    
    const cvIndex = allCvs.findIndex(c => c._id.toString() === cvId);

    if (cvIndex === -1) return false;

    // All plans: allow access while within maxCvs limit
    return limits.maxCvs === Infinity || cvIndex < limits.maxCvs;
  } catch (error) {
    console.error('Check CV access helper error:', error);
    return false;
  }
};

// Check if recruiter can access a specific CV (API endpoint)
const checkCvAccess = async (req, res) => {
  try {
    const { cvId } = req.params;
    
    const cv = await CvUpload.findById(cvId);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    const hasAccess = await checkCvAccessHelper(req.user._id, cvId);
    
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('plan');
    const hasActivePlan = user?.plan?.isActive && user?.plan?.name && 
      (!user?.plan?.endDate || new Date(user.plan.endDate) > new Date());
    const planName = hasActivePlan ? user.plan.name : 'Free';

    res.json({ 
      hasAccess,
      planName,
      message: hasAccess ? 'Access granted' : 'Upgrade your plan to access this CV'
    });
  } catch (error) {
    console.error('Check CV access error:', error);
    res.status(500).json({ message: error.message || 'Failed to check access' });
  }
};

module.exports = {
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
  checkCvAccess,
  checkCvAccessHelper,
  updateCvComments
};

