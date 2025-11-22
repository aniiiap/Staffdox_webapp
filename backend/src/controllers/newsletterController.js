const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendSubscriptionConfirmation } = require('../utils/emailService');

// Subscribe to newsletter
const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    let subscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(400).json({ message: 'This email is already subscribed to our newsletter' });
      } else {
        // Reactivate subscription
        subscriber.isActive = true;
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = null;
        await subscriber.save();
        
        // Send confirmation email
        sendSubscriptionConfirmation(subscriber.email, subscriber.unsubscribeToken)
          .catch(err => console.error('Failed to send confirmation email:', err));

        return res.json({ 
          message: 'Successfully resubscribed to newsletter! Check your email for confirmation.',
          subscriber 
        });
      }
    }

    // Create new subscriber
    subscriber = new NewsletterSubscriber({ email: normalizedEmail });
    await subscriber.save();

    // Send confirmation email (don't wait for it)
    sendSubscriptionConfirmation(subscriber.email, subscriber.unsubscribeToken)
      .catch(err => console.error('Failed to send confirmation email:', err));

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.',
      subscriber 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }
    res.status(500).json({ message: 'Failed to subscribe. Please try again later.' });
  }
};

// Unsubscribe from newsletter
const unsubscribe = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Unsubscribe token is required' });
    }

    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).json({ message: 'Invalid unsubscribe link' });
    }

    if (!subscriber.isActive) {
      return res.json({ message: 'You are already unsubscribed' });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe. Please try again later.' });
  }
};

// Get all subscribers (Admin only)
const getSubscribers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subscribers = await NewsletterSubscriber.find({})
      .sort({ subscribedAt: -1 });

    res.json({ subscribers });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers
};

