const mongoose = require('mongoose');

const cvUploadSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true // in bytes
  },
  mimeType: {
    type: String,
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CvFolder',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional metadata
  candidateName: {
    type: String,
    trim: true
  },
  candidateEmail: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  commentReason: {
    type: String,
    trim: true
  },
  commentDescription: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
cvUploadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
cvUploadSchema.index({ folder: 1 });
cvUploadSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('CvUpload', cvUploadSchema);

