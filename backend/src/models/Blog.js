const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  slug: { 
    type: String, 
    required: true,
    unique: true,
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  excerpt: { 
    type: String,
    maxlength: 300
  },
  featuredImage: { 
    type: String // Cloudinary URL
  },
  featuredImagePublicId: {
    type: String // Cloudinary public_id for deletion
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: [
      'Career Tips', 'Industry News', 'Job Search', 'Interview Tips', 
      'Resume Writing', 'Professional Development', 'Company Culture', 'Other'
    ],
    default: 'Other'
  },
  published: { 
    type: Boolean, 
    default: false 
  },
  publishedAt: { 
    type: Date 
  },
  views: { 
    type: Number, 
    default: 0 
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  readTime: {
    type: String,
    trim: true,
    maxlength: 50, // e.g., "5 min read", "10 minutes", etc.
    default: null // Allow null to clear the field
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 300)
      .trim();
  }
  
  // Set publishedAt when published is set to true
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Index for search functionality
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ published: 1, publishedAt: -1 });
blogSchema.index({ category: 1, published: 1 });

module.exports = mongoose.model('Blog', blogSchema);

