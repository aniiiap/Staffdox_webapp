import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { Plus, Briefcase, Eye, Download, Users, Search, X, FileText, ChevronLeft, ChevronRight, CreditCard, AlertCircle, CheckCircle, Folder, Lock, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentGateway from '../components/PaymentGateway';
import OTPVerificationModal from '../components/OTPVerificationModal';
import UserTypeModal from '../components/UserTypeModal';

export default function RecruiterDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [verifiedMobile, setVerifiedMobile] = useState(null);
  const [paymentUserData, setPaymentUserData] = useState(null);
  const paymentUserDataRef = useRef(null);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    state: '',
    city: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    salary: { min: '', max: '', currency: 'INR' },
    employmentType: 'Full-time',
    experience: { min: 0, max: 10 },
    skills: [''],
    category: '',
    isRemote: false,
    benefits: [''],
    deadline: ''
  });
  const categories = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales',
    'Human Resources', 'Operations', 'Design', 'Education', 'Other'
  ];
  const employmentTypes = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'
  ];

  const indianStates = [
    { name: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur'] },
    { name: 'Arunachal Pradesh', cities: ['Itanagar', 'Tawang'] },
    { name: 'Assam', cities: ['Guwahati', 'Dibrugarh', 'Silchar'] },
    { name: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur'] },
    { name: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Bilaspur'] },
    { name: 'Goa', cities: ['Panaji', 'Margao'] },
    { name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
    { name: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat'] },
    { name: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala'] },
    { name: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad'] },
    { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
    { name: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'] },
    { name: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'] },
    { name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
    { name: 'Manipur', cities: ['Imphal'] },
    { name: 'Meghalaya', cities: ['Shillong'] },
    { name: 'Mizoram', cities: ['Aizawl'] },
    { name: 'Nagaland', cities: ['Kohima', 'Dimapur'] },
    { name: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela'] },
    { name: 'Punjab', cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'] },
    { name: 'Rajasthan', cities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Bhilwara'] },
    { name: 'Sikkim', cities: ['Gangtok'] },
    { name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
    { name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Karimnagar'] },
    { name: 'Tripura', cities: ['Agartala'] },
    { name: 'Uttar Pradesh', cities: ['Noida', 'Lucknow', 'Ghaziabad', 'Kanpur', 'Varanasi'] },
    { name: 'Uttarakhand', cities: ['Dehradun', 'Haridwar'] },
    { name: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur'] },
    // Union Territories
    { name: 'Andaman and Nicobar Islands', cities: ['Port Blair'] },
    { name: 'Chandigarh (UT)', cities: ['Chandigarh'] },
    { name: 'Dadra and Nagar Haveli and Daman and Diu', cities: ['Daman', 'Diu', 'Silvassa'] },
    { name: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini'] },
    { name: 'Jammu and Kashmir', cities: ['Jammu', 'Srinagar'] },
    { name: 'Ladakh', cities: ['Leh', 'Kargil'] },
    { name: 'Lakshadweep', cities: ['Kavaratti'] },
    { name: 'Puducherry', cities: ['Puducherry', 'Karaikal'] }
  ];
  const [customCity, setCustomCity] = useState('');

  // Table state (search + pagination)
  const [jobSearch, setJobSearch] = useState('');
  const [jobsPage, setJobsPage] = useState(1);
  const [appsPage, setAppsPage] = useState(1);
  const [resumesPage, setResumesPage] = useState(1);
  const pageSize = 10;

  // CV Database state
  const [cvDatabase, setCvDatabase] = useState([]);
  const [cvPlanInfo, setCvPlanInfo] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSearch, setCvSearch] = useState('');
  const [cvFolderFilter, setCvFolderFilter] = useState('');
  const [cvPage, setCvPage] = useState(1);

  useEffect(() => {
    API.get('/api/user/me')
      .then(r => setMe(r.data.user))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
    fetchMyJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'cv-database') {
      fetchCvDatabase();
    }
  }, [activeTab]);

  // Read tab from query string (e.g., /recruiter?tab=applicants)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // Listen for user data updates (e.g., after plan purchase)
  useEffect(() => {
    const handleUserDataUpdate = async () => {
      try {
        const response = await API.get('/api/user/me');
        setMe(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUserDataUpdate);
  }, []);

  const fetchMyJobs = async () => {
    try {
      const { data } = await API.get('/api/jobs/my/jobs');
      setJobs(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load jobs');
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await API.put(`/api/jobs/${jobId}`, { status: newStatus });
      toast.success(`Job status updated to ${newStatus}`);
      fetchMyJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update job status');
    }
  };

  const createJob = async (e) => {
    e.preventDefault();

    const isEditing = !!editingJob;
    
    // Check if user has an active plan (required for both create and edit)
    const hasActivePlanForJob = me?.plan?.isActive && me?.plan?.name &&
      (!me?.plan?.endDate || new Date(me.plan.endDate) > new Date());

    if (!hasActivePlanForJob) {
      toast.error('Please subscribe to a plan to manage jobs');
      return;
    }

    // Enforce plan job limits only when creating a new job
    if (!isEditing) {
      const plans = [
        { name: 'Free', maxJobs: 2 },
        { name: 'Starter', maxJobs: 5 },
        { name: 'Professional', maxJobs: 20 },
        { name: 'Enterprise', maxJobs: Infinity }
      ];
      const currentPlan = plans.find(p => p.name === me.plan.name);
      const activeJobsCount = jobs.filter(j => j.status === 'Active').length;

      if (currentPlan && currentPlan.maxJobs !== Infinity && activeJobsCount >= currentPlan.maxJobs) {
        toast.error(`You have reached the maximum number of active jobs (${currentPlan.maxJobs}) for your ${me.plan.name} plan. Please upgrade your plan or close existing jobs.`);
        return;
      }
    }

    const effectiveCity =
      jobForm.city === '__other__' ? customCity.trim() : jobForm.city.trim();

    if (!jobForm.title.trim() || !jobForm.company.trim() || !jobForm.state || !effectiveCity || !jobForm.description.trim() || !jobForm.category) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const payload = {
        title: jobForm.title.trim(),
        company: jobForm.company.trim(),
        location: `${effectiveCity}, ${jobForm.state}`.trim(),
        description: jobForm.description.trim(),
        category: jobForm.category,
        industry: 'Other',
        requirements: jobForm.requirements.filter(r => r.trim()),
        responsibilities: jobForm.responsibilities.filter(r => r.trim()),
        skills: jobForm.skills.filter(s => s.trim()),
        benefits: jobForm.benefits.filter(b => b.trim()),
        salary: {
          min: jobForm.salary.min ? parseInt(jobForm.salary.min) : undefined,
          max: jobForm.salary.max ? parseInt(jobForm.salary.max) : undefined,
          currency: jobForm.salary.currency
        },
        experience: {
          min: parseInt(jobForm.experience.min) || 0,
          max: parseInt(jobForm.experience.max) || 10
        },
        employmentType: jobForm.employmentType,
        isRemote: jobForm.isRemote,
        deadline: jobForm.deadline ? new Date(jobForm.deadline) : undefined,
        status: 'Active'
      };

      if (isEditing) {
        await API.put(`/api/jobs/${editingJob._id}`, payload);
        toast.success('Job updated successfully');
      } else {
        await API.post('/api/jobs', payload);
        toast.success('Job created');
      }

      setShowCreateModal(false);
      setEditingJob(null);
      setJobForm({
        title: '', company: '', state: '', city: '', description: '',
        requirements: [''], responsibilities: [''], salary: { min: '', max: '', currency: 'INR' },
        employmentType: 'Full-time', experience: { min: 0, max: 10 }, skills: [''], category: '', isRemote: false, benefits: [''], deadline: ''
      });
      setCustomCity('');
      
      // Refresh user data to get updated plan info
      const userResponse = await API.get('/api/user/me');
      setMe(userResponse.data.user);
      
      fetchMyJobs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} job`);
    }
  };

  // Derived data
  const filteredJobs = useMemo(() => {
    return jobs.filter(j =>
      !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.company.toLowerCase().includes(jobSearch.toLowerCase())
    );
  }, [jobs, jobSearch]);
  const jobsTotalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const pagedJobs = filteredJobs.slice((jobsPage - 1) * pageSize, jobsPage * pageSize);

  const allApps = useMemo(() => jobs.flatMap(job => (job.applications || []).map(app => ({ job, app }))), [jobs]);
  const isFreePlan = me?.plan?.name === 'Free';
  const FREE_LIMIT = 5;
  const appsTotalPages = Math.max(1, Math.ceil(allApps.length / pageSize));
  const pagedApps = allApps.slice((appsPage - 1) * pageSize, appsPage * pageSize);
  const appsForDisplay = isFreePlan ? allApps.slice(0, FREE_LIMIT) : pagedApps;

  const appsWithResumes = useMemo(() => allApps.filter(({ app }) => !!(app.resume || app.user?.resume)), [allApps]);
  const resumesTotalPages = Math.max(1, Math.ceil(appsWithResumes.length / pageSize));
  const pagedResumes = appsWithResumes.slice((resumesPage - 1) * pageSize, resumesPage * pageSize);
  const resumesForDisplay = isFreePlan ? appsWithResumes.slice(0, FREE_LIMIT) : pagedResumes;

  const viewResume = async (job, app) => {
    if (!app?.resume && !app?.resumeUrl && !app?.user?.resume) {
      toast.error('No resume available');
      return;
    }

    try {
      // Use the new endpoint with jobId and applicationId
      const response = await API.get(
        `/api/jobs/applications/${job._id}/${app._id}/view-resume`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Set resume URL for modal and show modal
      setResumeUrl(blobUrl);
      setShowResumeModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to view resume');
    }
  };

  const downloadResume = async (job, app) => {
    if (!app?.resume && !app?.resumeUrl && !app?.user?.resume) {
      toast.error('No resume available');
      return;
    }

    try {
      const response = await API.get(
        `/api/jobs/applications/${job._id}/${app._id}/download-resume`,
        { responseType: 'blob' }
      );
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download resume');
    }
  };

  const updateApplicationStatus = async (applicationId, jobId, newStatus) => {
    try {
      await API.put('/api/jobs/applications/status', { jobId, applicationId, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchMyJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // CV Database functions
  const fetchCvDatabase = async () => {
    setCvLoading(true);
    try {
      const response = await API.get('/api/cv/recruiter/cvs');
      setCvDatabase(response.data.cvs);
      setCvPlanInfo(response.data.planInfo);
    } catch (error) {
      toast.error('Failed to fetch CV database');
      console.error(error);
    } finally {
      setCvLoading(false);
    }
  };

  const viewCvFromDatabase = async (cv) => {
    if (!cv.hasAccess) {
      toast.error('Upgrade your plan to view this CV');
      setActiveTab('plan');
      return;
    }

    try {
      // Fetch PDF through authenticated API to include auth token
      const response = await API.get(`/api/cv/recruiter/cvs/${cv._id}/view`, {
        responseType: 'blob'
      });
      
      // Create blob URL from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open blob URL in new tab (this will display inline, not download)
      const newWindow = window.open(blobUrl, '_blank');
      
      // Clean up blob URL after window opens
      if (newWindow) {
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      } else {
        // If popup blocked, create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Upgrade your plan to view this CV');
        setActiveTab('plan');
      } else {
        console.error('View CV error:', error);
        toast.error('Failed to view CV');
      }
    }
  };

  const downloadCvFromDatabase = async (cv) => {
    if (!cv.hasAccess) {
      toast.error('Upgrade your plan to download this CV');
      setActiveTab('plan');
      return;
    }

    try {
      // CV now has Cloudinary URL - add download parameter
      const cloudinaryUrl = cv.cloudinaryUrl || cv.filePath;
      
      if (cloudinaryUrl && (cloudinaryUrl.startsWith('http://') || cloudinaryUrl.startsWith('https://'))) {
        // For Cloudinary raw files, use direct URL with download attribute
        const link = document.createElement('a');
        link.href = cloudinaryUrl;
        link.download = cv.originalName || 'cv.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CV download started');
      } else {
        // Fallback for old format - call API which will redirect
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cv/recruiter/cvs/${cv._id}/download`, '_blank');
        toast.success('CV download started');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Upgrade your plan to download this CV');
        setActiveTab('plan');
      } else {
        toast.error('Failed to download CV');
      }
      console.error(error);
    }
  };

  // Filter CVs
  const filteredCvs = cvDatabase.filter(cv => {
    const matchesSearch = !cvSearch || 
      cv.originalName?.toLowerCase().includes(cvSearch.toLowerCase()) ||
      cv.candidateName?.toLowerCase().includes(cvSearch.toLowerCase()) ||
      cv.candidateEmail?.toLowerCase().includes(cvSearch.toLowerCase()) ||
      cv.folder?.name?.toLowerCase().includes(cvSearch.toLowerCase());
    const matchesFolder = !cvFolderFilter || cv.folder?._id === cvFolderFilter;
    return matchesSearch && matchesFolder;
  });

  // Pagination for CVs
  const cvTotalPages = Math.max(1, Math.ceil(filteredCvs.length / pageSize));
  const startIndex = (cvPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedCvs = filteredCvs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCvPage(1);
  }, [cvSearch, cvFolderFilter]);

  // Get unique folders for filter
  const uniqueFolders = Array.from(
    new Map(cvDatabase.map(cv => [cv.folder?._id, cv.folder])).values()
  ).filter(Boolean);

  // Check if user has an active plan
  const hasActivePlan = me?.plan?.isActive && me?.plan?.name && 
    (!me?.plan?.endDate || new Date(me.plan.endDate) > new Date());

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
      popular: false,
      maxJobs: 1,
      maxApplications: 50,
      durationDays: 7,
      canViewApplicantDetails: false,
      canViewResumes: false
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
      popular: false,
      maxJobs: 5
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
      popular: true,
      maxJobs: 20
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
      popular: false,
      maxJobs: Infinity
    }
  ];

  if (loading) return null;
  if (!me || me.role !== 'recruiter') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="text-gray-600 mt-2">This page is only available for recruiters.</p>
      </div>
    );
  }

  // Show plans if no active plan
  if (!hasActivePlan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Select a plan to start posting jobs and accessing candidate database</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg border-2 p-8 relative ${
                plan.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-gray-600">{plan.period}</span>}
              </div>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={async () => {
                  if (plan.name === 'Free') {
                    // Check if user is logged in
                    try {
                      const token = localStorage.getItem('token');
                      if (!token) {
                        toast.error('Please register or login first to post a free job');
                        // Redirect to employer login
                        window.location.href = '/employer/login';
                        return;
                      }
                      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                      const response = await API.get('/api/user/me');
                      const user = response.data.user;
                      
                      if (!user || user.role !== 'recruiter') {
                        toast.error('Please register as an employer first to post a free job');
                        window.location.href = '/employer/login';
                        return;
                      }
                      
                      // Activate Free plan and open create job modal
                      await API.put('/api/user/me', {
                        plan: {
                          name: 'Free',
                          startDate: new Date(),
                          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days (1 month) from now
                          isActive: true
                        }
                      });
                      
                      // Refresh user data
                      const updatedResponse = await API.get('/api/user/me');
                      setMe(updatedResponse.data.user);
                      
                      // Open create job modal
                      setJobForm(prev => ({ ...prev, company: user.currentCompany || prev.company }));
                      setShowCreateModal(true);
                    } catch (error) {
                      console.error('Error activating Free plan:', error);
                      if (error.response?.status === 401) {
                        toast.error('Please register or login first to post a free job');
                        window.location.href = '/employer/login';
                      } else {
                        toast.error('Failed to activate free plan. Please try again.');
                      }
                    }
                  } else if (plan.price === 'Custom') {
                    // Enterprise plan - redirect to sales enquiry
                    window.location.href = '/employer/login?tab=sales';
                  } else {
                    // Paid plan - add to cart and navigate to checkout
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
                    } catch (error) {
                      console.error('Error adding plan to cart:', error);
                      toast.error('Failed to add plan to cart');
                    }
                    // Navigate to checkout with all cart items (outside try-catch to ensure it always runs)
                    setTimeout(() => {
                      navigate('/checkout');
                    }, 100);
                  }
                }}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-600 mt-2">Create and manage your jobs, and review applicants.</p>
        </div>
        <button
          onClick={() => {
            if (!hasActivePlan) {
              toast.error('Please subscribe to a plan to create jobs');
              return;
            }
            setEditingJob(null);
            setJobForm(prev => ({
              ...prev,
              title: '',
              company: me?.currentCompany || prev.company || '',
              location: '',
              description: '',
              requirements: [''],
              responsibilities: [''],
              salary: { min: '', max: '', currency: 'INR' },
              employmentType: 'Full-time',
              experience: { min: 0, max: 10 },
              skills: [''],
              category: '',
              isRemote: false,
              benefits: [''],
              deadline: ''
            }));
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Job
        </button>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('jobs')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='jobs'?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <Briefcase className="w-4 h-4 inline mr-2"/> My Jobs
          </button>
          <button 
            onClick={() => {
              if (!hasActivePlan) {
                toast.error('Please subscribe to a plan to view applicants');
                return;
              }
              setActiveTab('applicants');
            }} 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='applicants'?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Users className="w-4 h-4 inline mr-2"/> Applicants
          </button>
          <button 
            onClick={() => {
              if (!hasActivePlan) {
                toast.error('Please subscribe to a plan to view resumes');
                return;
              }
              setActiveTab('resumes');
            }} 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='resumes'?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <FileText className="w-4 h-4 inline mr-2"/> Resumes
          </button>
          <button 
            onClick={() => setActiveTab('cv-database')} 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='cv-database'?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Folder className="w-4 h-4 inline mr-2"/> CV Database
          </button>
          <button 
            onClick={() => setActiveTab('plan')} 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='plan'?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <CreditCard className="w-4 h-4 inline mr-2"/> My Plan
          </button>
        </nav>
      </div>

      {!hasActivePlan && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Active Plan</h3>
          <p className="text-yellow-800">Please subscribe to a plan to access all features.</p>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e)=>{ setJobSearch(e.target.value); setJobsPage(1); }}
                    placeholder="Search jobs..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedJobs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No jobs found</td></tr>
                )}
                {pagedJobs.map(job => (
                  <tr key={job._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e)=>updateJobStatus(job._id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${
                          job.status === 'Active' ? 'bg-green-100 text-green-800'
                          : job.status === 'Closed' ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(job);
                          setJobForm({
                            title: job.title || '',
                            company: job.company || '',
                            location: job.location || '',
                            description: job.description || '',
                            category: job.category || '',
                            industry: job.industry || 'Other',
                            requirements: (job.requirements && job.requirements.length > 0) ? job.requirements : [''],
                            responsibilities: (job.responsibilities && job.responsibilities.length > 0) ? job.responsibilities : [''],
                            skills: (job.skills && job.skills.length > 0) ? job.skills : [''],
                            benefits: (job.benefits && job.benefits.length > 0) ? job.benefits : [''],
                            salary: {
                              min: job.salary?.min || '',
                              max: job.salary?.max || '',
                              currency: job.salary?.currency || 'INR'
                            },
                            experience: {
                              min: job.experience?.min || 0,
                              max: job.experience?.max || 10
                            },
                            employmentType: job.employmentType || 'Full-time',
                            isRemote: !!job.isRemote,
                            deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
                          });
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4 mr-1.5" /> Edit
                      </button>
                      <Link
                        to={`/jobs/${job._id}`}
                        className="inline-flex items-center px-3 py-1.5 border rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1.5"/> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {jobsPage} of {jobsTotalPages}</div>
            <div className="space-x-2">
              <button onClick={()=>setJobsPage(p=>Math.max(1,p-1))} disabled={jobsPage===1} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4 inline"/> Prev</button>
              <button onClick={()=>setJobsPage(p=>Math.min(jobsTotalPages,p+1))} disabled={jobsPage===jobsTotalPages} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Next <ChevronRight className="w-4 h-4 inline"/></button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isFreePlan && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-6">
              <p className="text-yellow-800 text-sm">
                <strong>Free Plan:</strong> You can view full details for up to {FREE_LIMIT} applicants. Upgrade to see more.
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appsForDisplay.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No applicants
                    </td>
                  </tr>
                )}
                {appsForDisplay.length > 0 &&
                  appsForDisplay.map(({ job, app }) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.user?.firstName || 'Candidate'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app._id, job._id, e.target.value)}
                          className="px-2 py-1 border rounded-md text-sm"
                        >
                          {['Under Review', 'Shortlisted', 'Rejected', 'Selected'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="inline-flex items-center px-3 py-1.5 border rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> View Job
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {appsPage} of {isFreePlan ? 1 : appsTotalPages}
            </div>
            <div className="space-x-2">
              <button 
                onClick={()=>setAppsPage(p=>Math.max(1,p-1))} 
                disabled={appsPage===1 || isFreePlan} 
                className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 inline"/> Prev
              </button>
              <button 
                onClick={()=>setAppsPage(p=>Math.min(isFreePlan ? 1 : appsTotalPages, p+1))} 
                disabled={appsPage>=(isFreePlan ? 1 : appsTotalPages) || isFreePlan} 
                className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4 inline"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resumes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resumesForDisplay.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500">No resumes</td></tr>
                ) : (
                  resumesForDisplay.map(({ job, app }) => {
                    const urlExists = !!(app.resume || app.user?.resume);
                    return (
                      <tr key={`${job._id}-${app._id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.user?.firstName || 'Candidate'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => viewResume(job, app)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                              disabled={!urlExists}
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </button>
                            <button
                              onClick={() => downloadResume(job, app)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                              disabled={!urlExists}
                            >
                              <Download className="w-4 h-4 mr-1.5" /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {resumesPage} of {resumesTotalPages}</div>
            <div className="space-x-2">
              <button onClick={()=>setResumesPage(p=>Math.max(1,p-1))} disabled={resumesPage===1} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4 inline"/> Prev</button>
              <button onClick={()=>setResumesPage(p=>Math.min(resumesTotalPages,p+1))} disabled={resumesPage===resumesTotalPages} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Next <ChevronRight className="w-4 h-4 inline"/></button>
            </div>
          </div>
        </div>
      )}

      {/* CV Database Tab */}
      {activeTab === 'cv-database' && (
        <div className="space-y-6">
          {/* Plan Info Banner */}
          {cvPlanInfo && (
            <div className={`rounded-lg p-4 ${
              cvPlanInfo.planName === 'Free' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${
                    cvPlanInfo.planName === 'Free' ? 'text-yellow-900' : 'text-blue-900'
                  }`}>
                    {cvPlanInfo.planName} Plan
                  </p>
                  <p className={`text-sm mt-1 ${
                    cvPlanInfo.planName === 'Free' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {cvPlanInfo.planName === 'Free' 
                      ? `You can access ${cvPlanInfo.accessibleCount} CV(s). Upgrade to access all CVs.`
                      : cvPlanInfo.maxCvs === Infinity
                      ? `You can access all ${cvPlanInfo.totalCount} CV(s).`
                      : `You can access ${cvPlanInfo.accessibleCount} of ${cvPlanInfo.totalCount} CV(s).`
                    }
                  </p>
                </div>
                {cvPlanInfo.planName === 'Free' && (
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search CVs</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={cvSearch}
                    onChange={(e) => setCvSearch(e.target.value)}
                    placeholder="Search by name, email, folder..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Folder</label>
                <select
                  value={cvFolderFilter}
                  onChange={(e) => setCvFolderFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Folders</option>
                  {uniqueFolders.map(folder => (
                    <option key={folder._id} value={folder._id}>
                      {folder.name} {folder.role && `(${folder.role})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CVs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">CV Database</h3>
            </div>
            {cvLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CV Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Folder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCvs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          No CVs available
                        </td>
                      </tr>
                    ) : (
                      pagedCvs.map((cv, index) => {
                        // Count how many blurred CVs we've seen so far
                        const blurredCount = pagedCvs.slice(0, index).filter(c => c.isBlurred).length;
                        const showUpgradeMessage = cv.isBlurred && blurredCount < 2; // Only show for first 2 blurred CVs
                        
                        return (
                          <tr 
                            key={cv._id} 
                            className={`hover:bg-gray-50 relative ${cv.isBlurred ? 'opacity-75' : ''}`}
                          >
                            {cv.isBlurred ? (
                              <td colSpan={5} className="relative px-6 py-4" style={{ position: 'relative' }}>
                                {showUpgradeMessage && (
                                  <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center" style={{ top: 0, bottom: 0, left: 0, right: 0, marginLeft: '-1.5rem', marginRight: '-1.5rem' }}>
                                    <div className="text-center">
                                      <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm font-medium text-gray-600 mb-1">Upgrade to access</p>
                                      <button
                                        onClick={() => setActiveTab('plan')}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                      >
                                        Upgrade Plan
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center blur-md">
                                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{cv.originalName}</div>
                                    <div className="text-xs text-gray-500">
                                      {(cv.fileSize / 1024).toFixed(2)} KB
                                    </div>
                                  </div>
                                </div>
                              </td>
                            ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{cv.originalName}</div>
                                    <div className="text-xs text-gray-500">
                                      {(cv.fileSize / 1024).toFixed(2)} KB
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{cv.folder?.name || '-'}</div>
                                {cv.folder?.role && (
                                  <div className="text-xs text-gray-500">{cv.folder.role}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {cv.candidateName ? (
                                  <div>
                                    <div className="text-sm text-gray-900">{cv.candidateName}</div>
                                    {cv.candidateEmail && (
                                      <div className="text-xs text-gray-500">{cv.candidateEmail}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(cv.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => viewCvFromDatabase(cv)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View CV"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadCvFromDatabase(cv)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Download CV"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {cvPage} of {cvTotalPages}</div>
            <div className="space-x-2">
              <button onClick={()=>setCvPage(p=>Math.max(1,p-1))} disabled={cvPage===1} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4 inline"/> Prev</button>
              <button onClick={()=>setCvPage(p=>Math.min(cvTotalPages,p+1))} disabled={cvPage===cvTotalPages} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Next <ChevronRight className="w-4 h-4 inline"/></button>
            </div>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Current Plan Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            </div>
            <div className="p-6">
              {hasActivePlan && me?.plan ? (
                <div>
                  {/* Expiration Reminder */}
                  {me.plan.endDate && (() => {
                    const endDate = new Date(me.plan.endDate);
                    const now = new Date();
                    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                            <div>
                              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Plan Expiring Soon</h3>
                              <p className="text-sm text-yellow-800">
                                Your {me.plan.name} plan will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'} ({endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}). 
                                Renew or upgrade your plan to continue using all features.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (daysUntilExpiry <= 0) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                            <div>
                              <h3 className="text-sm font-semibold text-red-900 mb-1">Plan Expired</h3>
                              <p className="text-sm text-red-800">
                                Your {me.plan.name} plan has expired. Please renew or upgrade your plan to continue using all features.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{me.plan.name} Plan</h3>
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span>Status: <span className="font-semibold text-gray-900">{me.plan.isActive ? 'Active' : 'Inactive'}</span></span>
                        </div>
                        {me.plan.startDate && (
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span>Start Date: <span className="font-semibold text-gray-900">{new Date(me.plan.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
                          </div>
                        )}
                        {me.plan.endDate && (
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span>End Date: <span className="font-semibold text-gray-900">{new Date(me.plan.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Plan Features</h4>
                      <ul className="space-y-2">
                        {(() => {
                          const currentPlanDetails = plans.find(p => p.name === me.plan.name);
                          return currentPlanDetails?.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You don't have an active plan.</p>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Choose a Plan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Available Plans for Upgrade */}
          {hasActivePlan && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upgrade Your Plan</h2>
                <p className="text-sm text-gray-600 mt-1">Choose a plan that better fits your needs</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans
                    .filter(plan => plan.name !== me?.plan?.name) // Exclude current plan
                    .map((plan) => (
                      <div
                        key={plan.name}
                        className={`bg-white rounded-lg border-2 p-6 relative ${
                          plan.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              Most Popular
                            </span>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                          {plan.period && <span className="text-gray-600">{plan.period}</span>}
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                        <ul className="space-y-2 mb-6">
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm">
                              <span className="text-green-500 mr-2">✓</span>
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={async () => {
                            if (plan.name === 'Free') {
                              toast.info('You already have access to the Free plan');
                              return;
                            }
                            if (plan.price === 'Custom') {
                              // Enterprise plan - redirect to sales enquiry
                              window.location.href = '/employer/login?tab=sales';
                              return;
                            }
                            // Paid plan - add to cart and navigate to checkout
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
                            } catch (error) {
                              console.error('Error adding plan to cart:', error);
                              toast.error('Failed to add plan to cart');
                            }
                            // Navigate to checkout with all cart items (outside try-catch to ensure it always runs)
                            setTimeout(() => {
                              navigate('/checkout');
                            }, 100);
                          }}
                          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                            plan.popular
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {plan.name === 'Free' ? 'Current Plan' : plan.price === 'Custom' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Buy New Plan (if no active plan) */}
          {!hasActivePlan && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
                <p className="text-sm text-gray-600 mt-1">Choose a plan to get started</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`bg-white rounded-lg border-2 p-6 relative ${
                        plan.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-gray-600">{plan.period}</span>}
                      </div>
                      <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={async () => {
                          if (plan.name === 'Free') {
                            try {
                              const token = localStorage.getItem('token');
                              if (!token) {
                                toast.error('Please register or login first');
                                window.location.href = '/employer/login';
                                return;
                              }
                              API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                              await API.put('/api/user/me', {
                                plan: {
                                  name: 'Free',
                                  startDate: new Date(),
                                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days (1 month)
                                  isActive: true
                                }
                              });
                              const updatedResponse = await API.get('/api/user/me');
                              setMe(updatedResponse.data.user);
                              toast.success('Free plan activated successfully!');
                            } catch (err) {
                              console.error('Failed to activate free plan:', err);
                              toast.error('Failed to activate free plan');
                            }
                          } else if (plan.price === 'Custom') {
                            // Enterprise plan - redirect to sales enquiry
                            window.location.href = '/employer/login?tab=sales';
                          } else {
                            // Paid plan - add to cart and navigate to checkout
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
                            } catch (error) {
                              console.error('Error adding plan to cart:', error);
                              toast.error('Failed to add plan to cart');
                            }
                            // Navigate to checkout with all cart items (outside try-catch to ensure it always runs)
                            setTimeout(() => {
                              navigate('/checkout');
                            }, 100);
                          }
                        }}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          plan.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : plan.name === 'Free'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.name === 'Free' ? 'Activate Free Plan' : plan.price === 'Custom' ? 'Contact Sales' : 'Buy now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Job</h2>
                <button onClick={()=>setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={createJob} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input value={jobForm.title} onChange={(e)=>setJobForm({...jobForm, title: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                    <input value={jobForm.company} onChange={(e)=>setJobForm({...jobForm, company: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <select
                            value={jobForm.state}
                            onChange={(e) => {
                              const value = e.target.value;
                              setJobForm(prev => ({
                                ...prev,
                                state: value,
                                city: '' // reset city when state changes
                              }));
                              setCustomCity('');
                            }}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select State</option>
                            {indianStates.map(state => (
                              <option key={state.name} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <select
                            value={jobForm.city}
                            onChange={(e) => setJobForm(prev => ({ ...prev, city: e.target.value }))}
                            required
                            disabled={!jobForm.state}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {jobForm.state ? 'Select City' : 'Select state first'}
                            </option>
                            {jobForm.state &&
                              indianStates
                                .find(s => s.name === jobForm.state)
                                ?.cities.map(city => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))}
                            <option value="__other__">Other / Not listed</option>
                          </select>

                          {jobForm.city === '__other__' && (
                            <input
                              type="text"
                              value={customCity}
                              onChange={(e) => setCustomCity(e.target.value)}
                              placeholder="Enter city name"
                              className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          )}
                        </div>
                      </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select value={jobForm.category} onChange={(e)=>setJobForm({...jobForm, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                    <textarea rows={5} value={jobForm.description} onChange={(e)=>setJobForm({...jobForm, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select value={jobForm.employmentType} onChange={(e)=>setJobForm({...jobForm, employmentType: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center mt-7">
                    <label className="inline-flex items-center text-sm text-gray-700">
                      <input type="checkbox" checked={jobForm.isRemote} onChange={(e)=>setJobForm({...jobForm, isRemote: e.target.checked})} className="mr-2" />
                      Remote Work Available
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exp Min (yrs)</label>
                    <input type="number" value={jobForm.experience.min} onChange={(e)=>setJobForm({...jobForm, experience: { ...jobForm.experience, min: e.target.value }})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exp Max (yrs)</label>
                    <input type="number" value={jobForm.experience.max} onChange={(e)=>setJobForm({...jobForm, experience: { ...jobForm.experience, max: e.target.value }})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                    <input type="date" value={jobForm.deadline} onChange={(e)=>setJobForm({...jobForm, deadline: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Min (monthly)</label>
                    <input type="number" value={jobForm.salary.min} onChange={(e)=>setJobForm({...jobForm, salary: { ...jobForm.salary, min: e.target.value }})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Max (monthly)</label>
                    <input type="number" value={jobForm.salary.max} onChange={(e)=>setJobForm({...jobForm, salary: { ...jobForm.salary, max: e.target.value }})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <input value={jobForm.salary.currency} onChange={(e)=>setJobForm({...jobForm, salary: { ...jobForm.salary, currency: e.target.value }})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                    {jobForm.requirements.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input value={val} onChange={(e)=>{ const arr=[...jobForm.requirements]; arr[idx]=e.target.value; setJobForm({...jobForm, requirements: arr}); }} className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter requirement" />
                        <button type="button" onClick={()=>{ const arr=[...jobForm.requirements]; arr.splice(idx,1); setJobForm({...jobForm, requirements: arr}); }} className="px-3 py-2 text-red-600 hover:text-red-800">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>setJobForm({...jobForm, requirements:[...jobForm.requirements,'']})} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Requirement</button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                    {jobForm.responsibilities.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input value={val} onChange={(e)=>{ const arr=[...jobForm.responsibilities]; arr[idx]=e.target.value; setJobForm({...jobForm, responsibilities: arr}); }} className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter responsibility" />
                        <button type="button" onClick={()=>{ const arr=[...jobForm.responsibilities]; arr.splice(idx,1); setJobForm({...jobForm, responsibilities: arr}); }} className="px-3 py-2 text-red-600 hover:text-red-800">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>setJobForm({...jobForm, responsibilities:[...jobForm.responsibilities,'']})} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Responsibility</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    {jobForm.skills.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input value={val} onChange={(e)=>{ const arr=[...jobForm.skills]; arr[idx]=e.target.value; setJobForm({...jobForm, skills: arr}); }} className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter skill" />
                        <button type="button" onClick={()=>{ const arr=[...jobForm.skills]; arr.splice(idx,1); setJobForm({...jobForm, skills: arr}); }} className="px-3 py-2 text-red-600 hover:text-red-800">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>setJobForm({...jobForm, skills:[...jobForm.skills,'']})} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Skill</button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                    {jobForm.benefits.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input value={val} onChange={(e)=>{ const arr=[...jobForm.benefits]; arr[idx]=e.target.value; setJobForm({...jobForm, benefits: arr}); }} className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter benefit" />
                        <button type="button" onClick={()=>{ const arr=[...jobForm.benefits]; arr.splice(idx,1); setJobForm({...jobForm, benefits: arr}); }} className="px-3 py-2 text-red-600 hover:text-red-800">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>setJobForm({...jobForm, benefits:[...jobForm.benefits,'']})} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Benefit</button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button type="button" onClick={()=>{ setShowCreateModal(false); setEditingJob(null); }} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
        onVerified={async (mobile) => {
          setVerifiedMobile(mobile);
          setShowOTPModal(false);
          
          // Fetch user data by mobile number after OTP verification
          try {
            const cleanedMobile = mobile.replace(/[\s-()]/g, '');
            console.log('RecruiterDashboard: Fetching user data for mobile:', cleanedMobile);
            
            const response = await API.get(`/api/user/by-phone/${cleanedMobile}`);
            
            if (!response.data || !response.data.user) {
              throw new Error('Invalid response from server');
            }
            
            const userData = response.data.user;
            
            console.log('RecruiterDashboard: Fetched user data from backend:', userData);
            console.log('RecruiterDashboard: User data type:', typeof userData);
            console.log('RecruiterDashboard: User data keys:', Object.keys(userData));
            console.log('RecruiterDashboard: User data fields:', {
              _id: userData._id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone,
              location: userData.location,
              city: userData.city,
              role: userData.role
            });
            
            // Verify it's a recruiter
            if (userData.role !== 'recruiter') {
              toast.error('This account is not registered as an employer.');
              return;
            }
            
            // Automatically log in the user after OTP verification
            try {
              const loginResponse = await API.post('/api/auth/login-by-phone', {
                phone: cleanedMobile
              });
              
              if (loginResponse.data.token) {
                // Store token and update API headers
                localStorage.setItem('token', loginResponse.data.token);
                API.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
                
                // Update me state with logged in user
                setMe(loginResponse.data.user);
                
                console.log('RecruiterDashboard: User logged in successfully');
              }
            } catch (loginError) {
              console.error('RecruiterDashboard: Error logging in user:', loginError);
              // Continue anyway - user data is available
            }
            
            // Store user data in both state and ref for immediate access
            paymentUserDataRef.current = userData; // Set ref first (synchronous)
            setPaymentUserData(userData); // Then set state (async)
            
            // Wait a tiny bit to ensure state is set, then open payment gateway
            setTimeout(() => {
              console.log('RecruiterDashboard: Opening payment gateway with userData:', paymentUserDataRef.current);
              setShowPaymentGateway(true);
            }, 50);
          } catch (error) {
            console.error('RecruiterDashboard: Error fetching user data by phone:', error);
            console.error('RecruiterDashboard: Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'Failed to fetch user details. Please try again.';
            toast.error(errorMessage);
            // Don't open payment gateway if fetch fails
            setPaymentUserData(null);
            paymentUserDataRef.current = null;
          }
        }}
        mobile={me?.phone || verifiedMobile}
        purpose="payment"
      />

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <PaymentGateway
          key={`payment-${paymentUserDataRef.current?._id || paymentUserData?._id || paymentUserDataRef.current?.email || paymentUserData?.email || Date.now()}`}
          isOpen={showPaymentGateway}
          onClose={() => {
            setShowPaymentGateway(false);
            setSelectedPlan(null);
            setVerifiedMobile(null);
            setPaymentUserData(null);
            paymentUserDataRef.current = null;
          }}
          plan={selectedPlan}
          userData={(() => {
            const data = paymentUserDataRef.current || paymentUserData;
            console.log('RecruiterDashboard: Passing userData to PaymentGateway:', data);
            console.log('RecruiterDashboard: paymentUserDataRef.current:', paymentUserDataRef.current);
            console.log('RecruiterDashboard: paymentUserData state:', paymentUserData);
            return data;
          })()}
          onSuccess={async () => {
          // Refresh user data to get updated plan
          try {
            const response = await API.get('/api/user/me');
            setMe(response.data.user);
            setShowPaymentGateway(false);
            setSelectedPlan(null);
            setVerifiedMobile(null);
            setPaymentUserData(null);
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }}
        />
      )}

      {/* Resume View Modal */}
      {showResumeModal && resumeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Resume Preview</h2>
              <button
                onClick={() => {
                  setShowResumeModal(false);
                  if (resumeUrl) {
                    window.URL.revokeObjectURL(resumeUrl);
                    setResumeUrl(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={resumeUrl}
                className="w-full h-full border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


