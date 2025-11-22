const express = require('express');
const router = express.Router();
const { sendContactEmail, sendContactConfirmation } = require('../utils/emailService');

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Send email to staffdox (admin)
    const adminEmailResult = await sendContactEmail({
      name,
      email,
      subject,
      message
    });

    // Send confirmation email to sender (non-blocking)
    sendContactConfirmation(email, name)
      .then(result => {
        if (result.success) {
          console.log(`Contact confirmation email sent to ${email}`);
        } else {
          console.log(`Failed to send contact confirmation email to ${email}:`, result.message);
        }
      })
      .catch(err => {
        console.error('Error in contact confirmation email send:', err);
      });

    if (!adminEmailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send message. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Thank you for contacting us! We have received your message and will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

