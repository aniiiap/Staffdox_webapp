const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createJobNotification } = require('./notificationController');
const {
  sendJobNotificationToSubscribers,
  createTransporter,
  getJobNotificationTemplate
} = require('../utils/emailService');

// Get all jobs with filtering and pagination
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      location,
      employmentType,
      experience,
      salaryMin,
      salaryMax,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const includeAll = req.query.includeAll === 'true';
    const query = {};
    if (!includeAll) {
      query.status = 'Active';
      // Filter out expired Free plan jobs from public search
      // Jobs posted by users with Free plan that has expired should not appear
      const now = new Date();
      query.$or = [
        { 'postedByPlan.name': { $ne: 'Free' } }, // Not a Free plan job
        { 'postedByPlan.name': { $exists: false } }, // No plan info (legacy jobs)
        { 'postedByPlan.endDate': { $gt: now } }, // Free plan not expired
        { 'postedByPlan.endDate': { $exists: false } } // No end date (legacy)
      ];
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by employment type
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Filter by experience
    if (experience) {
      const exp = parseInt(experience);
      query['experience.min'] = { $lte: exp };
      query['experience.max'] = { $gte: exp };
    }

    // Filter by salary range
    if (salaryMin || salaryMax) {
      query['salary.min'] = {};
      if (salaryMin) query['salary.min'].$gte = parseInt(salaryMin);
      if (salaryMax) query['salary.min'].$lte = parseInt(salaryMax);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName email role plan')
      .populate('applications.user', 'firstName lastName email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Additional filter: Remove jobs from expired Free plans
    if (!includeAll) {
      const now = new Date();
      jobs = jobs.filter(job => {
        const postedBy = job.postedBy;
        if (postedBy && postedBy.plan && postedBy.plan.name === 'Free') {
          // Check if Free plan has expired
          if (postedBy.plan.endDate && new Date(postedBy.plan.endDate) <= now) {
            return false; // Exclude expired Free plan jobs
          }
        }
        return true;
      });
    }

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName email role')
      .populate('applications.user', 'firstName lastName email avatar');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new job (Admin/Recruiter only)
const createJob = async (req, res) => {
  try {
    // Get user to check plan
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has Free plan, set expiration date for the job
    const jobData = {
      ...req.body,
      postedBy: req.user.id
    };

    // Store plan info with job for filtering expired Free plan jobs
    if (user.plan && user.plan.name === 'Free') {
      jobData.postedByPlan = {
        name: user.plan.name,
        startDate: user.plan.startDate,
        endDate: user.plan.endDate
      };
    }

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('postedBy', 'firstName lastName email');

    // Create notifications for users who have applied to similar jobs
    createJobNotification(job).catch(err => {
      console.error('Error creating notifications:', err);
      // Don't fail the job creation if notification fails
    });

    // Send job notification to newsletter subscribers (only for Active jobs)
    if (job.status === 'Active') {
      sendJobNotificationToSubscribers(populatedJob).catch(err => {
        console.error('Error sending job notifications to subscribers:', err);
        // Don't fail the job creation if email notification fails
      });
    }

    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update job (Admin/Recruiter only)
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to update this job
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'firstName lastName email');

    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete job (Admin/Recruiter only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to delete this job
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const jobId = req.params.id;
    const userId = req.user.id;

    // Validate required fields: cover letter/description and resume
    if (!coverLetter || !coverLetter.trim()) {
      return res.status(400).json({ message: 'Cover letter/description is required to apply.' });
    }

    // Check if resume file was uploaded
    let resumeToUse = null;
    let resumeUrl = null;
    let resumePublicId = null;
    
    if (req.file) {
      // Extract Cloudinary URL and public_id from multer-storage-cloudinary
      resumeUrl = req.file.path || req.file.url || req.file.secure_url;
      resumePublicId = req.file.public_id || req.file.filename;
      resumeToUse = req.file.filename || req.file.public_id; // Keep for backward compatibility
    } else {
      // Fallback to user's profile resume
      const applyingUser = await User.findById(userId);
      resumeToUse = applyingUser?.resume;
      // If user's resume is a Cloudinary URL, use it
      if (applyingUser?.resume && applyingUser.resume.startsWith('http')) {
        resumeUrl = applyingUser.resume;
      }
    }

    if (!resumeToUse && !resumeUrl) {
      return res.status(400).json({ message: 'Resume is required to apply. Please upload your resume.' });
    }

    const job = await Job.findById(jobId)
      .populate('postedBy', 'firstName lastName email company currentCompany role');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = job.applications.find(
      app => app.user.toString() === userId
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Add application to job with Cloudinary URL and public_id
    job.applications.push({
      user: userId,
      coverLetter,
      resume: resumeToUse, // Keep for backward compatibility
      resumeUrl: resumeUrl, // Cloudinary URL
      resumePublicId: resumePublicId, // Cloudinary public_id
      status: 'Applied'
    });

    await job.save();

    // Add job to user's applied jobs
    const updatedUser = await User.findByIdAndUpdate(userId, {
      $push: {
        appliedJobs: {
          job: jobId,
          status: 'Applied'
        }
      }
    }, { new: true });

    // Create notification for job poster (admin or recruiter)
    try {
      const applicantName = `${updatedUser?.firstName || ''} ${updatedUser?.lastName || ''}`.trim() || updatedUser?.email || 'A candidate';
      const jobPosterId = job.postedBy._id || job.postedBy;
      
      // Create notification for the job poster
      await Notification.create({
        user: jobPosterId,
        job: jobId,
        type: 'new_application',
        title: 'New Job Application',
        message: `${applicantName} has applied for your job posting "${job.title}" at ${job.company}.`
      });
    } catch (notifyErr) {
      console.error('Failed to create application notification:', notifyErr);
      // Don't fail the application because of notification issues
    }

    // Send email notification to employer/recruiter if email service is configured
    try {
      if (process.env.RESEND_API_KEY && job.postedBy?.email) {
        const transporter = createTransporter();

        const applicantName = `${updatedUser?.firstName || ''} ${updatedUser?.lastName || ''}`.trim() || updatedUser?.email || 'A candidate';
        const employerEmail = job.postedBy.email;

        const subject = `New application for ${job.title} at ${job.company}`;

        const jobLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/jobs/${job._id}`;

        const html = `
          <h2>New Job Application Received</h2>
          <p>Hello ${job.postedBy.firstName || 'Recruiter'},</p>
          <p>${applicantName} has applied for your job posting:</p>
          <ul>
            <li><strong>Job Title:</strong> ${job.title}</li>
            <li><strong>Company:</strong> ${job.company}</li>
            <li><strong>Location:</strong> ${job.location || 'Not specified'}</li>
          </ul>
          <p><strong>Cover Letter:</strong></p>
          <p>${coverLetter.replace(/\n/g, '<br/>')}</p>
          <p>You can view the full application and resume in your recruiter dashboard.</p>
          <p>
            <a href="${jobLink}" target="_blank" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              View Job & Applications
            </a>
          </p>
          <p style="margin-top:24px;font-size:12px;color:#6b7280;">This is an automated message from Staffdox.</p>
        `;

        const text = `New Job Application Received

${applicantName} has applied for your job posting:
- Job Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Not specified'}

Cover Letter:
${coverLetter}

View job and applications: ${jobLink}
`;

        await transporter.sendMail({
          to: employerEmail,
          subject,
          html,
          text
        });
      }
    } catch (emailError) {
      console.error('Failed to send employer application email:', emailError);
      // Do not fail the application because of email issues
    }

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's job applications
const getUserApplications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'appliedJobs.job',
        populate: {
          path: 'postedBy',
          select: 'firstName lastName email'
        }
      });

    // Filter out applications where the job has been deleted (null job)
    const validApplications = user.appliedJobs.filter(app => app.job !== null && app.job !== undefined);

    res.json(validApplications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get jobs posted by user (for recruiters/admins)
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('applications.user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update application status (for job posters)
const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId, status } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to update applications
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await job.save();

    // Update user's application status
    await User.updateOne(
      { 
        _id: application.user,
        'appliedJobs.job': jobId
      },
      {
        $set: {
          'appliedJobs.$.status': status
        }
      }
    );

    // Notify the applicant about the status change
    try {
      await Notification.create({
        user: application.user,
        job: job._id,
        type: 'status_change',
        title: 'Application status updated',
        message: `Your application for "${job.title}" at ${job.company} is now "${status}".`
      });
    } catch (notifyErr) {
      console.error('Failed to create status change notification:', notifyErr);
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get job statistics (for admins)
const getJobStats = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const totalApplications = await Job.aggregate([
      { $unwind: '$applications' },
      { $count: 'total' }
    ]);

    const categoryStats = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalJobs,
      activeJobs,
      totalApplications: totalApplications[0]?.total || 0,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
