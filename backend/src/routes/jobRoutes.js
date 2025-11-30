const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getUserApplications,
  getMyJobs,
  updateApplicationStatus,
  getJobStats
} = require('../controllers/jobController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Job = require('../models/Job');
const User = require('../models/User');
const https = require('https');
const http = require('http');

// Public routes (no rate limiting for job browsing)
router.get('/', getJobs);
router.get('/stats', getJobStats);
router.get('/:id', getJobById);

// Protected routes
router.use(auth); // All routes below require authentication

// Job application routes
router.post('/:id/apply', upload.single('resume'), applyForJob);
router.get('/user/applications', getUserApplications);

// Job management routes (for recruiters/admins)
router.post('/', createJob);
router.get('/my/jobs', getMyJobs);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.put('/applications/status', updateApplicationStatus);

// Compatibility route to update application status with params
// Allows PUT /api/jobs/admin/applications/:jobId/:applicationId with body { status }
router.put('/admin/applications/:jobId/:applicationId', async (req, res, next) => {
  try {
    // Remap params into body to reuse controller
    req.body.jobId = req.params.jobId;
    req.body.applicationId = req.params.applicationId;
    return updateApplicationStatus(req, res);
  } catch (e) {
    next(e);
  }
});

// Delete application (Admin only)
router.delete('/applications/:jobId/:applicationId', auth, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Remove application from job
    job.applications.pull(applicationId);
    await job.save();

    // Remove application from user's appliedJobs
    await User.updateOne(
      { _id: application.user },
      { $pull: { appliedJobs: { job: jobId } } }
    );

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete application' });
  }
});

// View resume from job application (for recruiters)
router.get('/applications/:jobId/:applicationId/view-resume', auth, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;

    // Check if user is authorized (recruiter/admin or job poster)
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify authorization: user must be the job poster, recruiter, or admin
    if (job.postedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'recruiter' && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get resume URL (prefer resumeUrl, fallback to resume or user's resume)
    let resumeUrl = application.resumeUrl;
    
    if (!resumeUrl) {
      // Fallback: try to construct from public_id or get from user
      if (application.resumePublicId) {
        const cloudinary = require('../config/cloudinary');
        resumeUrl = cloudinary.url(application.resumePublicId, { resource_type: 'raw' });
      } else if (application.resume) {
        // If resume is a Cloudinary public_id, construct URL
        const cloudinary = require('../config/cloudinary');
        resumeUrl = cloudinary.url(application.resume, { resource_type: 'raw' });
      } else {
        // Fallback to user's profile resume
        const applicant = await User.findById(application.user).select('resume');
        resumeUrl = applicant?.resume;
      }
    }

    if (!resumeUrl) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for inline viewing
    const fetchModule = resumeUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(resumeUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch resume from Cloudinary' });
      }

      // Set headers for inline PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL
      res.redirect(resumeUrl);
    });
  } catch (error) {
    console.error('View application resume error:', error);
    res.status(500).json({ message: error.message || 'Failed to view resume' });
  }
});

// Download resume from job application (for recruiters)
router.get('/applications/:jobId/:applicationId/download-resume', auth, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;

    // Check if user is authorized (recruiter/admin or job poster)
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify authorization: user must be the job poster, recruiter, or admin
    if (job.postedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'recruiter' && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get applicant info for filename
    const applicant = await User.findById(application.user).select('firstName lastName');
    const applicantName = applicant ? `${applicant.firstName || ''}_${applicant.lastName || ''}`.trim() || 'Candidate' : 'Candidate';

    // Get resume URL (prefer resumeUrl, fallback to resume or user's resume)
    let resumeUrl = application.resumeUrl;
    
    if (!resumeUrl) {
      // Fallback: try to construct from public_id or get from user
      if (application.resumePublicId) {
        const cloudinary = require('../config/cloudinary');
        resumeUrl = cloudinary.url(application.resumePublicId, { resource_type: 'raw' });
      } else if (application.resume) {
        // If resume is a Cloudinary public_id, construct URL
        const cloudinary = require('../config/cloudinary');
        resumeUrl = cloudinary.url(application.resume, { resource_type: 'raw' });
      } else {
        // Fallback to user's profile resume
        const userResume = await User.findById(application.user).select('resume');
        resumeUrl = userResume?.resume;
      }
    }

    if (!resumeUrl) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Fetch from Cloudinary and proxy with proper headers for download
    const fetchModule = resumeUrl.startsWith('https://') ? https : http;
    
    fetchModule.get(resumeUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).json({ message: 'Failed to fetch resume from Cloudinary' });
      }

      // Set headers for download
      const fileName = `${applicantName}_Resume.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching from Cloudinary:', error);
      // Fallback: redirect to Cloudinary URL with download parameter
      const downloadUrl = resumeUrl.replace('/upload/', '/upload/fl_attachment/');
      res.redirect(downloadUrl);
    });
  } catch (error) {
    console.error('Download application resume error:', error);
    res.status(500).json({ message: error.message || 'Failed to download resume' });
  }
});

module.exports = router;
