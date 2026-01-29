const Blog = require('../models/Blog');
const BlogView = require('../models/BlogView');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendBlogNotificationToUsers } = require('../utils/emailService');

// Get all published blogs (public)
exports.getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, tag, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { published: true };
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName email avatar')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Don't send full content in listing
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all blogs (admin only - includes unpublished)
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    
    if (status === 'published') {
      query.published = true;
    } else if (status === 'draft') {
      query.published = false;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single blog by ID or slug
// - Published blogs: visible to everyone
// - Draft blogs: visible only to admins (based on JWT token if provided)
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    // If it's a valid ObjectId, search by _id, otherwise treat it as a slug
    const query = isObjectId ? { _id: id } : { slug: id };

    console.log('getBlogById - Looking for blog with query:', query);

    const blog = await Blog.findOne(query)
      .populate('author', 'firstName lastName email avatar');

    if (!blog) {
      console.log('getBlogById - Blog not found with query:', query);
      return res.status(404).json({ message: 'Blog not found' });
    }

    console.log('getBlogById - Blog found:', { 
      id: blog._id, 
      slug: blog.slug, 
      published: blog.published,
      title: blog.title 
    });

    // Try to identify current user (optional) from Authorization header
    let currentUserRole = null;
    let currentUserId = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log('getBlogById - Auth header present:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role');
        if (user) {
          currentUserRole = user.role;
          currentUserId = user._id;
          console.log('getBlogById - User role:', currentUserRole);
        }
      } catch (err) {
        // Silent fail – treat as anonymous user
        console.warn('getBlogById token decode failed:', err.message);
      }
    }

    // Draft blogs should only be visible to admins
    if (!blog.published && currentUserRole !== 'admin') {
      console.log('getBlogById - Draft blog access denied. Published:', blog.published, 'User role:', currentUserRole);
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Track genuine views for published blogs only
    // Wrap in try-catch to ensure view tracking errors don't break blog viewing
    if (blog.published) {
      try {
        // Get IP address - works with trust proxy setting (req.ip handles x-forwarded-for automatically)
        // Fallback chain for different deployment scenarios (production behind Nginx/Cloudflare/etc)
        // Extract the first IP from x-forwarded-for (handles multiple proxies)
        let ipAddress = req.ip || 'unknown';
        
        // If req.ip is not available or is IPv6 loopback, try headers
        if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === '::ffff:127.0.0.1') {
          const forwardedFor = req.headers['x-forwarded-for'];
          if (forwardedFor) {
            // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
            // The first one is usually the original client IP
            ipAddress = forwardedFor.split(',')[0].trim();
          } else if (req.headers['x-real-ip']) {
            ipAddress = req.headers['x-real-ip'];
          } else if (req.connection?.remoteAddress) {
            ipAddress = req.connection.remoteAddress;
          } else if (req.socket?.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
          }
        }
        
        // Normalize IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
        if (ipAddress && ipAddress.startsWith('::ffff:')) {
          ipAddress = ipAddress.substring(7);
        }
        
        // Get user agent
        const userAgent = req.headers['user-agent'] || '';

        // Check if this is a genuine new view (prevent duplicate views within 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        let isNewView = false;
        if (currentUserId) {
          // For logged-in users: check if they viewed this blog in the last hour
          const recentView = await BlogView.findOne({
            blog: blog._id,
            user: currentUserId,
            viewedAt: { $gte: oneHourAgo }
          });
          isNewView = !recentView;
        } else {
          // For anonymous users: check if same IP viewed this blog in the last hour
          const recentView = await BlogView.findOne({
            blog: blog._id,
            user: null,
            ipAddress: ipAddress,
            viewedAt: { $gte: oneHourAgo }
          });
          isNewView = !recentView;
        }

        // Only track if it's a genuine new view
        if (isNewView) {
          // Create view record first (for data consistency)
          await BlogView.create({
            blog: blog._id,
            user: currentUserId,
            ipAddress: ipAddress,
            userAgent: userAgent
          });

          // Then increment view count on blog
          blog.views += 1;
          await blog.save();
        }
      } catch (error) {
        // Log error but don't throw - view tracking failures shouldn't prevent blog viewing
        // This ensures the blog page still loads even if view tracking has issues
        console.error('Error tracking blog view (non-critical):', error.message);
        // Still return the blog even if view tracking failed
      }
    }

    res.json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create blog (admin only)
