const OTP = require('../models/OTP');
const User = require('../models/User');
const crypto = require('crypto');

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP via SMS
const sendSMS = async (mobile, otp) => {
  try {
    // Check if Twilio is configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const message = await client.messages.create({
          body: `Your Staffdox verification code is: ${otp}. This code will expire in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${mobile}` // Assuming Indian numbers, adjust country code as needed
        });
        
        console.log(`SMS sent via Twilio to ${mobile}, SID: ${message.sid}`);
        return { success: true, messageId: message.sid };
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        // Fall through to other methods or dev mode
      }
    }
    
    // Check if MSG91 is configured (popular in India)
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID) {
      const https = require('https');
      const querystring = require('querystring');
      
      const postData = querystring.stringify({
        authkey: process.env.MSG91_AUTH_KEY,
        mobiles: `91${mobile}`,
        message: `Your Staffdox verification code is: ${otp}. This code will expire in 10 minutes.`,
        sender: process.env.MSG91_SENDER_ID,
        route: '4' // Transactional route
      });
      
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.msg91.com',
          port: 443,
          path: '/api/sendhttp.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`SMS sent via MSG91 to ${mobile}, Response: ${data}`);
            resolve({ success: true, response: data });
          });
        });
        
        req.on('error', (error) => {
          console.error('MSG91 SMS error:', error);
          reject({ success: false, error: error.message });
        });
        
        req.write(postData);
        req.end();
      });
    }
    
    // Fallback: Log OTP for development/testing
    console.log(`[DEV MODE] SMS OTP to ${mobile}: ${otp}`);
    console.log('Note: Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER or MSG91_AUTH_KEY, MSG91_SENDER_ID in .env to enable real SMS');
    return { success: true };
  } catch (error) {
    console.error('SMS sending error:', error);
    // Even if SMS fails, we can still return success in dev mode and log the OTP
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] SMS OTP to ${mobile}: ${otp}`);
      return { success: true };
    }
    return { success: false, error: error.message };
  }
};

// Send OTP via Email
const sendEmailOTP = async (email, otp) => {
  try {
    const { createTransporter } = require('../utils/emailService');
    
    // In development, if email is not configured, just log and return success
    if (!process.env.RESEND_API_KEY) {
      console.log(`[DEV MODE] Email OTP to ${email}: ${otp}`);
      return { success: true };
    }

    const emailUser = process.env.EMAIL_USER || 'info@staffdox.co.in';
    console.log(`Sending OTP email from: ${emailUser}`); // Debug log
    
    const transporter = createTransporter();
    const mailOptions = {
      from: `Staffdox <${emailUser}>`,
      to: email,
      subject: 'Your Staffdox Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        </div>
      `,
      text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email OTP sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    // In development mode, still return success if email service fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV MODE] Email service error, but continuing. Email OTP to ${email}: ${otp}`);
      return { success: true };
    }
    return { success: false, error: error.message };
  }
};

