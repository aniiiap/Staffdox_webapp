import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Phone, CreditCard, Lock, CheckCircle } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: User Type, 2: OTP, 3: Form, 4: Payment
  const [userType, setUserType] = useState(null); // 'new' or 'existing'
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [_otpVerified, setOtpVerified] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false); // Kept for future payment implementation
  const [cart, setCart] = useState([]);

  // Get cart from localStorage (support multiple plans)
  useEffect(() => {
    const cartFromStorage = localStorage.getItem('paymentCart');
    
    if (cartFromStorage) {
      try {
        const parsedCart = JSON.parse(cartFromStorage);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing cart:', error);
        setCart([]);
      }
    } else {
      // No cart in localStorage, check if plan was passed via navigation state (for backward compatibility)
      const planFromState = location.state?.plan;
      if (planFromState) {
        // Add to existing cart or create new one, don't replace
        const existingCartStr = localStorage.getItem('paymentCart');
        let cart = existingCartStr ? JSON.parse(existingCartStr) : [];
        
        // Check if plan already exists
        const existingPlanIndex = cart.findIndex(item => item.name === planFromState.name);
        if (existingPlanIndex >= 0) {
          cart[existingPlanIndex].quantity = (cart[existingPlanIndex].quantity || 1) + 1;
        } else {
          cart.push(planFromState);
        }
        
        setCart(cart);
        localStorage.setItem('paymentCart', JSON.stringify(cart));
      } else {
        // No plan in cart, redirect back
        toast.error('No plan selected');
        navigate('/recruiter');
      }
    }
  }, [location, navigate]);

  // Load Razorpay script
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => console.log('Razorpay script loaded');
      document.body.appendChild(script);
    }
  }, []);

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    if (type === 'new') {
      // For new users, redirect to registration
      navigate('/employer/login', { state: { fromCheckout: true } });
    } else {
      // For existing users, go to OTP step
      setStep(2);
    }
  };

  const sendOTP = async () => {
    const cleanedMobile = mobileNumber.replace(/[\s-()]/g, '');
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(cleanedMobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOTP(true);
    try {
      const response = await API.post('/api/otp/generate', {
        identifier: cleanedMobile,
        type: 'mobile',
        purpose: 'payment'
      });

      if (response.data.userNotFound) {
        toast.error('This mobile number is not registered. Please register first.');
        setSendingOTP(false);
        return;
      }

      if (response.data.otp) {
        toast.success(`OTP sent! Your OTP is: ${response.data.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your mobile number');
      }
      setOtpSent(true);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.data?.message?.includes('not registered')) {
        toast.error('This mobile number is not registered. Please register first.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    try {
      const cleanedMobile = mobileNumber.replace(/[\s-()]/g, '');
      const response = await API.post('/api/otp/verify', {
        identifier: cleanedMobile,
        type: 'mobile',
        otp: otp,
        purpose: 'payment'
      });

      if (response.data.verified) {
        setOtpVerified(true);
        toast.success('OTP verified successfully');
        
        // Automatically log in the user
        try {
          const loginResponse = await API.post('/api/auth/login-by-phone', {
            phone: cleanedMobile
          });
          
          if (loginResponse.data.token) {
            localStorage.setItem('token', loginResponse.data.token);
            API.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
            
            // Fetch user data to pre-fill form
            const userResponse = await API.get(`/api/user/by-phone/${cleanedMobile}`);
            const userData = userResponse.data.user;
            
            const name = userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : userData.firstName || userData.lastName || '';
            
            setFormData({
              name: name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              address: userData.location || userData.address || userData.companyAddress || '',
              city: userData.city || '',
              state: userData.state || '',
              pincode: userData.pincode || ''
            });
          }
        } catch (loginError) {
          console.error('Error logging in:', loginError);
        }
        
        setStep(3); // Move to form step
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields (Name, Email, Phone)');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Basic phone validation
    const phoneRegex = /^[0-9]{10,}$/;
    const cleanedPhone = formData.phone.replace(/[\s-()]/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      toast.error('Please enter a valid phone number (at least 10 digits)');
      return;
    }
    
    setStep(4); // Move to payment step
  };

  const getPlanPrice = (plan) => {
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
    if (cart.length === 0) {
      toast.error('No plan selected');
      return;
    }

    const plan = cart[0]; // Get first plan from cart
    const subtotal = getPlanPrice(plan);

    setLoading(true);
    try {
      // Ensure user is logged in
      let token = localStorage.getItem('token');
      if (!token && formData.phone) {
        const cleanedPhone = formData.phone.replace(/[\s-()]/g, '');
        const loginResponse = await API.post('/api/auth/login-by-phone', {
          phone: cleanedPhone
        });
        if (loginResponse.data.token) {
          token = loginResponse.data.token;
          localStorage.setItem('token', token);
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }

      if (!token) {
        toast.error('Please ensure you are logged in');
        return;
      }

      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // For multiple plans, we'll process them one by one or combine
      // For now, process the first plan (you may want to modify backend to handle multiple plans)
      const firstPlan = cart[0];
      
      // Create payment order
      const response = await API.post('/api/payments/create-order', {
        planName: firstPlan.name,
        amount: subtotal,
        customerDetails: formData,
        cartItems: cart // Pass all cart items for reference
      });

      const { orderId, amount, currency } = response.data;

      // Initialize Razorpay
      const options = {
        key: response.data.razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'Staffdox',
        description: cart.length === 1 
          ? `${firstPlan.name} Plan Subscription`
          : `${cart.length} Plans Subscription`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await API.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: firstPlan.name,
              customerDetails: formData,
              cartItems: cart
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful! Plan activated.');
              localStorage.removeItem('paymentCart');
              window.dispatchEvent(new CustomEvent('cartUpdated'));
              
              // Refresh user data to get updated plan
              try {
                const userResponse = await API.get('/api/user/me');
                // Dispatch event to notify other components
                window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userResponse.data.user }));
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
              
              // Navigate to recruiter dashboard with plan tab
              navigate('/recruiter?tab=plan');
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
      razorpay.on('payment.failed', function () {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No plan selected</p>
          <button
            onClick={() => navigate('/recruiter')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate total for all plans in cart
  const subtotal = cart.reduce((sum, plan) => {
    const price = getPlanPrice(plan);
    const quantity = plan.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-5xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Marketing Content */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-lg flex flex-col justify-center hidden lg:flex">
            <div>
              <h1 className="text-2xl font-bold mb-3">Find & hire the right talent with us</h1>
              <p className="text-base text-blue-100 mb-4">Connect with top talent and grow your business</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Checkout Form */}
          <div className="bg-white p-5 rounded-lg shadow-lg">
            <button
              onClick={() => navigate('/employer/login')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            {/* Step 1: User Type Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Continue your purchase as</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleUserTypeSelect('new')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="userType"
                            checked={userType === 'new'}
                            onChange={() => handleUserTypeSelect('new')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <h3 className="text-base font-semibold text-gray-900">a new user</h3>
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          I don't have an account. I'll register first and then proceed with payment.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUserTypeSelect('existing')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <UserCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="userType"
                            checked={userType === 'existing'}
                            onChange={() => handleUserTypeSelect('existing')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <h3 className="text-base font-semibold text-gray-900">an existing user</h3>
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          I already have an account. I'll verify with OTP and proceed with payment.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Verify your mobile number</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile number</label>
                    <div className="flex gap-2">
                      <select className="px-3 py-2 border border-gray-300 rounded-md bg-white">
                        <option value="+91">+91</option>
                      </select>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter mobile number"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={6}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span>I agree to receive important updates on WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span>I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a></span>
                    </label>
                  </div>

                  {!otpSent ? (
                    <button
                      onClick={sendOTP}
                      disabled={sendingOTP || !mobileNumber || mobileNumber.length !== 10}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {sendingOTP ? 'Sending...' : 'Send OTP'}
                    </button>
                  ) : (
                    <button
                      onClick={verifyOTP}
                      disabled={verifyingOTP || otp.length !== 6}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Employer Details Form */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Your Details</h2>
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                    <Lock className="w-3 h-3" />
                    <span>Your information is secure and encrypted</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold text-sm"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Payment Summary */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Details</h2>
                
                <div className="mb-4 space-y-3">
                  {cart.map((planItem, index) => {
                    const planPrice = getPlanPrice(planItem);
                    const planQuantity = planItem.quantity || 1;
                    const planTotal = planPrice * planQuantity;
                    return (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {planItem.name} Plan {planQuantity > 1 && `(x${planQuantity})`}
                          </h3>
                          <p className="text-xl font-bold text-gray-900">₹{planTotal.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="text-xs text-gray-600">{planItem.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Summary of Charges</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sub total</span>
                      <span className="text-gray-900 font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (18%)</span>
                      <span className="text-gray-900 font-medium">₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Billing Details</h4>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p><span className="font-medium text-gray-900">Name:</span> {formData.name}</p>
                    <p><span className="font-medium text-gray-900">Email:</span> {formData.email}</p>
                    <p><span className="font-medium text-gray-900">Phone:</span> {formData.phone}</p>
                    {formData.address && <p className="truncate"><span className="font-medium text-gray-900">Address:</span> {formData.address}</p>}
                    {(formData.city || formData.state || formData.pincode) && (
                      <p><span className="font-medium text-gray-900">Location:</span> {[formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                  <Lock className="w-3 h-3" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={true} // Temporarily disabled - payment implementation pending
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                  title="Payment functionality is coming soon"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{total.toLocaleString('en-IN')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

