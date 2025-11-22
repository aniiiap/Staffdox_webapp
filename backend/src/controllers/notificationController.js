const Notification = require('../models/Notification');
const User = require('../models/User');
const Job = require('../models/Job');

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('job', 'title company location category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all notifications for a user
const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notification for users (helper function, called from job controller)
const createJobNotification = async (job) => {
  try {
    // Only notify for Active jobs
    if (job.status !== 'Active') {
      return 0;
    }

    // Find all users who have applied to jobs
    const usersWithApplications = await User.find({
      'appliedJobs': { $exists: true, $ne: [] }
    }).select('_id appliedJobs');

    const targetCategory = job.category;
    const notifiedUserIds = new Set();
    const notificationPromises = [];

    // Get all job IDs that users have applied to
    const appliedJobIds = [];
    usersWithApplications.forEach(user => {
      user.appliedJobs.forEach(appliedJob => {
        if (appliedJob.job && !appliedJobIds.includes(appliedJob.job.toString())) {
          appliedJobIds.push(appliedJob.job.toString());
        }
      });
    });

    // Get all those jobs with their categories
    const appliedJobs = await Job.find({
      _id: { $in: appliedJobIds }
    }).select('category');

    // Create a map of jobId -> category
    const jobCategoryMap = {};
    appliedJobs.forEach(j => {
      jobCategoryMap[j._id.toString()] = j.category;
    });

    // Find users who applied to jobs in the same category
    for (const user of usersWithApplications) {
      let hasAppliedToSimilarCategory = false;

      for (const appliedJob of user.appliedJobs) {
        const jobId = appliedJob.job?.toString() || appliedJob.job;
        const jobCategory = jobCategoryMap[jobId];
        
        if (jobCategory === targetCategory) {
          hasAppliedToSimilarCategory = true;
          break;
        }
      }

      // Don't notify if user already applied to this job
      const hasAppliedToThisJob = user.appliedJobs.some(
        appliedJob => {
          const jobId = appliedJob.job?.toString() || appliedJob.job;
          return jobId === job._id.toString();
        }
      );

      if (hasAppliedToSimilarCategory && !hasAppliedToThisJob && !notifiedUserIds.has(user._id.toString())) {
        notificationPromises.push(
          Notification.create({
            user: user._id,
            job: job._id,
            type: 'new_job',
            title: 'New Job Opportunity',
            message: `A new ${job.category} position "${job.title}" at ${job.company} has been posted that matches your interests!`
          })
        );
        notifiedUserIds.add(user._id.toString());
      }
    }

    await Promise.all(notificationPromises);
    return notifiedUserIds.size;
  } catch (error) {
    console.error('Error creating job notifications:', error);
    return 0;
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createJobNotification
};
