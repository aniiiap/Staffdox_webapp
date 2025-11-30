const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  company: { 
    type: String, 
    required: true,
    trim: true 
  },
  location: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  employmentType: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time'
  },
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  skills: [{
    type: String,
    trim: true
  }],
  category: { 
    type: String, 
    required: true,
    enum: [
      'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales', 
      'Human Resources', 'Operations', 'Design', 'Education', 'Other'
    ]
  },
  industry: { 
    type: String,
    enum: [
      'Technology & Telecoms', 'Banking & Financial Services', 'Healthcare & Life Sciences',
      'FMCG', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Other'
    ]
  },
  status: { 
    type: String, 
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  },
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  postedByPlan: {
    name: { type: String, enum: ['Free', 'Starter', 'Professional', 'Enterprise'] },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  applications: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'],
      default: 'Applied'
    },
    coverLetter: { type: String },
    resume: { type: String }, // Keep for backward compatibility (filename/public_id)
    resumeUrl: { type: String }, // Cloudinary URL
    resumePublicId: { type: String } // Cloudinary public_id for deletion
  }],
  deadline: { type: Date },
  isRemote: { type: Boolean, default: false },
  benefits: [{
    type: String,
    trim: true
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search functionality
jobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });
jobSchema.index({ category: 1, location: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
