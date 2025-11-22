import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Upload,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const categories = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales',
    'Human Resources', 'Operations', 'Design', 'Education', 'Other'
  ];

  const employmentTypes = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'
  ];

  const availabilityOptions = [
    'Immediate', '2 weeks', '1 month', '2 months', '3+ months'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/user/me')
        .then(response => {
          setMe(response.data.user);
          
          // Format workExperience dates for date inputs (YYYY-MM-DD format)
          const formattedWorkExperience = (response.data.user.workExperience || []).map(exp => ({
            ...exp,
            startDate: exp.startDate ? (typeof exp.startDate === 'string' ? exp.startDate.split('T')[0] : new Date(exp.startDate).toISOString().split('T')[0]) : '',
            endDate: exp.endDate && !exp.current ? (typeof exp.endDate === 'string' ? exp.endDate.split('T')[0] : new Date(exp.endDate).toISOString().split('T')[0]) : ''
          }));
          
          setForm({
            ...response.data.user,
            jobPreferences: response.data.user.jobPreferences || {
              preferredLocations: [],
              preferredJobTypes: [],
              expectedSalary: { min: '', max: '', currency: 'INR' },
              preferredIndustries: [],
              availability: ''
            },
            education: response.data.user.education || [],
            workExperience: formattedWorkExperience,
            skills: response.data.user.skills || []
          });
        })
        .catch(error => {
          console.error('Failed to fetch profile:', error);
          toast.error('Failed to load profile');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        // One level: jobPreferences.availability
        const [parent, child] = parts;
        setForm(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        // Two levels: jobPreferences.expectedSalary.min
        const [parent, middle, child] = parts;
        setForm(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [middle]: {
              ...prev[parent]?.[middle],
              [child]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
            }
          }
        }));
      }
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayInputChange = (field, index, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        year: '',
        field: ''
      }]
    }));
  };

  const addWorkExperience = () => {
    setForm(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data } = await API.put('/api/user/me', form);
      setMe(data.user);
      
      // Format workExperience dates for date inputs after update
      const formattedWorkExperience = (data.user.workExperience || []).map(exp => ({
        ...exp,
        startDate: exp.startDate ? (typeof exp.startDate === 'string' ? exp.startDate.split('T')[0] : new Date(exp.startDate).toISOString().split('T')[0]) : '',
        endDate: exp.endDate && !exp.current ? (typeof exp.endDate === 'string' ? exp.endDate.split('T')[0] : new Date(exp.endDate).toISOString().split('T')[0]) : ''
      }));
      
      setForm(prev => ({
        ...prev,
        workExperience: formattedWorkExperience
      }));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingResume(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await API.post('/api/user/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update state with the returned user data (which includes updated resume path)
      if (data.user) {
        setMe(data.user);
        setForm(data.user);
      } else {
        // Fallback: refresh user data from server
        const userResponse = await API.get('/api/user/me');
        setMe(userResponse.data.user);
        setForm(userResponse.data.user);
      }
      
      // Small delay to ensure Cloudinary has processed the file
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload resume:', error);
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleViewResume = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!me?.resume) {
      toast.error('No resume to view');
      return;
    }
    // Fetch PDF through authenticated API to include auth token
    // Add timestamp to prevent caching of old resume
    try {
      const response = await API.get('/api/user/view-resume', {
        responseType: 'blob',
        params: {
          _t: Date.now() // Cache-busting parameter
        }
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
      console.error('View resume error:', error);
      toast.error('Failed to view resume');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {me.role === 'recruiter' ? 'Employer Profile' : me.role === 'admin' ? 'Admin Profile' : 'Profile Settings'}
        </h1>
        <p className="mt-2 text-gray-600">
          {me.role === 'recruiter' 
            ? 'Manage your employer account information' 
            : me.role === 'admin'
            ? 'Manage your admin account information'
            : 'Manage your professional profile and job preferences'}
        </p>
      </div>

      {/* Profile Completeness - Only for regular users */}
      {me.role === 'user' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Profile Completeness</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Profile Progress</span>
              <span>{me.profileCompleteness || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${me.profileCompleteness || 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Complete your profile to increase your chances of getting noticed by employers
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        {me.role === 'user' && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'basic', label: 'Basic Info', icon: User },
                { id: 'professional', label: 'Professional', icon: Briefcase },
                { id: 'education', label: 'Education', icon: GraduationCap },
                { id: 'experience', label: 'Experience', icon: Award },
                { id: 'preferences', label: 'Job Preferences', icon: MapPin }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <form onSubmit={updateProfile} className="p-6">
          {/* Recruiter Profile - Simplified */}
          {me.role === 'recruiter' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleInputChange}
                    placeholder="+91 1234567890"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="currentCompany"
                    value={form.currentCompany || ''}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="currentPosition"
                    value={form.currentPosition || ''}
                    onChange={handleInputChange}
                    placeholder="Your designation/role"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location || ''}
                    onChange={handleInputChange}
                    placeholder="City, State, Country"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin Profile - Simplified */}
          {me.role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Admin Account:</strong> You have full administrative access to manage users, jobs, and system settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleInputChange}
                    placeholder="+91 1234567890"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value="Administrator"
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location || ''}
                    onChange={handleInputChange}
                    placeholder="City, State, Country"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Basic Information Tab - For regular users */}
          {me.role === 'user' && activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location || ''}
                    onChange={handleInputChange}
                    placeholder="City, State"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    name="linkedinProfile"
                    value={form.linkedinProfile || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio/Website
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={form.portfolio || ''}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Professional Information Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Position
                  </label>
                  <input
                    type="text"
                    name="currentPosition"
                    value={form.currentPosition || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Company
                  </label>
                  <input
                    type="text"
                    name="currentCompany"
                    value={form.currentCompany || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Corp"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={form.experience || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="space-y-2">
                  {form.skills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => handleArrayInputChange('skills', index, e.target.value)}
                        placeholder="Enter skill"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('skills', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('skills')}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resume/CV
                  </label>
                  <Link
                    to="/your-cv"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Manage CV →
                  </Link>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {me?.resume ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <FileText className="w-12 h-12 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Resume uploaded successfully!</p>
                        <p className="text-xs text-gray-500 mt-1">
                          File: {me.resume.split('/').pop()}
                        </p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={handleViewResume}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Resume
                        </button>
                        <label className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                          Replace Resume
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Upload className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 mb-2">Upload your resume (PDF, DOC, DOCX)</p>
                        <p className="text-xs text-gray-500 mb-3">Maximum file size: 5MB</p>
                        <p className="text-xs text-blue-600 mb-2">
                          For full CV management, visit{' '}
                          <Link to="/your-cv" className="font-medium underline">
                            Your CV page
                          </Link>
                        </p>
                      </div>
                      <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block">
                        {uploadingResume ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                          disabled={uploadingResume}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              {form.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          education: prev.education.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEducation = [...form.education];
                          newEducation[index].degree = e.target.value;
                          setForm(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="e.g., Bachelor of Technology"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...form.education];
                          newEducation[index].institution = e.target.value;
                          setForm(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="e.g., IIT Delhi"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => {
                          const newEducation = [...form.education];
                          newEducation[index].field = e.target.value;
                          setForm(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="e.g., Computer Science"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        value={edu.year}
                        onChange={(e) => {
                          const newEducation = [...form.education];
                          newEducation[index].year = e.target.value;
                          setForm(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="e.g., 2020"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addEducation}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Education
              </button>
            </div>
          )}

          {/* Work Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {form.workExperience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          workExperience: prev.workExperience.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...form.workExperience];
                          newExperience[index].company = e.target.value;
                          setForm(prev => ({ ...prev, workExperience: newExperience }));
                        }}
                        placeholder="e.g., Google"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...form.workExperience];
                          newExperience[index].position = e.target.value;
                          setForm(prev => ({ ...prev, workExperience: newExperience }));
                        }}
                        placeholder="e.g., Senior Software Engineer"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => {
                          const newExperience = [...form.workExperience];
                          newExperience[index].startDate = e.target.value;
                          setForm(prev => ({ ...prev, workExperience: newExperience }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => {
                          const newExperience = [...form.workExperience];
                          newExperience[index].endDate = e.target.value;
                          setForm(prev => ({ ...prev, workExperience: newExperience }));
                        }}
                        disabled={exp.current}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => {
                          const newExperience = [...form.workExperience];
                          newExperience[index].current = e.target.checked;
                          if (e.target.checked) {
                            newExperience[index].endDate = '';
                          }
                          setForm(prev => ({ ...prev, workExperience: newExperience }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Currently working here</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExperience = [...form.workExperience];
                        newExperience[index].description = e.target.value;
                        setForm(prev => ({ ...prev, workExperience: newExperience }));
                      }}
                      rows={3}
                      placeholder="Describe your role and achievements"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addWorkExperience}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Work Experience
              </button>
            </div>
          )}

          {/* Job Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Locations
                  </label>
                  <div className="space-y-2">
                    {form.jobPreferences.preferredLocations.map((location, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => {
                            const newLocations = [...form.jobPreferences.preferredLocations];
                            newLocations[index] = e.target.value;
                            setForm(prev => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                preferredLocations: newLocations
                              }
                            }));
                          }}
                          placeholder="Enter location"
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newLocations = form.jobPreferences.preferredLocations.filter((_, i) => i !== index);
                            setForm(prev => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                preferredLocations: newLocations
                              }
                            }));
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          jobPreferences: {
                            ...prev.jobPreferences,
                            preferredLocations: [...prev.jobPreferences.preferredLocations, '']
                          }
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Location
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Types
                  </label>
                  <div className="space-y-2">
                    {employmentTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.jobPreferences.preferredJobTypes.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...form.jobPreferences.preferredJobTypes, type]
                              : form.jobPreferences.preferredJobTypes.filter(t => t !== type);
                            setForm(prev => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                preferredJobTypes: newTypes
                              }
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary Range (LPA)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="jobPreferences.expectedSalary.min"
                      value={form.jobPreferences.expectedSalary.min}
                      onChange={handleInputChange}
                      placeholder="Min"
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      name="jobPreferences.expectedSalary.max"
                      value={form.jobPreferences.expectedSalary.max}
                      onChange={handleInputChange}
                      placeholder="Max"
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    name="jobPreferences.availability"
                    value={form.jobPreferences.availability}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select availability</option>
                    {availabilityOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Industries
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.jobPreferences.preferredIndustries.includes(category)}
                        onChange={(e) => {
                          const newIndustries = e.target.checked
                            ? [...form.jobPreferences.preferredIndustries, category]
                            : form.jobPreferences.preferredIndustries.filter(i => i !== category);
                          setForm(prev => ({
                            ...prev,
                            jobPreferences: {
                              ...prev.jobPreferences,
                              preferredIndustries: newIndustries
                            }
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t mt-8">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
      </form>
      </div>
    </div>
  );
}
