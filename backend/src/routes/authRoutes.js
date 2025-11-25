const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const SalesEnquiry = require('../models/SalesEnquiry');
const OTP = require('../models/OTP');
const { sendWelcomeEmail, sendEmployerWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Register (email/password)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ email, passwordHash, firstName, lastName });
    await user.save();

    // Send welcome email (non-blocking - don't fail registration if email fails)
    sendWelcomeEmail(user.email, user.firstName, user.lastName)
      .then(result => {
        if (result.success) {
          console.log(`Welcome email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send welcome email to ${user.email}:`, result.message);
        }
      })
      .catch(err => {
        console.error('Error in welcome email send:', err);
      });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName } });
  } catch(err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (email/password)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName } });
  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth - start
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth - callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  try {
    // user available at req.user
    if (!req.user) {
      console.error('Google OAuth callback: No user found');
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }
    
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // redirect to client with token in query
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const redirectUrl = `${clientUrl}/oauth-callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=oauth_error`);
  }
});


// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['profile', 'email'] }));

router.get('/linkedin/callback', 
  passport.authenticate('linkedin', { session: true, failureRedirect: '/login' }),
  (req, res) => {
    try {
      if (!req.user) {
        console.error('LinkedIn OAuth callback: No user found');
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/login?error=oauth_failed`);
      }
      
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = `${clientUrl}/oauth-callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('LinkedIn OAuth callback error:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/login?error=oauth_error`);
    }
  }
);

// Employer registration with OTP verification
router.post('/employer/register', async (req, res) => {
  try {
    const {
      mobile,
      mobileOTP,
      firstName,
      lastName,
      email,
      emailOTP,
      password,
      hiringFor, // 'company' or 'consultancy'
      companyName,
      designation,
      companySize,
      pincode,
      companyAddress
    } = req.body;

    // Validate required fields
    if (!mobile || !mobileOTP || !firstName || !lastName || !email || !emailOTP || !password) {
      return res.status(400).json({ message: 'All basic details are required' });
    }

    if (!hiringFor || !companyName || !designation || !companySize || !pincode || !companyAddress) {
      return res.status(400).json({ message: 'All company details are required' });
    }

    // Verify mobile OTP (check both verified and unverified)
    const mobileOTPRecord = await OTP.findOne({
      identifier: mobile,
      type: 'mobile',
      purpose: 'registration'
    }).sort({ createdAt: -1 });

    if (!mobileOTPRecord) {
      return res.status(400).json({ message: 'Mobile OTP not found. Please request a new OTP.' });
    }

    if (new Date() > mobileOTPRecord.expiresAt) {
      return res.status(400).json({ message: 'Mobile OTP has expired. Please request a new one.' });
    }

    // If not already verified, verify it now
    if (!mobileOTPRecord.verified) {
      if (mobileOTPRecord.otp !== mobileOTP) {
        mobileOTPRecord.attempts += 1;
        await mobileOTPRecord.save();
        return res.status(400).json({ message: 'Invalid mobile OTP' });
      }
      mobileOTPRecord.verified = true;
      await mobileOTPRecord.save();
    }

    // Verify email OTP (check both verified and unverified)
    const emailOTPRecord = await OTP.findOne({
      identifier: email.toLowerCase(),
      type: 'email',
      purpose: 'registration'
    }).sort({ createdAt: -1 });

    if (!emailOTPRecord) {
      return res.status(400).json({ message: 'Email OTP not found. Please request a new OTP.' });
    }

    if (new Date() > emailOTPRecord.expiresAt) {
      return res.status(400).json({ message: 'Email OTP has expired. Please request a new one.' });
    }

    // If not already verified, verify it now
    if (!emailOTPRecord.verified) {
      if (emailOTPRecord.otp !== emailOTP) {
        emailOTPRecord.attempts += 1;
        await emailOTPRecord.save();
        return res.status(400).json({ message: 'Invalid email OTP' });
      }
      emailOTPRecord.verified = true;
      await emailOTPRecord.save();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone: mobile,
      role: 'recruiter', // Auto-assign recruiter role
      currentCompany: companyName,
      currentPosition: designation
    });
    await user.save();

    // Create sales enquiry (auto-approved since we're creating the account)
    const salesEnquiry = new SalesEnquiry({
      user: user._id,
      contactName: `${firstName} ${lastName}`,
      contactPhone: mobile,
      designation,
      companyName,
      companyEmail: email.toLowerCase(),
      companySize,
      city: companyAddress.split(',')[0] || '', // Extract city from address
      status: 'approved' // Auto-approve since they registered through employer portal
    });
    await salesEnquiry.save();

    // Send employer welcome email
    sendEmployerWelcomeEmail(user.email, user.firstName, user.lastName, companyName)
      .catch(err => console.error('Error sending employer welcome email:', err));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      message: 'Employer account created successfully'
    });
  } catch (error) {
    console.error('Employer registration error:', error);
    res.status(500).json({ message: 'Failed to create employer account' });
  }
});

// Login by phone (after OTP verification)
router.post('/login-by-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const cleanedPhone = phone.replace(/[\s-()]/g, '');
    
    // Find user by phone
    const user = await User.findOne({ 
      phone: cleanedPhone,
      role: 'recruiter'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this phone number' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login by phone error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

// Employer login
router.post('/employer/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is a recruiter or admin
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. This portal is for employers only.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Employer login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Send reset link (for employers)
router.post('/employer/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email (only recruiters and admins)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      role: { $in: ['recruiter', 'admin'] }
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        message: 'This email is not registered. Please check your email address or register for a new account.' 
      });
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'This account was created using social login. Please use the same method to sign in.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    user.passwordResetUsed = false;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=employer`;

    // Send email (non-blocking) - isEmployer = true for employer endpoint
    sendPasswordResetEmail(user.email, resetLink, true)
      .then(result => {
        if (result.success) {
          console.log(`Password reset email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send password reset email to ${user.email}:`, result.message);
        }
      })
      .catch(err => {
        console.error('Error in password reset email send:', err);
      });

    res.json({ 
      message: 'Password reset link has been sent to your email address.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Send reset link (for regular users)
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email (all users)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim()
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        message: 'This email is not registered. Please check your email address or register for a new account.' 
      });
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'This account was created using social login. Please use the same method to sign in.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    user.passwordResetUsed = false;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=user`;

    // Send email (non-blocking) - isEmployer = false for regular user endpoint
    sendPasswordResetEmail(user.email, resetLink, false)
      .then(result => {
        if (result.success) {
          console.log(`Password reset email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send password reset email to ${user.email}:`, result.message);
        }
      })
      .catch(err => {
        console.error('Error in password reset email send:', err);
      });

    res.json({ 
      message: 'Password reset link has been sent to your email address.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset Token
router.get('/employer/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      passwordResetUsed: false
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'This reset link has expired or has already been used. Please request a new password reset.' 
      });
    }

    res.json({ email: user.email });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset Token (for all users)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      passwordResetUsed: false
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'This reset link has expired or has already been used. Please request a new password reset.' 
      });
    }

    res.json({ email: user.email });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password (for employers)
router.post('/employer/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      passwordResetUsed: false
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'This reset link has expired or has already been used. Please request a new password reset.' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and invalidate reset token
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetUsed = true;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password (for all users)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      passwordResetUsed: false
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'This reset link has expired or has already been used. Please request a new password reset.' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and invalidate reset token
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetUsed = true;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
