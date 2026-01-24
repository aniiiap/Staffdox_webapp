const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const {
  getBlogs,
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogStats,
  getBlogViews,
  getBlogViewsByBlogId
} = require('../controllers/blogController');

// Validation middleware
const blogValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').optional().isLength({ max: 300 }).withMessage('Excerpt must be less than 300 characters'),
  body('metaDescription').optional().isLength({ max: 160 }).withMessage('Meta description must be less than 160 characters')
];

// Public routes - anyone can view published blogs
router.get('/', getBlogs);
router.get('/stats', getBlogStats); // Public stats (only published blogs)
router.get('/:id', getBlogById); // Public blog detail (must be before /admin routes)

// Protected routes - require authentication
router.use(auth);

// Admin-only routes
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Admin routes for blog management
router.get('/admin/all', requireAdmin, getAllBlogs);
router.get('/admin/stats', requireAdmin, getBlogStats);
router.get('/admin/views', requireAdmin, getBlogViews); // Get all blog views
router.get('/admin/views/:id', requireAdmin, getBlogViewsByBlogId); // Get views for specific blog
router.post('/admin', requireAdmin, uploadImage.single('featuredImage'), blogValidation, createBlog);
router.put('/admin/:id', requireAdmin, uploadImage.single('featuredImage'), blogValidation, updateBlog);
router.delete('/admin/:id', requireAdmin, deleteBlog);

module.exports = router;

