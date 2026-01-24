const express = require('express');
const router = express.Router();
const { generateSitemap, generateRobotsTxt } = require('../controllers/sitemapController');

// Public routes - no authentication required
router.get('/sitemap.xml', generateSitemap);
router.get('/robots.txt', generateRobotsTxt);

module.exports = router;

