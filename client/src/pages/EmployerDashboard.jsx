import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Check, ArrowRight, User, Sparkles, Building2, Zap, Shield, TrendingUp } from 'lucide-react';
import EmployerHeader from '../components/EmployerHeader';
import EmployerFooter from '../components/EmployerFooter';
import PaymentGateway from '../components/PaymentGateway';
import OTPVerificationModal from '../components/OTPVerificationModal';
import UserTypeModal from '../components/UserTypeModal';
import toast from 'react-hot-toast';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [verifiedMobile, setVerifiedMobile] = useState(null);

  const plans = [
    {
      name: 'Free',
      price: 'Free',
      period: '',
      description: 'Try our platform with a free job posting',
      features: [
        'Post 2 job',
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EmployerHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
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
                  const plansSection = document.getElementById('plans-section');
                  if (plansSection) {
                    plansSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Explore our products
              </button>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <Sparkles className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">AI-Powered Matching</h3>
                  <p className="text-indigo-100 text-sm">Smart algorithms match candidates to your requirements</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <Zap className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Fast Hiring</h3>
                  <p className="text-indigo-100 text-sm">Reduce time-to-hire with automated screening</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <Shield className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Quality Candidates</h3>
                  <p className="text-indigo-100 text-sm">Access verified and qualified professionals</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <TrendingUp className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Scalable Solutions</h3>
                  <p className="text-indigo-100 text-sm">Grow your team efficiently at any scale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div id="plans-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                    navigate('/employer/login');
                  } else if (plan.price === 'Custom') {
                    // Enterprise plan - redirect to sales enquiry
                    window.location.href = '/employer/login?tab=sales';
                  } else {
                    // Paid plan - show user type selection
                    setSelectedPlan(plan);
                    setShowUserTypeModal(true);
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

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Staffdox?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to find and hire the best talent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Large Talent Pool</h3>
              <p className="text-gray-600">Access millions of qualified candidates across all industries</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching</h3>
              <p className="text-gray-600">Intelligent algorithms match candidates to your job requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Hiring</h3>
              <p className="text-gray-600">Reduce time-to-hire with automated screening and workflows</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600">Verified profiles and quality checks ensure you get the best candidates</p>
            </div>
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
            navigate('/employer/login');
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
        onVerified={(mobile) => {
          setVerifiedMobile(mobile);
          setShowOTPModal(false);
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

