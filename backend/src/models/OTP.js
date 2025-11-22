const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mobile', 'email'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password_reset', 'payment'],
    default: 'registration'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for cleanup
otpSchema.index({ identifier: 1, type: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);

