import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
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
  
  // Clear errors as user fixes inputs
  useEffect(() => {
    if (formErrors.coverLetter && applicationForm.coverLetter.trim()) {
      setFormErrors(prev => ({ ...prev, coverLetter: '' }));
    }
  }, [applicationForm.coverLetter]);

  useEffect(() => {
    if (formErrors.resume && (applicationForm.resume || user?.resume)) {
      setFormErrors(prev => ({ ...prev, resume: '' }));
    }
  }, [applicationForm.resume, user?.resume]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setUserLoading(true);
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/user/me')
        .then(response => {
          setUser(response.data.user);
          setUserLoading(false);
        })
        .catch(() => {
          setUser(null);
          setUserLoading(false);
        });
    } else {
      setUser(null);
      setUserLoading(false);
    }

    fetchJob();
  }, [id]);

  // Recompute application state whenever user or job changes
  useEffect(() => {
    if (user && job) {
      computeApplicationState(user, job);
    }
  }, [user, job, id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/jobs/${id}`);
      setJob(response.data);
      // after job loads, recompute application state if user already fetched
      if (user) computeApplicationState(user, response.data);
    } catch (error) {
      toast.error('Failed to fetch job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // derive if current user has applied to this job and get status
  const computeApplicationState = (userData, jobData) => {
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
  };

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              {job.isRemote && (
                <span className="ml-3 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  Remote
                </span>
              )}
            </div>
            
            <div className="flex items-center text-gray-600 mb-4">
              <Building className="w-5 h-5 mr-2" />
              <span className="text-xl font-semibold">{job.company}</span>
              <span className="mx-2">•</span>
              <MapPin className="w-5 h-5 mr-1" />
              <span>{job.location}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                <span>{job.employmentType}</span>
              </div>
              
              {job.experience && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>
                    {job.experience.min}-{job.experience.max} years experience
                  </span>
                </div>
              )}

              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>{formatSalary(job.salary.min, job.salary.max, job.salary.currency)}</span>
                </div>
              )}

              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {job.category}
              </span>
              {job.industry && (
                <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                  {job.industry}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 lg:mt-0 lg:ml-6">
            {userLoading ? (
              <div className="px-6 py-3 rounded-md bg-gray-200 text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Loading...
              </div>
            ) : hasApplied ? (
              <div className="px-6 py-3 rounded-md bg-gray-100 text-gray-500 flex items-center cursor-not-allowed">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                {myApplicationStatus ? `Applied • ${myApplicationStatus}` : 'Applied'}
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
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {user ? 'Apply Now' : 'Login to apply'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Employment Type</span>
                <span className="font-medium">{job.employmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{job.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium">{job.category}</span>
              </div>
              {job.experience && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">
                    {job.experience.min}-{job.experience.max} years
                  </span>
                </div>
              )}
              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary</span>
                  <span className="font-medium">
                    {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                  </span>
                </div>
              )}
              {job.deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className="font-medium">{formatDate(job.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company}</h3>
            <p className="text-gray-600 text-sm">
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
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.coverLetter && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.coverLetter}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume/CV {!applicationForm.resume && <span className="text-red-500">*</span>}
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${formErrors.resume ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
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
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block"
                    >
                      Choose File
                    </label>
                    {applicationForm.resume && (
                      <p className="text-sm text-green-600 mt-2">✓ {applicationForm.resume.name}</p>
                    )}
                  </div>
                  {formErrors.resume && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.resume}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
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
    </div>
  );
}
