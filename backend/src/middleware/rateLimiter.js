const rateLimit = require('express-rate-limit');

// General API rate limiter (more lenient for browsing)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (increased for browsing)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health' || req.originalUrl === '/health') return true;
    // Skip rate limiting for job search routes (public browsing)
    // req.path is relative to the mounted path, so it's '/jobs' not '/api/jobs'
    if ((req.path.startsWith('/jobs') || req.originalUrl.startsWith('/api/jobs')) && ['GET'].includes(req.method)) {
      return true;
    }
    // Skip rate limiting for user profile endpoint (frequently accessed)
    if ((req.path === '/user/me' || req.originalUrl === '/api/user/me') && ['GET'].includes(req.method)) {
      return true;
    }
    return false;
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP generation (more lenient for registration)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow more OTP attempts within the window
  message: 'Too many OTP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production' // Skip limiter entirely in development
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter
};

