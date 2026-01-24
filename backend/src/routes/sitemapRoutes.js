const express = require('express');
const router = express.Router();
const { generateSitemap, generateRobotsTxt } = require('../controllers/sitemapController');

// Public routes - no authentication required
// These routes work both at root level and under /api for frontend proxying
router.get('/sitemap.xml', generateSitemap);
router.get('/robots.txt', generateRobotsTxt);
router.get('/sitemap', generateSitemap); // Alternative route for frontend proxy
router.get('/robots', generateRobotsTxt); // Alternative route for frontend proxy

module.exports = router;

