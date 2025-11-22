const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

// Create payment order
router.post('/payments/create-order', authenticate, createOrder);

// Verify payment
router.post('/payments/verify', authenticate, verifyPayment);

module.exports = router;

