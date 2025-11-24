// backend/src/routes/user.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const SalesEnquiry = require('../models/SalesEnquiry');
const Job = require('../models/Job');
const { sendSalesEnquiryThankYou } = require('../utils/emailService');
const https = require('https');
const http = require('http');

// get me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate profile completeness only for regular users
    if (user.role === 'user') {
      user.calculateProfileCompleteness();
    }
    await user.save();
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by phone number (for payment flow after OTP verification)
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    // Clean phone number - remove spaces, dashes, and other non-digit characters except +
    let cleanedPhone = phone.replace(/[\s-()]/g, '');
    
    console.log('Searching for user with phone:', cleanedPhone);
    console.log('Role filter: recruiter');
    
    // Try multiple phone number formats
    const phoneVariations = [
      cleanedPhone,
      cleanedPhone.replace(/^\+91/, ''), // Remove +91 prefix
      cleanedPhone.replace(/^91/, ''), // Remove 91 prefix
      `+91${cleanedPhone.replace(/^\+?91?/, '')}`, // Add +91 prefix
      `91${cleanedPhone.replace(/^\+?91?/, '')}`, // Add 91 prefix
      cleanedPhone.replace(/^\+/, '') // Remove + if present
    ];
    
    // Remove duplicates
    const uniquePhoneVariations = [...new Set(phoneVariations)];
    console.log('Trying phone variations:', uniquePhoneVariations);
    
    // First, try to find any user with this phone (to check if number exists)
    let user = null;
    
    // Try each phone variation
    for (const phoneVar of uniquePhoneVariations) {
      user = await User.findOne({ 
        phone: phoneVar,
        role: 'recruiter'
      }).select('-passwordHash');
      
      if (user) {
        console.log('Found user with phone variation:', phoneVar);
        console.log('User ID:', user._id);
        console.log('User email:', user.email);
        console.log('User role:', user.role);
        break;
      }
    }
    
    // If still not found, try without role filter to see if user exists with different role
    if (!user) {
      console.log('User not found with recruiter role, checking all roles...');
      for (const phoneVar of uniquePhoneVariations) {
        const anyUser = await User.findOne({ phone: phoneVar }).select('-passwordHash role');
        if (anyUser) {
          console.log('Found user with phone but different role:', anyUser.role);
          return res.status(404).json({ 
            message: `User found but is not a recruiter. Current role: ${anyUser.role}` 
          });
        }
      }
      return res.status(404).json({ 
        message: 'No recruiter found with this mobile number. Please ensure you are registered as an employer.' 
      });
    }
    
    // Also fetch SalesEnquiry to get company details
    const salesEnquiry = await SalesEnquiry.findOne({ 
      user: user._id,
      status: 'approved'
    }).sort({ createdAt: -1 });
    
    // Convert user to plain object to ensure all fields are included
    const userData = user.toObject();
    
    // Merge sales enquiry data into user object for easier access
    if (salesEnquiry) {
      userData.city = salesEnquiry.city || userData.city || '';
      userData.companyName = salesEnquiry.companyName || userData.currentCompany || '';
      userData.designation = salesEnquiry.designation || userData.currentPosition || '';
    }
    
    // Ensure all required fields are present (even if empty)
    // User model fields: firstName, lastName, email, phone, location
    // SalesEnquiry fields: city
    // Note: state, pincode, and address are not stored in either model
    // They will be empty strings and user can fill them
    
    console.log('Returning user data:', {
      _id: userData._id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
      city: userData.city,
      role: userData.role
    });
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// update profile
router.put('/me', auth, async (req, res) => {
  try {
    const { password, resume, workExperience, education, jobPreferences, ...updates } = req.body;
    
    // Fields that should not be updated directly
    const systemFields = ['_id', 'id', 'createdAt', 'updatedAt', 'email', 'role', 'googleId', 'linkedinId', 'passwordHash', 'appliedJobs', 'isActive', 'emailVerified', 'lastLogin', 'plan', 'passwordResetToken', 'passwordResetExpires', 'passwordResetUsed', 'profileCompleteness'];
    
    // Build update object
    const updateObj = {};
    
    // Handle resume deletion
    if (resume === null) {
      const user = await User.findById(req.user._id);
      if (user && user.resumeCloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(user.resumeCloudinaryPublicId);
          console.log('Resume deleted from Cloudinary:', user.resumeCloudinaryPublicId);
        } catch (deleteError) {
          console.error('Error deleting resume from Cloudinary:', deleteError);
        }
      }
      updateObj.resume = null;
      updateObj.resumeCloudinaryPublicId = null;
    } else if (resume !== undefined && resume !== null) {
      updateObj.resume = resume;
    }

    // Update normal fields (excluding system fields and special fields)
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && !systemFields.includes(key) && key !== 'workExperience' && key !== 'education' && key !== 'jobPreferences') {
        // Convert empty strings to null for optional fields
        updateObj[key] = updates[key] === '' ? null : updates[key];
      }
    });

    // Handle workExperience - convert date strings to Date objects with validation
    if (workExperience !== undefined) {
      if (Array.isArray(workExperience)) {
        updateObj.workExperience = workExperience.map(exp => {
          const experience = {
            company: exp.company || '',
            position: exp.position || '',
            current: Boolean(exp.current),
            description: exp.description || ''
          };
          
          // Validate and parse startDate (handle empty strings)
          if (exp.startDate && String(exp.startDate).trim() !== '') {
            const startDate = new Date(exp.startDate);
            if (!isNaN(startDate.getTime())) {
              experience.startDate = startDate;
            }
          }
          
          // Validate and parse endDate (only if not current and not empty)
          if (exp.endDate && String(exp.endDate).trim() !== '' && !exp.current) {
            const endDate = new Date(exp.endDate);
            if (!isNaN(endDate.getTime())) {
              experience.endDate = endDate;
            }
          }
          
          return experience;
        });
      } else if (workExperience === null) {
        updateObj.workExperience = [];
      }
    }

    // Handle education array with validation
    if (education !== undefined) {
      if (Array.isArray(education)) {
        updateObj.education = education.map(edu => {
          const educationItem = {
            degree: edu.degree || '',
            institution: edu.institution || '',
            field: edu.field || ''
          };
          
          // Validate and parse year (handle empty strings and string numbers)
          if (edu.year && String(edu.year).trim() !== '') {
            const year = parseInt(String(edu.year).trim(), 10);
            if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear() + 10) {
              educationItem.year = year;
            }
          }
          
          return educationItem;
        });
      } else if (education === null) {
        updateObj.education = [];
      }
    }

    // Handle jobPreferences - properly format nested object with validation
    if (jobPreferences !== undefined) {
      if (jobPreferences === null) {
        updateObj.jobPreferences = {
          preferredLocations: [],
          preferredJobTypes: [],
          expectedSalary: { currency: 'INR' },
          preferredIndustries: [],
          availability: undefined
        };
      } else if (typeof jobPreferences === 'object') {
        // Valid enum values for job types
        const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
        // Valid enum values for availability
        const validAvailability = ['Immediate', '2 weeks', '1 month', '2 months', '3+ months'];
        
        const prefs = {
          preferredLocations: Array.isArray(jobPreferences.preferredLocations) 
            ? jobPreferences.preferredLocations.filter(loc => loc && typeof loc === 'string' && loc.trim() !== '')
            : [],
          preferredJobTypes: Array.isArray(jobPreferences.preferredJobTypes) 
            ? jobPreferences.preferredJobTypes.filter(type => 
                type && typeof type === 'string' && validJobTypes.includes(type)
              )
            : [],
          expectedSalary: {
            currency: jobPreferences.expectedSalary?.currency || 'INR'
          },
          preferredIndustries: Array.isArray(jobPreferences.preferredIndustries) 
            ? jobPreferences.preferredIndustries.filter(industry => 
                industry && typeof industry === 'string' && industry.trim() !== ''
              )
            : [],
          availability: undefined
        };
        
        // Validate and parse salary min/max (handle empty strings and null)
        if (jobPreferences.expectedSalary?.min !== undefined && jobPreferences.expectedSalary.min !== '' && jobPreferences.expectedSalary.min !== null) {
          const minValue = String(jobPreferences.expectedSalary.min).trim();
          if (minValue !== '') {
            const min = parseFloat(minValue);
            if (!isNaN(min) && min >= 0) {
              prefs.expectedSalary.min = min;
            }
          }
        }
        
        if (jobPreferences.expectedSalary?.max !== undefined && jobPreferences.expectedSalary.max !== '' && jobPreferences.expectedSalary.max !== null) {
          const maxValue = String(jobPreferences.expectedSalary.max).trim();
          if (maxValue !== '') {
            const max = parseFloat(maxValue);
            if (!isNaN(max) && max >= 0) {
              prefs.expectedSalary.max = max;
            }
          }
        }
        
        // Validate availability enum (handle empty strings)
        if (jobPreferences.availability && typeof jobPreferences.availability === 'string') {
          const trimmedAvailability = jobPreferences.availability.trim();
          if (trimmedAvailability !== '' && validAvailability.includes(trimmedAvailability)) {
            prefs.availability = trimmedAvailability;
          } else if (trimmedAvailability === '') {
            prefs.availability = undefined;
          }
        }
        
        updateObj.jobPreferences = prefs;
      }
    }

    // If password is provided, hash and update it
    if (password && typeof password === 'string' && password.trim()) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateObj.passwordHash = await bcrypt.hash(password, salt);
    }

    // Use findByIdAndUpdate to avoid version conflicts - this is atomic
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateObj },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate profile completeness after update (only for regular users)
    // Use findByIdAndUpdate again to avoid version conflicts
    if (user.role === 'user') {
      user.calculateProfileCompleteness();
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { profileCompleteness: user.profileCompleteness } },
        { new: true }
      ).select('-passwordHash');
      
      if (updatedUser) {
        const safeUser = updatedUser.toObject();
        delete safeUser.passwordHash;
        return res.json({ user: safeUser });
      }
    }

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.json({ user: safeUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    console.error('Error stack:', err.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Provide more specific error messages
    let errorMessage = 'Server error';
    if (err.name === 'ValidationError') {
      errorMessage = `Validation error: ${Object.values(err.errors).map(e => e.message).join(', ')}`;
    } else if (err.name === 'CastError') {
      errorMessage = `Invalid data format: ${err.message}`;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// Upload resume
router.post('/upload-resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old resume from Cloudinary if exists
    if (user.resume && user.resumeCloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.resumeCloudinaryPublicId);
        console.log('Old resume file deleted from Cloudinary:', user.resumeCloudinaryPublicId);
      } catch (deleteError) {
        console.error('Error deleting old resume file from Cloudinary:', deleteError);
        // Continue anyway - don't fail the upload if old file deletion fails
      }
    }

    // Extract Cloudinary URL and public_id from multer-storage-cloudinary
    // multer-storage-cloudinary stores the result in req.file
    // Debug: Log the file object structure to see what properties are available
    if (process.env.NODE_ENV === 'development') {
      console.log('Uploaded file object:', JSON.stringify(req.file, null, 2));
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

    // Update user with new resume Cloudinary URL
    user.resume = cloudinaryUrl;
    user.resumeCloudinaryPublicId = cloudinaryPublicId;
    user.calculateProfileCompleteness();
    await user.save();

    // Return full updated user object
    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.json({ 
      message: 'Resume uploaded successfully',
      resume: user.resume,
      user: safeUser
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Failed to upload resume' });
  }
});

// Download resume (admin only)
router.get('/download-resume/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.userId);
    if (!user || !user.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Redirect to Cloudinary URL for download
    const cloudinaryUrl = user.resume;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'Resume file URL not found' });
    }

    // Get Cloudinary URL with download format
    const downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ message: 'Failed to download resume' });
  }
});

