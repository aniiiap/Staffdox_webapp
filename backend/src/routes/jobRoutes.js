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

module.exports = router;
