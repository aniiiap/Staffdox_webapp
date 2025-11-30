import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { Building2, Mail, Phone, User, MapPin, Briefcase, Loader, CheckCircle, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';
import EmployerHeader from '../components/EmployerHeader';
import EmployerFooter from '../components/EmployerFooter';
import PaymentGateway from '../components/PaymentGateway';
import OTPVerificationModal from '../components/OTPVerificationModal';
import UserTypeModal from '../components/UserTypeModal';

export default function EmployerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'register'
  
  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'sales' || tab === 'register') {
      setActiveTab(tab);
      // Scroll to form when coming from external link
      if (tab === 'sales') {
        setTimeout(() => {
          const formCard = document.querySelector('.bg-white.rounded-2xl');
          if (formCard) {
            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      } else if (tab === 'register') {
        setTimeout(() => {
          const formCard = document.querySelector('.bg-white.rounded-2xl');
          if (formCard) {
            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [searchParams]);

  // Handle hash navigation to plans section
  useEffect(() => {
    if (window.location.hash === '#plans-section') {
      setTimeout(() => {
        const plansSection = document.getElementById('plans-section');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);
  const [showRegisterForm, setShowRegisterForm] = useState(false); // Show registration form only after clicking "Create account"
  const [registerStep, setRegisterStep] = useState(1); // 1: Mobile, 2: Basic Details, 3: Company Details

  const plans = [
    {
      name: 'Free',
      price: 'Free',
      period: '',
      description: 'Try our platform with a free job posting',
      features: [
        'Post 1 job',
        'Up to 5 database limit',
        'Valid for 7 days',
        'View up to 5 applicants & resumes'
      ],
      popular: false
    },
    {
      name: 'Starter',
      price: '₹19,999',
      period: '/year',
      description: 'Perfect for small businesses getting started',
      features: [
        'Post up to 5 jobs',
        'Access to candidate database',
        'Basic candidate screening',
        'Job posting analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '₹39,999',
      period: '/year',
      description: 'Ideal for growing companies',
      features: [
        'Post up to 20 jobs',
        'Priority candidate matching',
        'Dedicated account manager',
        'Advanced analytics dashboard',
        'Resume database access'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with high-volume hiring',
      features: [
        'Unlimited job postings',
        'White-label solutions',
        'Dedicated support team',
        'Custom integrations',
        'Bulk candidate management',
        'Advanced reporting & insights'
      ],
      popular: false
    }
  ];

  // Sales Enquiry Form
  const [salesForm, setSalesForm] = useState({
    contactName: '',
    contactPhone: '',
    designation: '',
    companyName: '',
    companyEmail: '',
    companySize: '',
    city: '',
    note: ''
  });
  const [salesSubmitting, setSalesSubmitting] = useState(false);

  // Registration Form
  const [regForm, setRegForm] = useState({
    mobile: '',
    mobileOTP: '',
    firstName: '',
    lastName: '',
    email: '',
    emailOTP: '',
    password: '',
    confirmPassword: '',
    hiringFor: 'company',
    companyName: '',
    designation: '',
    companySize: '',
    pincode: '',
    companyAddress: ''
  });
  const [mobileOTPSent, setMobileOTPSent] = useState(false);
  const [mobileOTPVerified, setMobileOTPVerified] = useState(false);
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [emailOTPVerified, setEmailOTPVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [mobileResendCountdown, setMobileResendCountdown] = useState(0);
  const [emailResendCountdown, setEmailResendCountdown] = useState(0);

  // Modal states
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [verifiedMobile, setVerifiedMobile] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Login Form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  React.useEffect(() => {
    let timer;
    if (mobileResendCountdown > 0) {
      timer = setTimeout(() => setMobileResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [mobileResendCountdown]);

  React.useEffect(() => {
    let timer;
    if (emailResendCountdown > 0) {
      timer = setTimeout(() => setEmailResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailResendCountdown]);


  const companySizeOptions = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5000+'
  ];

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    setSalesSubmitting(true);
    try {
      await API.post('/api/user/recruiter/apply-public', salesForm);
      toast.success('Request submitted. Our admin team will get back to you shortly.');
      setSalesForm({
        contactName: '',
        contactPhone: '',
        designation: '',
        companyName: '',
        companyEmail: '',
        companySize: '',
        city: '',
        note: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSalesSubmitting(false);
    }
  };

  const sendMobileOTP = async () => {
    if (!regForm.mobile || !/^[6-9]\d{9}$/.test(regForm.mobile.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOTP(true);
    try {
      const response = await API.post('/api/otp/generate', {
        identifier: regForm.mobile.replace(/[\s-]/g, ''),
        type: 'mobile',
        purpose: 'registration'
      });
      // Always show OTP in toast if it's returned in response (when SMS service is not configured)
      if (response.data.otp) {
        toast.success(`OTP sent! Your OTP is: ${response.data.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your mobile number');
      }
      setMobileOTPSent(true);
      setMobileResendCountdown(30);
    } catch (error) {
      // Check if mobile number is already registered
      if (error.response?.data?.userExists) {
        toast.error('This mobile number is already registered. Please login instead or use a different number.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setSendingOTP(false);
    }
  };
  const handleResendMobileOTP = async () => {
    if (sendingOTP || mobileResendCountdown > 0) return;
    await sendMobileOTP();
  };

  const verifyMobileOTP = async () => {
    if (!regForm.mobileOTP || regForm.mobileOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    try {
      await API.post('/api/otp/verify', {
        identifier: regForm.mobile.replace(/[\s-]/g, ''),
        otp: regForm.mobileOTP,
        type: 'mobile',
        purpose: 'registration'
      });
      toast.success('Mobile number verified');
      setMobileOTPVerified(true);
      setRegisterStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const sendEmailOTP = async () => {
    if (!regForm.email || !/^\S+@\S+\.\S+$/.test(regForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!regForm.firstName || !regForm.lastName) {
      toast.error('Please enter your full name');
      return;
    }

    setSendingOTP(true);
    try {
      const response = await API.post('/api/otp/generate', {
        identifier: regForm.email.toLowerCase(),
        type: 'email',
        purpose: 'registration'
      });
      // In development, OTP is returned in response
      if (response.data.otp) {
        toast.success(`OTP sent! Your OTP is: ${response.data.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your email');
      }
      setEmailOTPSent(true);
      setEmailResendCountdown(30);
    } catch (error) {
      // Check if email is already registered
      if (error.response?.data?.userExists) {
        toast.error('This email is already registered. Please use a different email or login instead.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setSendingOTP(false);
    }
  };
  const handleResendEmailOTP = async () => {
    if (sendingOTP || emailResendCountdown > 0) return;
    await sendEmailOTP();
  };

  const verifyEmailOTP = async () => {
    if (!regForm.emailOTP || regForm.emailOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setVerifyingOTP(true);
    try {
      await API.post('/api/otp/verify', {
        identifier: regForm.email.toLowerCase(),
        otp: regForm.emailOTP,
        type: 'email',
        purpose: 'registration'
      });
      toast.success('Email verified');
      setEmailOTPVerified(true);
      setRegisterStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!regForm.companyName || !regForm.designation || !regForm.companySize || !regForm.pincode || !regForm.companyAddress) {
      toast.error('Please fill all company details');
      return;
    }

    setRegistering(true);
    try {
      const response = await API.post('/api/auth/employer/register', {
        mobile: regForm.mobile.replace(/[\s-]/g, ''),
        mobileOTP: regForm.mobileOTP,
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email.toLowerCase(),
        emailOTP: regForm.emailOTP,
        password: regForm.password,
        hiringFor: regForm.hiringFor,
        companyName: regForm.companyName,
        designation: regForm.designation,
        companySize: regForm.companySize,
        pincode: regForm.pincode,
        companyAddress: regForm.companyAddress
      });

      localStorage.setItem('token', response.data.token);
      API.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token: response.data.token } }));
      toast.success('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/recruiter');
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const response = await API.post('/api/auth/employer/login', loginForm);
      localStorage.setItem('token', response.data.token);
      API.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token: response.data.token } }));
      toast.success('Login successful!');
      navigate('/recruiter');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EmployerHeader />
      
      <div className="flex-grow bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 min-h-full flex items-center justify-center px-4 py-12">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Marketing Content */}
          <div className="text-white space-y-6 lg:pr-8">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-wider text-indigo-300 font-semibold">
                SMART RECRUITMENT
              </h2>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Connect with top talent using intelligent matching technology ✨
              </h1>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <p className="text-lg text-indigo-100">
                  Access a vast network of qualified professionals across industries
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-lg text-indigo-100">
                  AI-powered candidate screening and matching for faster hiring
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                navigate('/employer/dashboard');
                setTimeout(() => {
                  const plansSection = document.getElementById('plans-section');
                  if (plansSection) {
                    plansSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
              className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Explore our products
            </button>
          </div>

          {/* Right Side - Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto lg:max-w-lg">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => {
                  setActiveTab('sales');
                  setRegisterStep(1);
                  setMobileResendCountdown(0);
                  setEmailResendCountdown(0);
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'sales'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sales enquiry
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setRegisterStep(1);
                  setMobileResendCountdown(0);
                  setEmailResendCountdown(0);
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Register/Log in
              </button>
            </div>

            {/* Sales Enquiry Form */}
            {activeTab === 'sales' && (
              <form onSubmit={handleSalesSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={salesForm.contactName}
                    onChange={(e) => setSalesForm({ ...salesForm, contactName: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={salesForm.contactPhone}
                    onChange={(e) => setSalesForm({ ...salesForm, contactPhone: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    value={salesForm.companyEmail}
                    onChange={(e) => setSalesForm({ ...salesForm, companyEmail: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    value={salesForm.designation}
                    onChange={(e) => setSalesForm({ ...salesForm, designation: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. HR Manager"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={salesForm.companyName}
                      onChange={(e) => setSalesForm({ ...salesForm, companyName: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Range *</label>
                    <select
                      value={salesForm.companySize}
                      onChange={(e) => setSalesForm({ ...salesForm, companySize: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select range</option>
                      {companySizeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={salesForm.city}
                    onChange={(e) => setSalesForm({ ...salesForm, city: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={salesForm.note}
                    onChange={(e) => setSalesForm({ ...salesForm, note: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share any specific hiring needs or questions"
                  />
                </div>
                <button
                  type="submit"
                  disabled={salesSubmitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {salesSubmitting ? 'Submitting...' : 'Request callback'}
                </button>
              </form>
            )}

            {/* Register/Login Form */}
            {activeTab === 'register' && !showRegisterForm && (
              <div>
                {/* Login Section */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter registered email ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
                  </div>
                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loggingIn ? 'Logging in...' : 'Log in'}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    Don't have a registered email ID?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegisterForm(true);
                        setRegisterStep(1);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Registration Form - Only shown after clicking "Create account" */}
            {activeTab === 'register' && showRegisterForm && (
              <div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setRegisterStep(1);
                      setMobileOTPSent(false);
                      setMobileOTPVerified(false);
                      setEmailOTPSent(false);
                      setEmailOTPVerified(false);
                      setMobileResendCountdown(0);
                      setEmailResendCountdown(0);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Back to Login
                  </button>
                </div>
                {/* Registration Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Register</h3>
                  
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        registerStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {mobileOTPVerified ? <CheckCircle className="w-5 h-5" /> : '1'}
                      </div>
                      <span className={`ml-2 text-sm ${registerStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        Mobile
                      </span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        registerStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {emailOTPVerified ? <CheckCircle className="w-5 h-5" /> : '2'}
                      </div>
                      <span className={`ml-2 text-sm ${registerStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        Basic
                      </span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        registerStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        3
                      </div>
                      <span className={`ml-2 text-sm ${registerStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        Company
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleRegister}>
                    {/* Step 1: Mobile OTP */}
                    {registerStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={regForm.mobile}
                              onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                              disabled={mobileOTPSent}
                              required
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              placeholder="9876543210"
                            />
                            {!mobileOTPSent && (
                              <button
                                type="button"
                                onClick={sendMobileOTP}
                                disabled={sendingOTP}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                {sendingOTP ? <Loader className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                              </button>
                            )}
                          </div>
                        </div>
                        {mobileOTPSent && !mobileOTPVerified && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={regForm.mobileOTP}
                                onChange={(e) => setRegForm({ ...regForm, mobileOTP: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                required
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="000000"
                                maxLength={6}
                              />
                              <button
                                type="button"
                                onClick={verifyMobileOTP}
                                disabled={verifyingOTP || regForm.mobileOTP.length !== 6}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                {verifyingOTP ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify'}
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                              <span>
                                {mobileResendCountdown > 0
                                  ? `Resend OTP in ${mobileResendCountdown}s`
                                  : 'Didn’t receive the OTP?'}
                              </span>
                              <button
                                type="button"
                                onClick={handleResendMobileOTP}
                                disabled={sendingOTP || mobileResendCountdown > 0}
                                className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                Resend OTP
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2: Basic Details */}
                    {registerStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              value={regForm.firstName}
                              onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              value={regForm.lastName}
                              onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={regForm.email}
                              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                              disabled={emailOTPSent}
                              required
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              placeholder="name@company.com"
                            />
                            {!emailOTPSent && (
                              <button
                                type="button"
                                onClick={sendEmailOTP}
                                disabled={sendingOTP}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                {sendingOTP ? <Loader className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                              </button>
                            )}
                          </div>
                        </div>
                        {emailOTPSent && !emailOTPVerified && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enter Email OTP *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={regForm.emailOTP}
                                onChange={(e) => setRegForm({ ...regForm, emailOTP: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                required
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="000000"
                                maxLength={6}
                              />
                              <button
                                type="button"
                                onClick={verifyEmailOTP}
                                disabled={verifyingOTP || regForm.emailOTP.length !== 6}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                {verifyingOTP ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify'}
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                              <span>
                                {emailResendCountdown > 0
                                  ? `Resend OTP in ${emailResendCountdown}s`
                                  : 'Didn’t receive the OTP?'}
                              </span>
                              <button
                                type="button"
                                onClick={handleResendEmailOTP}
                                disabled={sendingOTP || emailResendCountdown > 0}
                                className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                Resend OTP
                              </button>
                            </div>
                          </div>
                        )}
                        {emailOTPSent && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                              <div className="relative">
                                <input
                                  type={showRegPassword ? 'text' : 'password'}
                                  value={regForm.password}
                                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Minimum 6 characters"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRegPassword((prev) => !prev)}
                                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                              <div className="relative">
                                <input
                                  type={showRegConfirmPassword ? 'text' : 'password'}
                                  value={regForm.confirmPassword}
                                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Re-enter password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                  aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 3: Company Details */}
                    {registerStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">HIRING FOR</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setRegForm({ ...regForm, hiringFor: 'company' })}
                              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                regForm.hiringFor === 'company'
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              Your company
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegForm({ ...regForm, hiringFor: 'consultancy' })}
                              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                regForm.hiringFor === 'consultancy'
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              Your consultancy
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                          <input
                            type="text"
                            value={regForm.companyName}
                            onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Number of employees *</label>
                          <select
                            value={regForm.companySize}
                            onChange={(e) => setRegForm({ ...regForm, companySize: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select range</option>
                            {companySizeOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your designation *</label>
                          <input
                            type="text"
                            value={regForm.designation}
                            onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter designation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pin code *</label>
                          <input
                            type="text"
                            value={regForm.pincode}
                            onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter company pincode"
                            maxLength={6}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company address *</label>
                          <textarea
                            rows={3}
                            value={regForm.companyAddress}
                            onChange={(e) => setRegForm({ ...regForm, companyAddress: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter company address"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={registering}
                          className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {registering ? 'Creating account...' : 'Continue'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div id="plans-section" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your hiring needs. All plans include our core features with varying levels of access and support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-xl shadow-lg p-8 border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-blue-600 transform scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.name === 'Free') {
                      // Check if user is logged in
                      const token = localStorage.getItem('token');
                      if (!token) {
                        toast.error('Please register or login first to post a free job');
                        setActiveTab('register');
                        setShowRegisterForm(true);
                        return;
                      }
                      // If logged in, redirect to recruiter dashboard
                      navigate('/recruiter?tab=plan');
                    } else if (plan.price === 'Custom') {
                      // Contact sales - redirect to sales enquiry
                      setActiveTab('sales');
                      setTimeout(() => {
                        const formCard = document.querySelector('.bg-white.rounded-2xl');
                        if (formCard) {
                          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      // Paid plan - add to cart
                      // Extract numeric price from plan price string
                      let numericPrice = 0;
                      if (plan.price && plan.price !== 'Free' && plan.price !== 'Custom') {
                        const priceStr = plan.price.toString().replace(/[₹,\s]/g, '');
                        numericPrice = parseInt(priceStr, 10) || 0;
                      }
                      const planWithPrice = { ...plan, numericPrice, quantity: 1 };
                      
                      // Load existing cart and add/update plan
                      try {
                        const existingCartStr = localStorage.getItem('paymentCart');
                        let cart = [];
                        
                        if (existingCartStr) {
                          try {
                            cart = JSON.parse(existingCartStr);
                            // Ensure cart is an array
                            if (!Array.isArray(cart)) {
                              cart = [];
                            }
                          } catch (parseError) {
                            console.error('Error parsing cart:', parseError);
                            cart = [];
                          }
                        }
                        
                        // Check if plan already exists in cart
                        const existingPlanIndex = cart.findIndex(item => item && item.name === plan.name);
                        if (existingPlanIndex >= 0) {
                          // Increment quantity if plan already exists
                          cart[existingPlanIndex].quantity = (cart[existingPlanIndex].quantity || 1) + 1;
                        } else {
                          // Add new plan to cart
                          cart.push(planWithPrice);
                        }
                        
                        // Save updated cart
                        localStorage.setItem('paymentCart', JSON.stringify(cart));
                        window.dispatchEvent(new CustomEvent('cartUpdated'));
                        toast.success(`${plan.name} plan added to cart!`, { duration: 2000 });
                        // Navigate to checkout with all cart items
                        navigate('/checkout');
                      } catch (error) {
                        console.error('Error adding plan to cart:', error);
                        toast.error('Failed to add plan to cart');
                      }
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : plan.name === 'Free'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Free' ? 'Post a Free Job' : plan.price === 'Custom' ? 'Contact Sales' : 'Buy now'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Need help choosing the right plan?
            </p>
            <Link
              to="/employer/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact our sales team
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
      
      <EmployerFooter />

      {/* User Type Selection Modal */}
      <UserTypeModal
        isOpen={showUserTypeModal}
        onClose={() => {
          setShowUserTypeModal(false);
          setSelectedPlan(null);
        }}
        onSelect={(type) => {
          setShowUserTypeModal(false);
          if (type === 'new') {
            // Redirect to registration
            setActiveTab('register');
            setShowRegisterForm(true);
          } else {
            // Show OTP verification
            setShowOTPModal(true);
          }
        }}
      />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setVerifiedMobile(null);
        }}
        onVerified={async (mobile) => {
          setVerifiedMobile(mobile);
          setShowOTPModal(false);
          
          // Automatically log in the user after OTP verification
          try {
            const cleanedMobile = mobile.replace(/[\s-()]/g, '');
            const loginResponse = await API.post('/api/auth/login-by-phone', {
              phone: cleanedMobile
            });
            
            if (loginResponse.data.token) {
              // Store token and update API headers
              localStorage.setItem('token', loginResponse.data.token);
              API.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
              
              console.log('EmployerLogin: User logged in successfully');
            }
          } catch (loginError) {
            console.error('EmployerLogin: Error logging in user:', loginError);
            // Continue anyway - payment gateway will handle login if needed
          }
          
          setShowPaymentGateway(true);
        }}
        mobile={verifiedMobile}
        purpose="payment"
      />

      {/* Payment Gateway Modal */}
      <PaymentGateway
        isOpen={showPaymentGateway}
        onClose={() => {
          setShowPaymentGateway(false);
          setSelectedPlan(null);
          setVerifiedMobile(null);
        }}
        plan={selectedPlan}
        userData={null}
        onSuccess={async () => {
          toast.success('Plan purchased successfully! Please login to access your dashboard.');
          setShowPaymentGateway(false);
          setSelectedPlan(null);
          setVerifiedMobile(null);
        }}
      />
    </div>
  );
}

