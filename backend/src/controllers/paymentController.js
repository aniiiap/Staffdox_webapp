const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Plan pricing
const PLAN_PRICES = {
  'Starter': 9999,
  'Professional': 24999,
  'Enterprise': 0 // Custom pricing
};

// Plan duration in days
const PLAN_DURATION = {
  'Starter': 30,
  'Professional': 30,
  'Enterprise': 30
};

// Create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { planName, amount, customerDetails } = req.body;
    const userId = req.user.id;

    if (!planName || !PLAN_PRICES.hasOwnProperty(planName)) {
      return res.status(400).json({ message: 'Invalid plan name' });
    }

    // Check if user is a recruiter
    const user = await User.findById(userId);
    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can purchase plans' });
    }

    const planAmount = PLAN_PRICES[planName];
    if (planAmount === 0) {
      return res.status(400).json({ message: 'Please contact sales for Enterprise plan' });
    }

    // Use provided amount or plan amount
    const finalAmount = amount || planAmount;

    // Create order using Razorpay API
    // For now, we'll create a mock order ID. In production, use Razorpay SDK
    const orderId = `order_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    res.json({
      orderId,
      amount: finalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      razorpayKeyId: RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Verify payment and activate plan
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, customerDetails } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      return res.status(400).json({ message: 'Missing customer details' });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Invalid user' });
    }

    // Calculate plan dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + PLAN_DURATION[planName]);

    // Calculate amounts
    const planAmount = PLAN_PRICES[planName];
    const gst = Math.round(planAmount * 0.18);
    const totalAmount = planAmount + gst;

    // Create payment record
    const payment = new Payment({
      user: userId,
      planName: planName,
      amount: planAmount,
      gst: gst,
      totalAmount: totalAmount,
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        address: customerDetails.address || '',
        city: customerDetails.city || '',
        state: customerDetails.state || '',
        pincode: customerDetails.pincode || ''
      },
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'completed',
      paymentMethod: 'razorpay',
      paidAt: new Date()
    });

    await payment.save();

    // Activate plan
    user.plan = {
      name: planName,
      startDate: startDate,
      endDate: endDate,
      isActive: true
    };

    await user.save();

    res.json({
      success: true,
      message: 'Plan activated successfully',
      plan: user.plan,
      payment: {
        id: payment._id,
        amount: payment.totalAmount
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};

