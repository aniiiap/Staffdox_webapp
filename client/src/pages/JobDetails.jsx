import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import {
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building,
  Users,
  Calendar,
  ArrowLeft,
  Send,
  FileText,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    resume: null // Store the actual file object
  });
  const [formErrors, setFormErrors] = useState({ coverLetter: '', resume: '' });
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplicationStatus, setMyApplicationStatus] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);

  // Clear errors as user fixes inputs
  useEffect(() => {
    if (formErrors.coverLetter && applicationForm.coverLetter.trim()) {
      setFormErrors(prev => ({ ...prev, coverLetter: '' }));
    }
  }, [applicationForm.coverLetter, formErrors.coverLetter]);

  useEffect(() => {
    if (formErrors.resume && (applicationForm.resume || user?.resume)) {
      setFormErrors(prev => ({ ...prev, resume: '' }));
    }
  }, [applicationForm.resume, user?.resume, formErrors.resume]);

  // derive if current user has applied to this job and get status
  const computeApplicationState = useCallback((userData, jobData) => {
    // Prefer user's appliedJobs for reliable status
    const applied = userData?.appliedJobs?.some(
      (app) => (app.job?._id || app.job)?.toString() === id
    );
    setHasApplied(!!applied);

    if (applied) {
      const myApp = userData.appliedJobs.find(
        (app) => (app.job?._id || app.job)?.toString() === id
      );
      setMyApplicationStatus(myApp?.status || 'Applied');
    } else {
      setMyApplicationStatus(null);
    }

    // Fallback: also check job applications list if present
    if (!applied && Array.isArray(jobData?.applications)) {
      const found = jobData.applications.find(a => (a.user?._id || a.user)?.toString() === userData?._id?.toString());
      if (found) {
        setHasApplied(true);
        setMyApplicationStatus(found.status || 'Applied');
      }
    }
  }, [id]);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/jobs/${id}`);
      setJob(response.data);

      // Fetch related jobs based on category
      if (response.data && response.data.category) {
        try {
          const relatedResponse = await API.get('/api/jobs', {
            params: {
              category: response.data.category,
              limit: 4
            }
          });
          // Filter out current job and limit to 3
          const filtered = (relatedResponse.data.jobs || [])
            .filter(j => j._id !== response.data._id)
            .slice(0, 3);
          setRelatedJobs(filtered);
        } catch (err) {
          console.error('Error fetching related jobs:', err);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Load user data
      const token = localStorage.getItem('token');
      setUserLoading(true);

      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await API.get('/api/user/me');
          if (isMounted) {
            setUser(response.data.user);
            setUserLoading(false);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          if (isMounted) {
            setUser(null);
            setUserLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setUserLoading(false);
        }
      }

      // Load job data
      if (isMounted) {
        try {
          await fetchJob();
        } catch (error) {
          console.error('Error fetching job:', error);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, fetchJob]);

  // Recompute application state whenever user or job changes
  useEffect(() => {
    if (user && job) {
      computeApplicationState(user, job);
    } else {
      // Reset state if user or job is not available
      setHasApplied(false);
      setMyApplicationStatus(null);
    }
  }, [user, job, computeApplicationState]);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    // Client-side validation: require cover letter and a resume
    const errors = { coverLetter: '', resume: '' };
    if (!applicationForm.coverLetter.trim()) {
      errors.coverLetter = 'Cover letter/description is required.';
    }
    // Require resume file to be uploaded in the form
    if (!applicationForm.resume) {
      errors.resume = 'Resume/CV is required. Please upload your resume.';
    }
    setFormErrors(errors);
    if (errors.coverLetter || errors.resume) {
      return;
    }

    setApplying(true);
    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('coverLetter', applicationForm.coverLetter);
      formData.append('resume', applicationForm.resume);

      await API.post(`/api/jobs/${id}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowApplicationModal(false);
      setApplicationForm({ coverLetter: '', resume: null });
      setFormErrors({ coverLetter: '', resume: '' });
      // Refresh job data to show updated application count
      fetchJob();
      // Refresh user data so the button state updates immediately
      try {
        const { data } = await API.get('/api/user/me');
        setUser(data.user);
        computeApplicationState(data.user, job);
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit application';
      const apiErrors = { coverLetter: '', resume: '' };
      if (msg.toLowerCase().includes('cover letter') || msg.toLowerCase().includes('description')) {
        apiErrors.coverLetter = 'Cover letter/description is required.';
      }
      if (msg.toLowerCase().includes('resume')) {
        apiErrors.resume = 'Resume is required. Upload here or add it in your Profile.';
      }
      setFormErrors(apiErrors);
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {job && (
        <SEO
          title={`${job.title} at ${job.company}`}
          description={`${job.title} at ${job.company} in ${job.location}. ${job.description ? job.description.substring(0, 150) + '...' : ''}`}
          keywords={`${job.title}, ${job.company}, ${job.skills?.join(', ')}, job in ${job.location}`}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: job.title,
            description: job.description,
            datePosted: job.createdAt,
            validThrough: job.deadline,
            employmentType: job.employmentType ? job.employmentType.toUpperCase().replace(' ', '_') : 'FULL_TIME',
            hiringOrganization: {
              '@type': 'Organization',
              name: job.company,
              // logo: job.companyLogo // If available
            },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: job.location,
                addressCountry: 'IN' // Assuming India based on context
              }
            },
            baseSalary: job.salary && (job.salary.min || job.salary.max) ? {
              '@type': 'MonetaryAmount',
              currency: job.salary.currency || 'INR',
              value: {
                '@type': 'QuantitativeValue',
                minValue: job.salary.min,
                maxValue: job.salary.max,
                unitText: 'YEAR' // Assuming annual, can adjust if per month
              }
            } : undefined
          }}
        />
      )}
      {/* Back Button */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{job.title}</h1>
              {job.isRemote && (
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-green-100 text-green-800 rounded-full self-start sm:self-auto">
                  Remote
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-3 sm:mb-4 gap-1 sm:gap-0">
              <div className="flex items-center">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="text-base sm:text-lg lg:text-xl font-semibold truncate">{job.company}</span>
              </div>
              <span className="hidden sm:inline mx-2">•</span>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              <div className="flex items-center">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span>{job.employmentType}</span>
              </div>

              {job.experience && (
                <div className="flex items-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {job.experience.min}-{job.experience.max} years experience
                  </span>
                </div>
              )}

              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="flex items-center">
                  <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{formatSalary(job.salary.min, job.salary.max, job.salary.currency)}</span>
                </div>
              )}

              <div className="flex items-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {job.category}
              </span>
              {job.industry && (
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                  {job.industry}
                </span>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto lg:mt-0 lg:ml-6 flex-shrink-0">
            {userLoading ? (
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-md bg-gray-200 text-gray-500 flex items-center justify-center text-sm sm:text-base">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Loading...
              </div>
            ) : hasApplied ? (
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center cursor-not-allowed text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                <span className="text-center">{myApplicationStatus ? `Applied • ${myApplicationStatus}` : 'Applied'}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    setShowApplicationModal(true);
                  }
                }}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                disabled={userLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                {user ? 'Apply Now' : 'Login to apply'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Job Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Summary</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Employment Type</span>
                <span className="text-xs sm:text-sm font-medium">{job.employmentType}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Location</span>
                <span className="text-xs sm:text-sm font-medium break-words sm:text-right">{job.location}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Category</span>
                <span className="text-xs sm:text-sm font-medium">{job.category}</span>
              </div>
              {job.experience && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-gray-600">Experience</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {job.experience.min}-{job.experience.max} years
                  </span>
                </div>
              )}
              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-gray-600">Salary</span>
                  <span className="text-xs sm:text-sm font-medium break-words sm:text-right">
                    {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                  </span>
                </div>
              )}
              {job.deadline && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-gray-600">Application Deadline</span>
                  <span className="text-xs sm:text-sm font-medium">{formatDate(job.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">About {job.company}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              This is a great opportunity to work with {job.company}.
              Apply now to be part of their team!
            </p>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 pr-2 break-words">Apply for {job.title}</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    value={applicationForm.coverLetter}
                    onChange={(e) => {
                      const value = e.target.value;
                      setApplicationForm(prev => ({ ...prev, coverLetter: value }));
                      if (formErrors.coverLetter && value.trim()) {
                        setFormErrors(prev => ({ ...prev, coverLetter: '' }));
                      }
                    }}
                    rows={6}
                    maxLength={180}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit... (max 180 characters)"
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                  {formErrors.coverLetter && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">{formErrors.coverLetter}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Resume/CV {!applicationForm.resume && <span className="text-red-500">*</span>}
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center ${formErrors.resume ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Upload your resume (PDF, DOC, DOCX)
                      {!applicationForm.resume && <span className="text-red-500"> *Required</span>}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      required
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setApplicationForm(prev => ({ ...prev, resume: file }));
                          if (formErrors.resume) {
                            setFormErrors(prev => ({ ...prev, resume: '' }));
                          }
                        } else {
                          setApplicationForm(prev => ({ ...prev, resume: null }));
                        }
                      }}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block text-xs sm:text-sm font-medium"
                    >
                      Choose File
                    </label>
                    {applicationForm.resume && (
                      <p className="text-xs sm:text-sm text-green-600 mt-2 break-words">✓ {applicationForm.resume.name}</p>
                    )}
                  </div>
                  {formErrors.resume && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">{formErrors.resume}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm sm:text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base font-medium"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Related Jobs Section */}
      {relatedJobs.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0">Similar Jobs You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedJobs.map((relatedJob) => (
              <Link
                key={relatedJob._id}
                to={`/jobs/${relatedJob._id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 flex flex-col h-full"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{relatedJob.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2 text-sm">
                    <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{relatedJob.company}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4 text-sm">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{relatedJob.location}</span>
                  </div>
                  {relatedJob.salary && (relatedJob.salary.min || relatedJob.salary.max) && (
                    <div className="flex items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-full w-fit mb-4 text-xs font-medium">
                      <IndianRupee className="w-3 h-3 mr-1" />
                      <span>{formatSalary(relatedJob.salary.min, relatedJob.salary.max, relatedJob.salary.currency || 'INR')}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatDate(relatedJob.createdAt)}</span>
                  </div>
                  <span className="text-blue-600 font-medium group-hover:underline">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
