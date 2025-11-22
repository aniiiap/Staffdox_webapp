const express = require('express');
const router = express.Router();
const { generateAndSendOTP, verifyOTP } = require('../controllers/otpController');
const { otpLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/generate', otpLimiter, generateAndSendOTP);
router.post('/verify', otpLimiter, verifyOTP);

module.exports = router;