exports.createBlog = async (req, res) => {
  try {
    console.log('Create blog request body:', req.body);
    console.log('Create blog request file:', req.file);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, excerpt, tags, category, published, metaDescription, readTime } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Generate slug from title
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure slug is unique
    let slugExists = await Blog.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${slug}-${counter}`;
      slugExists = await Blog.findOne({ slug });
      counter++;
    }
    
    const blogData = {
      title,
      slug,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 300).trim(),
      author: req.user._id,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map(t => t.trim()) : [],
      category: category || 'Other',
      published: published === true || published === 'true',
      metaDescription,
      readTime: readTime || undefined
    };
    
    // Handle featured image if uploaded
    if (req.file) {
      // multer-storage-cloudinary returns file info in req.file
      // Check what properties are available
      console.log('Uploaded file object:', JSON.stringify(req.file, null, 2));
      blogData.featuredImage = req.file.path || req.file.url || req.file.secure_url;
      blogData.featuredImagePublicId = req.file.public_id || req.file.filename;
      
      if (!blogData.featuredImage) {
        console.error('Failed to get image URL from req.file:', req.file);
        return res.status(500).json({ message: 'Failed to get image URL from uploaded file' });
      }
    }
    
    console.log('Creating blog with data:', blogData);
    const blog = await Blog.create(blogData);
    
    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'firstName lastName email');
    
    // Send email notifications to all users if blog is published
    // Do this asynchronously so it doesn't block the response
    if (blog.published) {
      sendBlogNotificationToUsers(populatedBlog)
        .then(result => {
          console.log('Blog notification result:', result);
        })
        .catch(error => {
          console.error('Error sending blog notifications (non-blocking):', error);
        });
    }
    
    res.status(201).json({ blog: populatedBlog });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update blog (admin only)
exports.updateBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { title, content, excerpt, tags, category, published, metaDescription, readTime } = req.body;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Update fields
    if (title) {
      blog.title = title;
      // Regenerate slug if title changed
      if (title !== blog.title) {
        let slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Check if new slug is unique (excluding current blog)
        let slugExists = await Blog.findOne({ slug, _id: { $ne: id } });
        let counter = 1;
        while (slugExists) {
          slug = `${slug}-${counter}`;
          slugExists = await Blog.findOne({ slug, _id: { $ne: id } });
          counter++;
        }
        blog.slug = slug;
      }
    }
    
    if (content) blog.content = content;
    if (excerpt) blog.excerpt = excerpt;
    if (tags) blog.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (category) blog.category = category;
    if (metaDescription) blog.metaDescription = metaDescription;
    // Handle readTime - allow clearing it by sending empty string
    if (readTime !== undefined) {
      const trimmedReadTime = readTime ? readTime.trim() : '';
      blog.readTime = trimmedReadTime || null; // Set to null to clear the field
    }
    
    // Handle published status - track if blog was just published
    let wasJustPublished = false;
    if (published !== undefined) {
      const wasPublishedBefore = blog.published;
      blog.published = published === true || published === 'true';
      
      // Check if blog was just published (was draft, now published)
      wasJustPublished = !wasPublishedBefore && blog.published;
      
      // Set publishedAt when publishing for the first time
      if (wasJustPublished && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    
    // Handle featured image update if new file uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (blog.featuredImagePublicId) {
        const cloudinary = require('../config/cloudinary');
        try {
          await cloudinary.uploader.destroy(blog.featuredImagePublicId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      // multer-storage-cloudinary returns file info in req.file
      blog.featuredImage = req.file.path || req.file.url;
      blog.featuredImagePublicId = req.file.filename || req.file.public_id;
    }
    
    await blog.save();
    
    const updatedBlog = await Blog.findById(blog._id)
      .populate('author', 'firstName lastName email');
    
    // Send email notifications if blog was just published (was draft, now published)
    if (wasJustPublished) {
      sendBlogNotificationToUsers(updatedBlog)
        .then(result => {
          console.log(`Blog notification sent to ${result.sent || 0} users. Failed: ${result.failed || 0}`);
        })
        .catch(error => {
          console.error('Error sending blog notifications (non-blocking):', error);
        });
    }
    
    res.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete blog (admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Delete featured image from Cloudinary if exists
    if (blog.featuredImagePublicId) {
      const cloudinary = require('../config/cloudinary');
      try {
        await cloudinary.uploader.destroy(blog.featuredImagePublicId);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    await Blog.findByIdAndDelete(id);
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get blog stats (admin only)
exports.getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ published: true });
    const draftBlogs = await Blog.countDocuments({ published: false });
    const totalViews = await Blog.aggregate([
      { $match: { published: true } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    const categoryStats = await Blog.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews: totalViews[0]?.total || 0,
      categoryStats
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get blog views/analytics (admin only)
// Shows who viewed which blogs
exports.getBlogViews = async (req, res) => {
  try {
    const { blogId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (blogId) {
      query.blog = blogId;
    }

    const views = await BlogView.find(query)
      .populate('blog', 'title slug')
      .populate('user', 'firstName lastName email avatar')
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlogView.countDocuments(query);

    // Get unique viewers count
    const uniqueViewers = await BlogView.distinct('user', query);
    const uniqueViewersCount = uniqueViewers.filter(id => id !== null).length;
    const anonymousViewsCount = await BlogView.countDocuments({ ...query, user: null });

    res.json({
      views,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
      uniqueViewersCount,
      anonymousViewsCount
    });
  } catch (error) {
    console.error('Get blog views error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get views for a specific blog (admin only)
exports.getBlogViewsByBlogId = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if id is ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const blogQuery = isObjectId ? { _id: id } : { slug: id };
    
    const blog = await Blog.findOne(blogQuery);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const views = await BlogView.find({ blog: blog._id })
      .populate('user', 'firstName lastName email avatar')
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlogView.countDocuments({ blog: blog._id });

    // Get unique viewers count for this blog
    const uniqueViewers = await BlogView.distinct('user', { blog: blog._id });
    const uniqueViewersCount = uniqueViewers.filter(id => id !== null).length;
    const anonymousViewsCount = await BlogView.countDocuments({ blog: blog._id, user: null });

    res.json({
      blog: {
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        views: blog.views
      },
      views,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
      uniqueViewersCount,
      anonymousViewsCount
    });
  } catch (error) {
    console.error('Get blog views by blog ID error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Upload image for blog content (admin only)
exports.uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Cloudinary upload is handled by middleware, so we just return the URL
    // multer-storage-cloudinary returns file info in req.file
    const imageUrl = req.file.path || req.file.url || req.file.secure_url;

    if (!imageUrl) {
      return res.status(500).json({ message: 'Failed to get image URL from uploaded file' });
    }

    res.json({ 
      url: imageUrl,
      public_id: req.file.public_id || req.file.filename
    });
  } catch (error) {
    console.error('Upload blog image error:', error);
    res.status(500).json({ message: error.message });
  }
};