// Generate and send OTP
const generateAndSendOTP = async (req, res) => {
  try {
    const { identifier, type, purpose = 'registration' } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({ message: 'Identifier and type are required' });
    }

    if (!['mobile', 'email'].includes(type)) {
      return res.status(400).json({ message: 'Type must be mobile or email' });
    }

    // Clean identifier for mobile type to match what we'll save
    const cleanedIdentifier = type === 'mobile' ? identifier.replace(/[\s-]/g, '') : identifier;

    // Validate format
    if (type === 'mobile') {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(cleanedIdentifier)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
      }
      
      // For payment purpose, check if user exists
      if (purpose === 'payment') {
        try {
          // Try to find user with exact phone match
          let user = await User.findOne({ 
            phone: cleanedIdentifier,
            role: 'recruiter'
          });
          
          // If not found, try with different phone formats (with/without country code)
          if (!user) {
            user = await User.findOne({ 
              $or: [
                { phone: cleanedIdentifier },
                { phone: `+91${cleanedIdentifier}` },
                { phone: `91${cleanedIdentifier}` }
              ],
              role: 'recruiter'
            });
          }
          
          if (!user) {
            return res.status(404).json({ 
              message: 'This mobile number is not registered. Please register first.',
              userNotFound: true
            });
          }
        } catch (dbError) {
          console.error('Database error checking user:', dbError);
          console.error('Error details:', dbError.stack);
          return res.status(500).json({ 
            message: 'Error checking user registration. Please try again.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
      }
      
      // For registration purpose, check if mobile number is already registered
      if (purpose === 'registration' && type === 'mobile') {
        try {
          // Try to find user with exact phone match
          let existingUser = await User.findOne({ 
            phone: cleanedIdentifier,
            role: 'recruiter'
          });
          
          // If not found, try with different phone formats (with/without country code)
          if (!existingUser) {
            existingUser = await User.findOne({ 
              $or: [
                { phone: cleanedIdentifier },
                { phone: `+91${cleanedIdentifier}` },
                { phone: `91${cleanedIdentifier}` }
              ],
              role: 'recruiter'
            });
          }
          
          if (existingUser) {
            return res.status(400).json({ 
              message: 'This mobile number is already registered. Please use a different number or login instead.',
              userExists: true
            });
          }
        } catch (dbError) {
          console.error('Database error checking existing user:', dbError);
          console.error('Error details:', dbError.stack);
          return res.status(500).json({ 
            message: 'Error checking user registration. Please try again.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
      }
    } else if (type === 'email') {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(cleanedIdentifier)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // For registration purpose, check if email is already registered
      if (purpose === 'registration') {
        try {
          const existingUser = await User.findOne({ 
            email: cleanedIdentifier.toLowerCase(),
            role: 'recruiter'
          });
          
          if (existingUser) {
            return res.status(400).json({ 
              message: 'This email is already registered. Please use a different email or login instead.',
              userExists: true
            });
          }
        } catch (dbError) {
          console.error('Database error checking existing email:', dbError);
          console.error('Error details:', dbError.stack);
          return res.status(500).json({ 
            message: 'Error checking email registration. Please try again.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
      }
    }

    // Delete any existing OTPs for this identifier
    await OTP.deleteMany({ identifier: cleanedIdentifier, type, purpose });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    const otpRecord = new OTP({
      identifier: cleanedIdentifier,
      otp,
      type,
      purpose,
      expiresAt
    });
    await otpRecord.save();

    // Send OTP
    let sendResult = { success: false };
    let smsServiceConfigured = false;
    try {
      if (type === 'mobile') {
        // Check if SMS service is configured
        smsServiceConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) ||
                                !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID);
        sendResult = await sendSMS(cleanedIdentifier, otp);
      } else {
        smsServiceConfigured = !!process.env.EMAIL_PASSWORD;
        sendResult = await sendEmailOTP(cleanedIdentifier, otp);
      }
    } catch (sendError) {
      console.error('Error sending OTP:', sendError);
      sendResult = { success: false, error: sendError.message };
    }

    // In development mode, always succeed (OTP is logged/returned in response)
    // In production, require successful send
    if (process.env.NODE_ENV === 'production') {
      if (!sendResult || !sendResult.success) {
        console.error('OTP send failed in production:', sendResult);
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(500).json({ 
          message: 'Failed to send OTP. Please check your email/SMS service configuration.',
          error: sendResult?.error || 'Unknown error'
        });
      }
    } else {
      // Development mode: always succeed, even if email/SMS service fails
      if (!sendResult || !sendResult.success) {
        console.warn(`[DEV MODE] OTP send service failed, but continuing. ${type === 'mobile' ? 'SMS' : 'Email'} OTP to ${cleanedIdentifier}: ${otp}`);
      }
      console.log(`[DEV MODE] ${type === 'mobile' ? 'SMS' : 'Email'} OTP to ${cleanedIdentifier}: ${otp}`);
    }

    // Return OTP in response if:
    // 1. In development mode, OR
    // 2. SMS/Email service is not configured (so user can see OTP in toast)
    const shouldReturnOTP = process.env.NODE_ENV !== 'production' || !smsServiceConfigured || !sendResult?.success;

    res.json({ 
      message: `OTP sent to your ${type}`,
      // Return OTP in response when service is not configured or in dev mode
      ...(shouldReturnOTP && { otp })
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to generate OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, type, purpose = 'registration' } = req.body;

    if (!identifier || !otp || !type) {
      return res.status(400).json({ message: 'Identifier, OTP, and type are required' });
    }

    // Clean identifier for mobile type to match what was saved
    const cleanedIdentifier = type === 'mobile' ? identifier.replace(/[\s-]/g, '') : identifier;

    const otpRecord = await OTP.findOne({
      identifier: cleanedIdentifier,
      type,
      purpose,
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ 
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

module.exports = {
  generateAndSendOTP,
  verifyOTP
};

