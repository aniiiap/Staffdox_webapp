const mongoose = require('mongoose');

const blogViewSchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for anonymous users
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate views from same user/IP within 1 hour
blogViewSchema.index({ blog: 1, user: 1, viewedAt: -1 });
blogViewSchema.index({ blog: 1, ipAddress: 1, viewedAt: -1 });

// Index for analytics queries
blogViewSchema.index({ blog: 1, viewedAt: -1 });
blogViewSchema.index({ user: 1, viewedAt: -1 });

module.exports = mongoose.model('BlogView', blogViewSchema);

