import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false); // Kept for future payment implementation
  
  // Get form data and plan from navigation state
  const { formData, plan } = location.state || {};

  useEffect(() => {
    // Redirect if no form data or plan
    if (!formData || !plan) {
      toast.error('Please complete the form first');
      // Try to go back or go to employer login
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/employer/login');
      }
    }
  }, [formData, plan, navigate]);

  useEffect(() => {
    // Load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay script loaded');
      };
      document.body.appendChild(script);
    }
  }, []);

  const getPlanPrice = () => {
    // If plan has a numeric price, use it
    if (plan?.numericPrice) return plan.numericPrice;
    
    // If plan has price as string, parse it
    if (plan?.price) {
      if (plan.price === 'Free' || plan.price === 'Custom') return 0;
      // Remove currency symbols and commas, then parse
      const priceStr = plan.price.toString().replace(/[₹,\s]/g, '');
      const price = parseInt(priceStr, 10);
      if (!isNaN(price)) return price;
    }
    
    // Fallback to hardcoded prices (for backward compatibility)
    if (plan?.name === 'Starter') return 19999;
    if (plan?.name === 'Professional') return 39999;
    if (plan?.name === 'Enterprise') return 0;
    return 0;
  };

  const handlePayment = async () => {
    if (!formData || !plan) {
      toast.error('Missing payment information');
      return;
    }

    // Check if user is logged in
    let token = localStorage.getItem('token');
    
    // If not logged in, try to login by phone (user was verified via OTP)
    if (!token && formData.phone) {
      try {
        const cleanedPhone = formData.phone.replace(/[\s-()]/g, '');
        const loginResponse = await API.post('/api/auth/login-by-phone', {
          phone: cleanedPhone
        });
        
        if (loginResponse.data.token) {
          token = loginResponse.data.token;
          localStorage.setItem('token', token);
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (loginError) {
        console.error('PaymentPage: Error logging in by phone:', loginError);
        toast.error('Please ensure you have verified your mobile number');
        return;
      }
    }
    
    if (!token) {
      toast.error('Please login to complete payment');
      navigate('/employer/login');
      return;
    }

    setLoading(true);
    try {
      // Set auth header
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Create payment order with form data
      const response = await API.post('/api/payments/create-order', {
        planName: plan.name,
        amount: getPlanPrice(),
        customerDetails: formData
      });

      const { orderId, amount, currency } = response.data;

      // Initialize Razorpay
      const options = {
        key: response.data.razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'Staffdox',
        description: `${plan.name} Plan Subscription`,
        order_id: orderId,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await API.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: plan.name,
              customerDetails: formData
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Plan activated.');
              // Redirect based on whether user is logged in
              const token = localStorage.getItem('token');
              if (token) {
                navigate('/recruiter');
              } else {
                navigate('/employer/login');
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (!formData || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  const subtotal = getPlanPrice();
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                // Go back to previous page or employer login
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  const token = localStorage.getItem('token');
                  navigate(token ? '/recruiter' : '/employer/login');
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Plan Details</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Plan Info */}
            <div className="space-y-5">
              <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{plan.name} Plan</h3>
                  <p className="text-2xl font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
                {plan.period && <p className="text-sm text-gray-600 mt-1">{plan.period}</p>}
              </div>

              <div className="p-5 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Summary of Charges</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sub total</span>
                    <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="text-gray-900 font-medium">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Billing Details */}
            <div className="space-y-5">
              <div className="p-5 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Billing Details</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><span className="font-medium text-gray-900">Name:</span> {formData.name}</p>
                  <p><span className="font-medium text-gray-900">Email:</span> {formData.email}</p>
                  <p><span className="font-medium text-gray-900">Phone:</span> {formData.phone}</p>
                  {formData.address && (
                    <p className="truncate"><span className="font-medium text-gray-900">Address:</span> {formData.address}</p>
                  )}
                  {(formData.city || formData.state || formData.pincode) && (
                    <p>
                      <span className="font-medium text-gray-900">Location:</span> {[formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={true} // Temporarily disabled - payment implementation pending
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
            title="Payment functionality is coming soon"
          >
            <CreditCard className="w-5 h-5" />
            Pay ₹{total.toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}

