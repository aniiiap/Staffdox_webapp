const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getSubscribers } = require('../controllers/newsletterController');
const auth = require('../middleware/auth');

// Public routes
router.post('/subscribe', subscribe);
router.get('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', auth, getSubscribers);

module.exports = router;