// Download resume for recruiters (only for applicants to their own jobs)
router.get('/recruiter/download-resume/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser || !targetUser.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // For recruiters: verify the applicant applied to a job posted by this recruiter
    const job = await Job.findOne({
      postedBy: req.user._id,
      'applications.user': targetUser._id
    }).select('_id');

    if (!job && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this resume' });
    }

    // For Cloudinary URLs, fetch the file and serve with download headers
    const cloudinaryUrl = targetUser.resume;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'Resume file URL not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for download
    const fetchModule = cloudinaryUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(cloudinaryUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch resume from Cloudinary' });
      }

      // Set headers for download
      const fileName = `${targetUser.firstName || 'User'}_${targetUser.lastName || 'Resume'}_Resume.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL
      res.redirect(cloudinaryUrl);
    });
  } catch (error) {
    console.error('Recruiter resume download error:', error);
    res.status(500).json({ message: 'Failed to download resume' });
  }
});

// View resume inline for recruiters (only for applicants to their jobs)
router.get('/recruiter/view-resume/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser || !targetUser.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Recruiter: verify relationship (admin bypasses check)
    if (req.user.role !== 'admin') {
      const job = await Job.findOne({
        postedBy: req.user._id,
        'applications.user': targetUser._id
      }).select('_id');
      if (!job) return res.status(403).json({ message: 'Not authorized to view this resume' });
    }

    // For Cloudinary URLs, fetch the file and serve with inline headers
    const cloudinaryUrl = targetUser.resume;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'Resume file URL not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for inline viewing
    const fetchModule = cloudinaryUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(cloudinaryUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch resume from Cloudinary' });
      }

      // Set headers for inline PDF viewing (override any download headers)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL
      res.redirect(cloudinaryUrl);
    });
  } catch (error) {
    console.error('Recruiter resume view error:', error);
    res.status(500).json({ message: 'Failed to view resume' });
  }
});

// Get own resume (for viewing/downloading by user)
router.get('/my-resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Redirect to Cloudinary URL for download
    const cloudinaryUrl = user.resume;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'Resume file URL not found' });
    }

    // Get Cloudinary URL with download format
    const downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ message: 'Failed to download resume' });
  }
});

// View own resume (for viewing in browser)
router.get('/view-resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // For Cloudinary URLs, fetch the file and serve with inline headers
    const cloudinaryUrl = user.resume;
    if (!cloudinaryUrl) {
      return res.status(404).json({ message: 'Resume file URL not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for inline viewing
    const fetchModule = cloudinaryUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(cloudinaryUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch resume from Cloudinary' });
      }

      // Set headers for inline PDF viewing (override any download headers)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL
      res.redirect(cloudinaryUrl);
    });
  } catch (error) {
    console.error('Resume view error:', error);
    res.status(500).json({ message: 'Failed to view resume' });
  }
});

// Delete resume
router.delete('/delete-resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resume) {
      return res.status(404).json({ message: 'No resume to delete' });
    }

    // Delete file from Cloudinary
    if (user.resumeCloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.resumeCloudinaryPublicId);
        console.log('Resume deleted from Cloudinary:', user.resumeCloudinaryPublicId);
      } catch (err) {
        console.error('Error deleting file from Cloudinary:', err);
        // Continue anyway
      }
    }

    // Remove resume from user record
    user.resume = null;
    user.resumeCloudinaryPublicId = null;
    user.calculateProfileCompleteness();
    await user.save();

    res.json({ 
      message: 'Resume deleted successfully',
      resume: null 
    });
  } catch (error) {
    console.error('Resume delete error:', error);
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

// Admin routes
// Get all users (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({}).select('-passwordHash');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: list current recruiters (place BEFORE /:id to avoid route conflict)
router.get('/recruiters', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const recruiters = await User.find({ role: 'recruiter' }).select('firstName lastName email currentCompany currentPosition');

    // Attach companyName from SalesEnquiry (prefer approved, then latest)
    const enriched = await Promise.all(recruiters.map(async (rec) => {
      const r = rec.toObject ? rec.toObject() : rec;
      let enquiry = await SalesEnquiry
        .findOne({ user: rec._id, status: 'approved' })
        .select('companyName createdAt')
        .sort({ createdAt: -1 });
      if (!enquiry) {
        enquiry = await SalesEnquiry
          .findOne({ user: rec._id })
          .select('companyName createdAt')
          .sort({ createdAt: -1 });
      }
      r.companyName = enquiry?.companyName || null;
      return r;
    }));

    res.json({ recruiters: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's resume file from Cloudinary if it exists
    if (user.resumeCloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.resumeCloudinaryPublicId);
        console.log('Resume deleted from Cloudinary:', user.resumeCloudinaryPublicId);
      } catch (err) {
        console.error('Error deleting resume file from Cloudinary:', err);
        // Continue anyway
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Recruiter: apply to become recruiter (user only)
router.post('/recruiter/apply', auth, async (req, res) => {
  try {
    const {
      contactName,
      contactPhone,
      designation,
      companyName,
      companyEmail,
      companySize,
      city,
      companyWebsite,
      cinOrGst,
      linkedin,
      note
    } = req.body;

    if (!contactName || !contactPhone || !designation || !companyName || !companyEmail || !companySize || !city) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    // Prevent duplicates if pending exists
    const existing = await SalesEnquiry.findOne({ user: req.user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending application' });
    }
    const enquiry = await SalesEnquiry.create({
      user: req.user._id,
      contactName,
      contactPhone,
      designation,
      companyName,
      companyWebsite,
      companyEmail,
      companySize,
      city,
      cinOrGst,
      linkedin,
      note
    });
    res.status(201).json({ message: 'Application submitted', application: enquiry });
  } catch (error) {
    console.error('Recruiter apply error:', error);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// Recruiter: public apply (no auth) - request callback
router.post('/recruiter/apply-public', async (req, res) => {
  try {
    const {
      contactName,
      contactPhone,
      designation,
      companyName,
      companyEmail,
      companySize,
      city,
      companyWebsite,
      cinOrGst,
      linkedin,
      note
    } = req.body;

    if (!contactName || !contactPhone || !designation || !companyName || !companyEmail || !companySize || !city) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const existing = await SalesEnquiry.findOne({
      user: null,
      companyEmail,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'A pending request already exists for this email' });
    }

    const enquiry = await SalesEnquiry.create({
      user: null,
      contactName,
      contactPhone,
      designation,
      companyName,
      companyEmail,
      companySize,
      city,
      companyWebsite,
      cinOrGst,
      linkedin,
      note
    });

    // Send thank you email (non-blocking - don't fail request if email fails)
    sendSalesEnquiryThankYou(companyEmail, contactName, companyName)
      .then(result => {
        if (result.success) {
          console.log(`Sales enquiry thank you email sent to ${companyEmail}`);
        } else {
          console.warn(`Failed to send sales enquiry thank you email to ${companyEmail}:`, result.message);
        }
      })
      .catch(err => {
        console.error('Error in sales enquiry thank you email send:', err);
      });

    res.status(201).json({ message: 'Callback request submitted', application: enquiry });
  } catch (error) {
    console.error('Recruiter public apply error:', error);
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

// Admin: list sales enquiries
router.get('/recruiter/applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const enquiries = await SalesEnquiry.find({}).populate('user', 'firstName lastName email');
    res.json({ applications: enquiries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: approve application
router.put('/recruiter/applications/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const enquiry = await SalesEnquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Application not found' });
    if (!enquiry.user) {
      return res.status(400).json({ message: 'No linked user account for this application' });
    }
    enquiry.status = 'approved';
    enquiry.reviewedBy = req.user._id;
    enquiry.reviewedAt = new Date();
    await enquiry.save();
    // Set user role to recruiter
    const user = await User.findById(enquiry.user);
    if (user) {
      user.role = 'recruiter';
      await user.save();
    }
    res.json({ message: 'Application approved' });
  } catch (error) {
    console.error('Approve sales enquiry error:', error);
    res.status(500).json({ message: 'Failed to approve application' });
  }
});

// Admin: reject application
router.put('/recruiter/applications/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { reason } = req.body;
    const enquiry = await SalesEnquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Application not found' });
    enquiry.status = 'rejected';
    enquiry.rejectReason = reason;
    enquiry.reviewedBy = req.user._id;
    enquiry.reviewedAt = new Date();
    await enquiry.save();
    res.json({ message: 'Application rejected' });
  } catch (error) {
    console.error('Reject sales enquiry error:', error);
    res.status(500).json({ message: 'Failed to reject application' });
  }
});

// (moved /recruiters above)

module.exports = router;
