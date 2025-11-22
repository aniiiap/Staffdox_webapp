// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },       // for email/pass users
  googleId: { type: String },           // for Google users
  linkedinId: { type: String },         // for LinkedIn users
  avatar: { type: String },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'recruiter'] },
  
  // Professional Information
  phone: { type: String },
  location: { type: String },
  currentPosition: { type: String },
  currentCompany: { type: String },
  experience: { type: Number, default: 0 }, // years of experience
  skills: [{ type: String, trim: true }],
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: Number },
    field: { type: String }
  }],
  workExperience: [{
    company: { type: String },
    position: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
  }],
  
  // Job Preferences
  jobPreferences: {
    preferredLocations: [{ type: String }],
    preferredJobTypes: [{ 
      type: String, 
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'] 
    }],
    expectedSalary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    preferredIndustries: [{ type: String }],
    availability: { type: String, enum: ['Immediate', '2 weeks', '1 month', '2 months', '3+ months'] }
  },
  
  // Profile Status
  profileCompleteness: { type: Number, default: 0 }, // percentage
  resume: { type: String }, // Cloudinary URL
  resumeCloudinaryPublicId: { type: String }, // Cloudinary public_id for deletion
  linkedinProfile: { type: String },
  portfolio: { type: String },
  
  // Application tracking
  appliedJobs: [{ 
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    appliedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'],
      default: 'Applied'
    }
  }],
  
  // Account status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  
  // Employer/Recruiter Plan (for recruiters only)
  plan: {
    name: { type: String, enum: ['Free', 'Starter', 'Professional', 'Enterprise', null], default: null },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  
  // Password reset
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordResetUsed: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate profile completeness
userSchema.methods.calculateProfileCompleteness = function() {
  let score = 0;
  const fields = [
    'firstName', 'lastName', 'phone', 'location', 'currentPosition',
    'skills', 'education', 'workExperience', 'resume'
  ];
  
  fields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : this[field])) {
      score += 1;
    }
  });
  
  this.profileCompleteness = Math.round((score / fields.length) * 100);
  return this.profileCompleteness;
};

module.exports = mongoose.model('User', userSchema);
