import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { trackPageView } from './utils/analytics';

// Lazy load all pages for code splitting and better performance
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const MyApplications = lazy(() => import('./pages/MyApplications'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));
const YourCV = lazy(() => import('./pages/YourCV'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const EmployerLogin = lazy(() => import('./pages/EmployerLogin'));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UserForgotPassword = lazy(() => import('./pages/UserForgotPassword'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const TalentCloud = lazy(() => import('./pages/TalentCloud'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
  </div>
);

export default function App() {
  const location = useLocation();

  // Scroll to top on route change - use instant for better performance
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Track page views for analytics
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  const hideFooterRoutes = ['/login', '/register', '/employer/login', '/employer/dashboard', '/talent-cloud', '/forgot-password', '/reset-password', '/user-forgot-password', '/payment', '/checkout'];
  const shouldShowFooter = !hideFooterRoutes.includes(location.pathname);
  const hideHeaderRoutes = ['/employer/login', '/employer/dashboard', '/talent-cloud', '/forgot-password', '/reset-password', '/user-forgot-password', '/payment', '/checkout'];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {shouldShowHeader && <Header />}
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
            <Route path="/your-cv" element={<ProtectedRoute><YourCV/></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard/></ProtectedRoute>} />
            <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard/></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute><MyApplications/></ProtectedRoute>} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/employer/login" element={<EmployerLogin />} />
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/user-forgot-password" element={<UserForgotPassword />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/talent-cloud" element={<TalentCloud />} />
          </Routes>
        </Suspense>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
