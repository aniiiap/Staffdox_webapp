import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../utils/api';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Building,
  Filter,
  Search,
  Download,
  UserCheck,
  FileText,
  Mail,
  Phone,
  X,
  Folder,
  FolderPlus,
  Upload,
  FolderOpen,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    categoryStats: []
  });
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: ''
  });
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: ''
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [jobsPage, setJobsPage] = useState(1);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [resumesPage, setResumesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [cvPage, setCvPage] = useState(1);
  const pageSize = 10;

  // CV Management state
  const [cvFolders, setCvFolders] = useState([]);
  const [cvUploads, setCvUploads] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showCvUploadModal, setShowCvUploadModal] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);
  const [selectedCvIds, setSelectedCvIds] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [selectAllCvs, setSelectAllCvs] = useState(false);
  const [showCvPreviewModal, setShowCvPreviewModal] = useState(false);
  const [cvPreviewUrl, setCvPreviewUrl] = useState(null);
  const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
  const [showCvCommentModal, setShowCvCommentModal] = useState(false);
  const [cvCommentLoading, setCvCommentLoading] = useState(false);
  const [cvCommentForm, setCvCommentForm] = useState({
    cvId: null,
    reason: '',
    description: ''
  });
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    role: '',
    files: []
  });
  const [cvUploadForm, setCvUploadForm] = useState({
    folderId: '',
    candidateName: '',
    candidateEmail: '',
    notes: '',
    files: []
  });
  const [cvFilter, setCvFilter] = useState({
    folderId: '',
    search: ''
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const categories = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales',
    'Human Resources', 'Operations', 'Design', 'Education', 'Other'
  ];

  const employmentTypes = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'
  ];

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    salary: { min: '', max: '', currency: 'INR' },
    employmentType: 'Full-time',
    experience: { min: 0, max: 10 },
    skills: [''],
    category: '',
    industry: '',
    isRemote: false,
    benefits: [''],
    deadline: ''
  });

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'cv-management') {
      const fetchData = async () => {
        setCvLoading(true);
        try {
          // Fetch folders and CVs in parallel for better performance
          const params = new URLSearchParams();
          if (cvFilter.folderId) {
            params.append('folderId', cvFilter.folderId);
          }
          
          const [foldersResponse, cvsResponse] = await Promise.all([
            API.get('/api/cv/folders'),
            API.get(`/api/cv/cvs?${params.toString()}`)
          ]);
          
          setCvFolders(foldersResponse.data.folders);
          setCvUploads(cvsResponse.data.cvs);
        } catch (error) {
          console.error('Error fetching CV data:', error);
          toast.error('Failed to load CV data');
        } finally {
          setCvLoading(false);
        }
      };
      fetchData();
    }
  }, [activeTab, cvFilter.folderId]);

  // Read tab from query string (e.g., /admin?tab=resumes)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/api/user/all');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/api/jobs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/jobs?includeAll=true');
      // Response shape: { jobs, totalPages, currentPage, total }
      setJobs(response.data.jobs || response.data);
    } catch (error) {
      toast.error('Failed to fetch jobs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setJobForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setJobForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayInputChange = (field, index, value) => {
    setJobForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setJobForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setJobForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!jobForm.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!jobForm.company.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!jobForm.location.trim()) {
      toast.error('Location is required');
      return;
    }
    if (!jobForm.description.trim()) {
      toast.error('Job description is required');
      return;
    }
    if (!jobForm.category) {
      toast.error('Job category is required');
      return;
    }

    try {
      const jobData = {
        title: jobForm.title.trim(),
        company: jobForm.company.trim(),
        location: jobForm.location.trim(),
        description: jobForm.description.trim(),
        category: jobForm.category,
        industry: jobForm.industry || 'Other',
        requirements: jobForm.requirements.filter(req => req.trim()),
        responsibilities: jobForm.responsibilities.filter(resp => resp.trim()),
        skills: jobForm.skills.filter(skill => skill.trim()),
        benefits: jobForm.benefits.filter(benefit => benefit.trim()),
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

      console.log('Submitting job data:', jobData);

      if (editingJob) {
        await API.put(`/api/jobs/${editingJob._id}`, jobData);
        toast.success('Job updated successfully');
      } else {
        await API.post('/api/jobs', jobData);
        toast.success('Job created successfully');
      }

      setShowCreateModal(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Job submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    }
  };

  const resetForm = () => {
    setJobForm({
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: [''],
      responsibilities: [''],
      salary: { min: '', max: '', currency: 'INR' },
      employmentType: 'Full-time',
      experience: { min: 0, max: 10 },
      skills: [''],
      category: '',
      industry: '',
      isRemote: false,
      benefits: [''],
      deadline: ''
    });
  };

  const editJob = (job) => {
    setEditingJob(job);
    setJobForm({
      ...job,
      salary: {
        min: job.salary?.min || '',
        max: job.salary?.max || '',
        currency: job.salary?.currency || 'INR'
      },
      experience: {
        min: job.experience?.min || 0,
        max: job.experience?.max || 10
      },
      requirements: job.requirements.length > 0 ? job.requirements : [''],
      responsibilities: job.responsibilities.length > 0 ? job.responsibilities : [''],
      skills: job.skills.length > 0 ? job.skills : [''],
      benefits: job.benefits.length > 0 ? job.benefits : [''],
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
    });
    setShowCreateModal(true);
  };

  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await API.delete(`/api/jobs/${jobId}`);
        toast.success('Job deleted successfully');
        fetchJobs();
        fetchStats();
      } catch {
        toast.error('Failed to delete job');
      }
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await API.delete(`/api/user/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete user';
        toast.error(errorMessage);
      }
    }
  };

  const downloadResume = async (userId) => {
    try {
      // Find user in the users list to get resume URL
      const user = users.find(u => u._id === userId);
      
      if (user?.resume) {
        // Resume is now a Cloudinary URL - create download link
        let downloadUrl = user.resume;
        if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
          // For Cloudinary raw files, use direct URL with download attribute
          // Create a temporary anchor element to trigger download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = user.firstName ? `${user.firstName}_${user.lastName || ''}_Resume.pdf` : 'resume.pdf';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Fallback for old format - call API which will redirect
          window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/download-resume/${userId}`, '_blank');
        }
      } else {
        // Fetch user if not in list
        const userResponse = await API.get(`/api/user/${userId}`);
        const fetchedUser = userResponse.data.user;
        if (fetchedUser?.resume) {
          let downloadUrl = fetchedUser.resume;
          if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
            // For Cloudinary raw files, use direct URL with download attribute
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fetchedUser.firstName ? `${fetchedUser.firstName}_${fetchedUser.lastName || ''}_Resume.pdf` : 'resume.pdf';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/download-resume/${userId}`, '_blank');
          }
        } else {
          toast.error('Resume not found');
        }
      }
    } catch (error) {
      console.error('Download resume error:', error);
      toast.error('Failed to download resume');
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const viewResume = async (user) => {
    if (!user?.resume) {
      toast.error('No resume uploaded');
      return;
    }
    
    try {
      const userId = user._id || user.id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      // Fetch PDF through authenticated API for admin to view user's resume
      const response = await API.get(`/api/user/recruiter/view-resume/${userId}`, {
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
      console.error('View resume error:', error);
      toast.error('Failed to view resume');
    }
  };

  const viewApplicationDetails = async (application, job) => {
    try {
      // Fetch complete user data to ensure we have all fields including resume
      const response = await API.get(`/api/user/${application.user._id}`);
      const completeUser = response.data.user;
      
      setSelectedApplication({ 
        ...application, 
        job,
        user: completeUser // Use the complete user data
      });
      setShowApplicationModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load application details');
      // Fallback to original data if API call fails
      setSelectedApplication({ ...application, job });
      setShowApplicationModal(true);
    }
  };

  const updateApplicationStatus = async (applicationId, jobId, newStatus) => {
    try {
      await API.put('/api/jobs/applications/status', { jobId, applicationId, status: newStatus });
      toast.success(`Application status updated to ${newStatus}`);
      fetchJobs(); // Refresh to get updated data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update application status');
      console.error(error);
    }
  };

  const deleteApplication = async (applicationId, jobId) => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      try {
        await API.delete(`/api/jobs/applications/${jobId}/${applicationId}`);
        toast.success('Application deleted successfully');
        fetchJobs(); // Refresh to get updated data
        fetchStats(); // Refresh stats
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete application');
        console.error(error);
      }
    }
  };

  const deleteSalesEnquiry = async (enquiryId) => {
    if (window.confirm('Are you sure you want to delete this sales enquiry? This action cannot be undone.')) {
      try {
        await API.delete(`/api/user/recruiter/applications/${enquiryId}`);
        toast.success('Sales enquiry deleted successfully');
        // Refresh the list
        API.get('/api/user/recruiter/applications')
          .then(r => setRecruiterApps(r.data.applications))
          .catch(() => toast.error('Failed to refresh applications'));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete sales enquiry');
        console.error(error);
      }
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await API.put(`/api/jobs/${jobId}`, { status: newStatus });
      toast.success(`Job status updated to ${newStatus}`);
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update job status');
      console.error(error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || job.status === filters.status;
    const matchesCategory = !filters.category || job.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setJobsPage(1);
    setApplicationsPage(1);
    setUsersPage(1);
  }, [filters, userFilters]);

  const jobsTotalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const pagedJobs = filteredJobs.slice((jobsPage - 1) * pageSize, jobsPage * pageSize);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !userFilters.search || 
      user.firstName?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.email?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.currentPosition?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.currentCompany?.toLowerCase().includes(userFilters.search.toLowerCase());
    const matchesRole = !userFilters.role || user.role === userFilters.role;
    
    return matchesSearch && matchesRole;
  });
  // Users pagination (10/page)
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((usersPage - 1) * pageSize, usersPage * pageSize);
  const usersWithResumes = filteredUsers.filter(u => !!u.resume);
  const resumesTotalPages = Math.max(1, Math.ceil(usersWithResumes.length / pageSize));
  const pagedResumes = usersWithResumes.slice((resumesPage - 1) * pageSize, resumesPage * pageSize);
  // Recruiter Applications & Recruiters
  const [recruiterApps, setRecruiterApps] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [salesEnquirySort, setSalesEnquirySort] = useState('newest'); // 'newest' or 'oldest'

  useEffect(() => {
    if (activeTab === 'recruiter_apps') {
      API.get('/api/user/recruiter/applications')
        .then(r => setRecruiterApps(r.data.applications))
        .catch(() => toast.error('Failed to load applications'));
    } else if (activeTab === 'recruiters') {
      API.get('/api/user/recruiters')
        .then(r => setRecruiters(r.data.recruiters))
        .catch(() => toast.error('Failed to load recruiters'));
    }
  }, [activeTab]);

  // CV Management functions
  const fetchCvFolders = async () => {
    try {
      const response = await API.get('/api/cv/folders');
      setCvFolders(response.data.folders);
    } catch (error) {
      toast.error('Failed to fetch CV folders');
      console.error(error);
    }
  };

  const fetchCvUploads = async () => {
    setCvLoading(true);
    try {
      const params = new URLSearchParams();
      if (cvFilter.folderId) {
        params.append('folderId', cvFilter.folderId);
      }
      const response = await API.get(`/api/cv/cvs?${params.toString()}`);
      setCvUploads(response.data.cvs);
    } catch (error) {
      toast.error('Failed to fetch CVs');
      console.error(error);
    } finally {
      setCvLoading(false);
    }
  };

  const createFolder = async (e) => {
    // This function is now used by the enhanced onSubmit handler in the modal,
    // so it should only be responsible for calling the API and returning the folder.
    e.preventDefault && e.preventDefault();
    if (!folderForm.name.trim()) {
      toast.error('Folder name is required');
      return null;
    }

    try {
      const response = await API.post('/api/cv/folders', {
        name: folderForm.name,
        description: folderForm.description,
        role: folderForm.role
      });
      toast.success('Folder created successfully');
      return response.data.folder;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
      throw error;
    }
  };

  const deleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its CVs?')) {
      return;
    }

    try {
      await API.delete(`/api/cv/folders/${folderId}`);
      toast.success('Folder deleted successfully');
      fetchCvFolders();
      fetchCvUploads();
      if (selectedFolder?._id === folderId) {
        setSelectedFolder(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const uploadCv = async (e) => {
    e.preventDefault();

    if (isUploadingCv) return;

    if (!cvUploadForm.files || cvUploadForm.files.length === 0) {
      toast.error('Please select at least one CV file to upload');
      return;
    }
    if (!cvUploadForm.folderId) {
      toast.error('Please select a folder');
      return;
    }

    try {
      setIsUploadingCv(true);
      const uploads = cvUploadForm.files.map((file) => {
        const formData = new FormData();
        formData.append('cv', file);
        formData.append('folderId', cvUploadForm.folderId);
        if (cvUploadForm.candidateName) {
          formData.append('candidateName', cvUploadForm.candidateName);
        }
        if (cvUploadForm.candidateEmail) {
          formData.append('candidateEmail', cvUploadForm.candidateEmail);
        }
        if (cvUploadForm.notes) {
          formData.append('notes', cvUploadForm.notes);
        }

        return API.post('/api/cv/cvs/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });

      await Promise.all(uploads);

      toast.success(`Uploaded ${cvUploadForm.files.length} CV(s) successfully`);
      setShowCvUploadModal(false);
      setCvUploadForm({
        folderId: '',
        candidateName: '',
        candidateEmail: '',
        notes: '',
        files: []
      });
      fetchCvFolders();
      fetchCvUploads();
    } catch (error) {
      console.error('Upload CV error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload CV(s)');
    } finally {
      setIsUploadingCv(false);
    }
  };

  const deleteCv = async (cvId) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) {
      return;
    }

    try {
      await API.delete(`/api/cv/cvs/${cvId}`);
      toast.success('CV deleted successfully');
      fetchCvFolders();
      fetchCvUploads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete CV');
    }
  };

  const viewCv = async (cv) => {
    try {
      setCvPreviewLoading(true);
      setShowCvPreviewModal(true);
      // Fetch PDF through authenticated API to include auth token
      const response = await API.get(`/api/cv/cvs/${cv._id}/view`, {
        responseType: 'blob'
      });

      // Create blob URL from response and store it for iframe preview
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      // Revoke previous URL if any
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }

      setCvPreviewUrl(blobUrl);
      setCvPreviewLoading(false);
    } catch (error) {
      console.error('View CV error:', error);
      toast.error('Failed to view CV');
      setCvPreviewLoading(false);
      setShowCvPreviewModal(false);
    }
  };

  const openCvCommentModal = (cv) => {
    setCvCommentForm({
      cvId: cv._id,
      reason: cv.commentReason || '',
      description: cv.commentDescription || ''
    });
    setShowCvCommentModal(true);
  };

  const saveCvComment = async (e) => {
    e.preventDefault();
    if (!cvCommentForm.cvId) return;
    try {
      setCvCommentLoading(true);
      await API.put(`/api/cv/cvs/${cvCommentForm.cvId}/notes`, {
        reason: cvCommentForm.reason,
        description: cvCommentForm.description
      });
      toast.success('Comment saved for CV');
      setShowCvCommentModal(false);
      setCvCommentLoading(false);
      setCvCommentForm({ cvId: null, reason: '', description: '' });
      fetchCvUploads();
    } catch (error) {
      console.error('Save CV comment error:', error);
      toast.error(error.response?.data?.message || 'Failed to save comment');
      setCvCommentLoading(false);
    }
  };

  const downloadCv = async (cv) => {
    try {
      // CV now has Cloudinary URL - create download link
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
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cv/cvs/${cv._id}/download`, '_blank');
        toast.success('CV download started');
      }
    } catch (error) {
      toast.error('Failed to download CV');
      console.error(error);
    }
  };

  // Filter CVs
  const filteredCvs = cvUploads.filter(cv => {
    const matchesFolder = !cvFilter.folderId || cv.folder._id === cvFilter.folderId;
    const matchesSearch = !cvFilter.search || 
      cv.originalName?.toLowerCase().includes(cvFilter.search.toLowerCase()) ||
      cv.candidateName?.toLowerCase().includes(cvFilter.search.toLowerCase()) ||
      cv.candidateEmail?.toLowerCase().includes(cvFilter.search.toLowerCase());
    return matchesFolder && matchesSearch;
  });
  const cvTotalPages = Math.max(1, Math.ceil(filteredCvs.length / pageSize));
  const pagedCvs = filteredCvs.slice((cvPage - 1) * pageSize, cvPage * pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage jobs, users, and applications</p>
            </div>
            <button
              onClick={() => {
                setEditingJob(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Jobs Management
            </button>
            <button
              onClick={() => setActiveTab('recruiter_apps')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recruiter_apps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Sales Enquiries
            </button>
            <button
              onClick={() => setActiveTab('recruiters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recruiters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Recruiters
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Applications
            </button>
            <button
              onClick={() => setActiveTab('resumes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resumes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Resumes
            </button>
            <button
              onClick={() => setActiveTab('cv-management')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cv-management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Folder className="w-4 h-4 inline mr-2" />
              CV Management
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button onClick={() => setActiveTab('jobs')} className="bg-white rounded-lg shadow p-6 text-left w-full hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeJobs}</p>
              </div>
            </div>
          </div>

          <button onClick={() => setActiveTab('applications')} className="bg-white rounded-lg shadow p-6 text-left w-full hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.categoryStats.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Tab Content */}
        {activeTab === 'jobs' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search jobs..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Jobs Management</h3>
              </div>

              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedJobs.map((job) => (
                        <tr key={job._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.category}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={job.status}
                              onChange={(e) => updateJobStatus(job._id, e.target.value)}
                              className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${
                                job.status === 'Active' 
                                  ? 'bg-green-100 text-green-800'
                                  : job.status === 'Closed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Closed">Closed</option>
                              <option value="Draft">Draft</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.postedBy?.role === 'admin' ? 'Admin' : job.postedBy?.role === 'recruiter' ? 'Recruiter' : 'User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editJob(job)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteJob(job._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Jobs Pagination */}
            {jobsTotalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setJobsPage(prev => Math.max(1, prev - 1))}
                    disabled={jobsPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(jobsTotalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setJobsPage(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        jobsPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setJobsPage(prev => Math.min(jobsTotalPages, prev + 1))}
                    disabled={jobsPage === jobsTotalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Resumes Tab Content */}
        {activeTab === 'resumes' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search by name, email, position, company"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={userFilters.role}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagedResumes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No users with resumes found.</td>
                      </tr>
                    )}
                    {pagedResumes.map(user => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.currentPosition || '-'}</div>
                          <div className="text-xs text-gray-500">{user.currentCompany || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => viewResume(user)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                              disabled={!user.resume}
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </button>
                            <button
                              onClick={() => downloadResume(user._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                              disabled={!user.resume}
                            >
                              <Download className="w-4 h-4 mr-1.5" /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {resumesPage} of {resumesTotalPages}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setResumesPage(p => Math.max(1, p - 1))}
                    disabled={resumesPage === 1}
                    className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setResumesPage(p => Math.min(resumesTotalPages, p + 1))}
                    disabled={resumesPage === resumesTotalPages}
                    className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                {/* CVs Pagination */}
                {filteredCvs.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCvPage(prev => Math.max(1, prev - 1))}
                        disabled={cvPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(cvTotalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCvPage(i + 1)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            cvPage === i + 1
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCvPage(prev => Math.min(cvTotalPages, prev + 1))}
                        disabled={cvPage === cvTotalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Sales Enquiries */}
        {activeTab === 'recruiter_apps' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Sales Enquiries</h3>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={salesEnquirySort}
                  onChange={(e) => setSalesEnquirySort(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const sortedApps = [...recruiterApps].sort((a, b) => {
                      const dateA = new Date(a.createdAt || a._id.getTimestamp?.() || 0);
                      const dateB = new Date(b.createdAt || b._id.getTimestamp?.() || 0);
                      return salesEnquirySort === 'newest' 
                        ? dateB - dateA 
                        : dateA - dateB;
                    });
                    
                    if (sortedApps.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-6 py-10 text-center text-gray-500">No enquiries</td>
                        </tr>
                      );
                    }
                    
                    return sortedApps.map(app => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.contactName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.designation || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.companyName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.companyEmail || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.contactPhone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.companySize || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.city || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteSalesEnquiry(app._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Sales Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        

        {/* Recruiters list */}
        {activeTab === 'recruiters' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recruiter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recruiters.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500">No recruiters yet</td></tr>
                  )}
                  {recruiters.map(r => (
                    <tr key={r._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.firstName} {r.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.companyName || r.currentCompany || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* User Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search by name, email, position..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={userFilters.role}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              </div>

              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold">
                                    {(user.firstName || user.email).charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {user.phone}
                                </div>
                              )}
                              {user.location && (
                                <div className="flex items-center mt-1">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {user.location}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.currentPosition && (
                                <div>{user.currentPosition}</div>
                              )}
                              {user.currentCompany && (
                                <div className="text-gray-500">{user.currentCompany}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.resume ? (
                              <button
                                onClick={() => downloadResume(user._id)}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">No resume</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewUserDetails(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View User Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteUser(user._id, `${user.firstName} ${user.lastName}`.trim() || user.email)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Users Pagination */}
        {activeTab === 'users' && usersTotalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                disabled={usersPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(usersTotalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setUsersPage(i + 1)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    usersPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                disabled={usersPage === usersTotalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Applications Tab Content */}
        {activeTab === 'applications' && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Applications</h3>
              </div>

              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs
                        .flatMap(job => job.applications.map((application, index) => ({ job, application, key: `${job._id}-${index}`})))
                        .slice((applicationsPage - 1) * pageSize, applicationsPage * pageSize)
                        .map(({ job, application, key }) => (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                <div className="text-sm text-gray-500">{job.company}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {application.user?.firstName} {application.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{application.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application._id, job._id, e.target.value)}
                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${
                                  application.status === 'Applied' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : application.status === 'Under Review'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : application.status === 'Shortlisted'
                                    ? 'bg-green-100 text-green-800'
                                    : application.status === 'Rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                <option value="Under Review">Under Review</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Selected">Selected</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => viewApplicationDetails(application, job)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Application Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteApplication(application._id, job._id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Application"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Applications Pagination */}
            {(() => {
              const totalApps = jobs.reduce((acc, j) => acc + (j.applications?.length || 0), 0);
              const applicationsTotalPages = Math.max(1, Math.ceil(totalApps / pageSize));
              return applicationsTotalPages > 1 ? (
                <div className="mt-4 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setApplicationsPage(prev => Math.max(1, prev - 1))}
                      disabled={applicationsPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(applicationsTotalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setApplicationsPage(i + 1)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          applicationsPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setApplicationsPage(prev => Math.min(applicationsTotalPages, prev + 1))}
                      disabled={applicationsPage === applicationsTotalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              ) : null;
            })()}
          </>
        )}

        {/* CV Management Tab Content */}
        {activeTab === 'cv-management' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">CV Management</h3>
                  <p className="text-sm text-gray-600">Organize and manage CVs by folders</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFolderIds.length > 0 && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete ${selectedFolderIds.length} selected folder(s) and all their CVs? This cannot be undone.`)) {
                          return;
                        }
                        try {
                          await Promise.all(
                            selectedFolderIds.map(id => API.delete(`/api/cv/folders/${id}`))
                          );
                          toast.success('Selected folders deleted successfully');
                          setSelectedFolderIds([]);
                          fetchCvFolders();
                          fetchCvUploads();
                        } catch (error) {
                          console.error('Bulk delete folders error:', error);
                          toast.error(error.response?.data?.message || 'Failed to delete selected folders');
                        }
                      }}
                      className="bg-red-50 text-red-700 px-4 py-2 rounded-md hover:bg-red-100 flex items-center border border-red-200 text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected Folders
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFolderForm({ name: '', description: '', role: '', files: [] });
                      setShowFolderModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isCreatingFolder || isUploadingCv}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                  </button>
                  <button
                    onClick={() => {
                      setCvUploadForm({
                        folderId: cvFilter.folderId || '',
                        candidateName: '',
                        candidateEmail: '',
                        notes: '',
                        files: []
                      });
                      setShowCvUploadModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isUploadingCv || isCreatingFolder}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingCv ? 'Uploading...' : 'Upload CV'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Folders List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-md font-medium text-gray-900">Folders</h4>
                  </div>
                  <div className="p-4">
                          <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {cvLoading && cvFolders.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`w-full p-3 rounded-md hover:bg-gray-50 flex items-center justify-between ${
                              !cvFilter.folderId ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                            }`}
                          >
                            <button
                              onClick={() => setCvFilter({ ...cvFilter, folderId: '' })}
                              className="flex items-center text-left w-full"
                            >
                              <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
                              <span className="text-sm font-medium">All Folders</span>
                            </button>
                            <span className="text-xs text-gray-500 ml-2">{cvUploads.length}</span>
                          </div>
                          {cvFolders.map(folder => (
                            <div
                              key={folder._id}
                              className={`w-full p-3 rounded-md hover:bg-gray-50 flex items-center justify-between ${
                                cvFilter.folderId === folder._id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setCvFilter({ ...cvFilter, folderId: folder._id });
                                  setSelectedFolder(folder);
                                }}
                                className="flex items-center flex-1 text-left"
                              >
                                <Folder className="w-4 h-4 mr-2 text-blue-500" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{folder.name}</div>
                                  {folder.role && (
                                    <div className="text-xs text-gray-500 truncate">{folder.role}</div>
                                  )}
                                </div>
                              </button>
                              <div className="flex items-center gap-2 ml-2">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={selectedFolderIds.includes(folder._id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedFolderIds(prev =>
                                      checked
                                        ? [...prev, folder._id]
                                        : prev.filter(id => id !== folder._id)
                                    );
                                  }}
                                />
                                <span className="text-xs text-gray-500">{folder.cvCount || 0}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFolder(folder._id);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete folder"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {cvFolders.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              No folders yet. Create one to get started.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CVs List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <h4 className="text-md font-medium text-gray-900">
                        {cvFilter.folderId ? `CVs in ${selectedFolder?.name || 'Folder'}` : 'All CVs'}
                      </h4>
                      <div className="flex items-center gap-3">
                        {selectedCvIds.length > 0 && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete ${selectedCvIds.length} selected CV(s)? This cannot be undone.`)) {
                                return;
                              }
                              try {
                                await Promise.all(
                                  selectedCvIds.map(id => API.delete(`/api/cv/cvs/${id}`))
                                );
                                toast.success('Selected CVs deleted successfully');
                                setSelectedCvIds([]);
                                setSelectAllCvs(false);
                                fetchCvFolders();
                                fetchCvUploads();
                              } catch (error) {
                                console.error('Bulk delete CVs error:', error);
                                toast.error(error.response?.data?.message || 'Failed to delete selected CVs');
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete selected
                          </button>
                        )}
                        <div className="flex-1 max-w-md">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={cvFilter.search}
                              onChange={(e) => {
                                setCvFilter({ ...cvFilter, search: e.target.value });
                                setCvPage(1);
                              }}
                              placeholder="Search CVs..."
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {filteredCvs.length > 0 && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                            <button
                              onClick={() => setCvPage(prev => Math.max(1, prev - 1))}
                              disabled={cvPage === 1}
                              className="px-2 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Prev
                            </button>
                            <span>
                              Page {cvPage} of {cvTotalPages}
                            </span>
                            <button
                              onClick={() => setCvPage(prev => Math.min(cvTotalPages, prev + 1))}
                              disabled={cvPage === cvTotalPages}
                              className="px-2 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectAllCvs && pagedCvs.length > 0}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectAllCvs(checked);
                                if (checked) {
                                  setSelectedCvIds(pagedCvs.map(cv => cv._id));
                                } else {
                                  setSelectedCvIds([]);
                                }
                              }}
                            />
                          </th>
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
                        {cvLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center">
                              <div className="flex items-center justify-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                              </div>
                            </td>
                          </tr>
                        ) : pagedCvs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                              {cvFilter.folderId ? 'No CVs in this folder' : 'No CVs uploaded yet'}
                            </td>
                          </tr>
                        ) : (
                          pagedCvs.map(cv => (
                            <tr key={cv._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={selectedCvIds.includes(cv._id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedCvIds(prev =>
                                      checked
                                        ? [...prev, cv._id]
                                        : prev.filter(id => id !== cv._id)
                                    );
                                  }}
                                />
                              </td>
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
                                    onClick={() => openCvCommentModal(cv)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title={cv.commentReason || cv.commentDescription ? 'View / edit comment' : 'Add comment'}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => viewCv(cv)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View CV"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadCv(cv)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Download CV"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteCv(cv._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete CV"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Create/Edit Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingJob ? 'Edit Job' : 'Create New Job'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingJob(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={jobForm.title}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company *
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={jobForm.company}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={jobForm.location}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={jobForm.category}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employment Type
                      </label>
                      <select
                        name="employmentType"
                        value={jobForm.employmentType}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {employmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isRemote"
                        checked={jobForm.isRemote}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Remote Work Available
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      name="description"
                      value={jobForm.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    {jobForm.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleArrayInputChange('requirements', index, e.target.value)}
                          placeholder="Enter requirement"
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('requirements')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Requirement
                    </button>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsibilities
                    </label>
                    {jobForm.responsibilities.map((resp, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) => handleArrayInputChange('responsibilities', index, e.target.value)}
                          placeholder="Enter responsibility"
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('responsibilities')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Responsibility
                    </button>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills
                    </label>
                    {jobForm.skills.map((skill, index) => (
                      <div key={index} className="flex gap-2 mb-2">
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
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>

                  {/* Salary and Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salary Range (LPA)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          name="salary.min"
                          value={jobForm.salary.min}
                          onChange={handleInputChange}
                          placeholder="Min"
                          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          name="salary.max"
                          value={jobForm.salary.max}
                          onChange={handleInputChange}
                          placeholder="Max"
                          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Range (Years)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          name="experience.min"
                          value={jobForm.experience.min}
                          onChange={handleInputChange}
                          min="0"
                          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          name="experience.max"
                          value={jobForm.experience.max}
                          onChange={handleInputChange}
                          min="0"
                          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benefits
                    </label>
                    {jobForm.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => handleArrayInputChange('benefits', index, e.target.value)}
                          placeholder="Enter benefit"
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('benefits')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Benefit
                    </button>
                  </div>

                  {/* Application Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={jobForm.deadline}
                      onChange={handleInputChange}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingJob(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingJob ? 'Update Job' : 'Create Job'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedUser.location || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Position</label>
                        <p className="text-gray-900">{selectedUser.currentPosition || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Company</label>
                        <p className="text-gray-900">{selectedUser.currentCompany || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Experience</label>
                        <p className="text-gray-900">{selectedUser.experience || 0} years</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Availability</label>
                        <p className="text-gray-900">{selectedUser.jobPreferences?.availability || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {selectedUser.skills && selectedUser.skills.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedUser.education && selectedUser.education.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                      <div className="space-y-3">
                        {selectedUser.education.map((edu, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <p className="font-medium text-gray-900">{edu.degree}</p>
                            <p className="text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">{edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {selectedUser.workExperience && selectedUser.workExperience.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                      <div className="space-y-4">
                        {selectedUser.workExperience.map((exp, index) => (
                          <div key={index} className="border-l-4 border-green-500 pl-4">
                            <p className="font-medium text-gray-900">{exp.position}</p>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(exp.startDate).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                            </p>
                            {exp.description && (
                              <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                    {selectedUser.resume ? (
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-gray-900">Resume available</p>
                          <button
                            onClick={() => downloadResume(selectedUser._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Download Resume
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </div>

                  {/* Job Applications */}
                  {selectedUser.appliedJobs && selectedUser.appliedJobs.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Applications</h3>
                      <div className="space-y-2">
                        {selectedUser.appliedJobs.map((app, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div>
                              <p className="font-medium text-gray-900">{app.job?.title}</p>
                              <p className="text-sm text-gray-500">{app.job?.company}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              app.status === 'Applied' 
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'Under Review'
                                ? 'bg-yellow-100 text-yellow-800'
                                : app.status === 'Shortlisted'
                                ? 'bg-green-100 text-green-800'
                                : app.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => {
                      setShowApplicationModal(false);
                      setSelectedApplication(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Job Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Job Title</label>
                        <p className="text-gray-900">{selectedApplication.job.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company</label>
                        <p className="text-gray-900">{selectedApplication.job.company}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedApplication.job.location}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                        <p className="text-gray-900">{selectedApplication.job.employmentType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedApplication.user?.firstName} {selectedApplication.user?.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{selectedApplication.user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedApplication.user?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedApplication.user?.location || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Position</label>
                        <p className="text-gray-900">{selectedApplication.user?.currentPosition || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Experience</label>
                        <p className="text-gray-900">{selectedApplication.user?.experience || 0} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Applied Date</label>
                        <p className="text-gray-900">{new Date(selectedApplication.appliedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Status</label>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedApplication.status === 'Applied' 
                              ? 'bg-blue-100 text-blue-800'
                              : selectedApplication.status === 'Under Review'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedApplication.status === 'Shortlisted'
                              ? 'bg-green-100 text-green-800'
                              : selectedApplication.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {selectedApplication.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Match */}
                  {selectedApplication.user?.skills && selectedApplication.user.skills.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.user.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                    {selectedApplication.user?.resume ? (
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-gray-900">Resume available</p>
                          <button
                            onClick={() => downloadResume(selectedApplication.user._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Download Resume
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </div>

                  {/* Application Status Management */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Application Status</h3>
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedApplication.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          // Use the application subdocument _id, not the user id
                          updateApplicationStatus(selectedApplication._id, selectedApplication.job._id, newStatus);
                          setSelectedApplication(prev => ({ ...prev, status: newStatus }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                      </select>
                      <span className="text-sm text-gray-500">Status will be updated immediately</span>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {selectedApplication.coverLetter && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h3>
                      <div className="bg-white p-4 rounded border">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Modal */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Folder</h2>
                  <button
                    onClick={() => {
                      setShowFolderModal(false);
                      setFolderForm({ name: '', description: '', role: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isCreatingFolder) return;
                    try {
                      setIsCreatingFolder(true);
                      // First create the folder
                      const folderResponse = await createFolder(e);
                      // If folder was created and we have files selected for this folder,
                      // upload them into the new folder
                      if (folderResponse && folderResponse._id && folderForm.files && folderForm.files.length > 0) {
                        const uploads = folderForm.files.map((file) => {
                          const formData = new FormData();
                          formData.append('cv', file);
                          formData.append('folderId', folderResponse._id);
                          return API.post('/api/cv/cvs/upload', formData, {
                            headers: {
                              'Content-Type': 'multipart/form-data'
                            }
                          });
                        });
                        await Promise.all(uploads);
                        toast.success(`Uploaded ${folderForm.files.length} CV(s) to new folder`);
                      }
                      setShowFolderModal(false);
                      setFolderForm({ name: '', description: '', role: '', files: [] });
                      fetchCvFolders();
                      fetchCvUploads();
                    } catch (err) {
                      console.error('Create folder with CVs error:', err);
                      // createFolder already toasts on failure
                    } finally {
                      setIsCreatingFolder(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Folder Name *
                    </label>
                    <input
                      type="text"
                      value={folderForm.name}
                      onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                      required
                      placeholder="e.g., Software Engineers"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role (Optional)
                    </label>
                    <input
                      type="text"
                      value={folderForm.role}
                      onChange={(e) => setFolderForm({ ...folderForm, role: e.target.value })}
                      placeholder="e.g., Senior Developer, Data Analyst"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                      rows={3}
                      placeholder="Brief description of this folder..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      (Optional) Upload Folder of CVs
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      webkitdirectory=""
                      directory=""
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const maxSize = 5 * 1024 * 1024; // 5MB per file
                        const validFiles = [];
                        for (const file of files) {
                          if (file.size > maxSize) {
                            toast.error(`File "${file.name}" exceeds 5MB limit and was skipped.`);
                            continue;
                          }
                          validFiles.push(file);
                        }
                        setFolderForm((prev) => ({
                          ...prev,
                          files: validFiles
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {folderForm.files && folderForm.files.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border border-gray-100 rounded-md p-2 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700">
                          Selected {folderForm.files.length} file(s) to upload with this folder:
                        </p>
                        {folderForm.files.map((file, idx) => (
                          <p key={idx} className="text-xs text-gray-600 flex justify-between">
                            <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                            <span className="ml-2">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                      if (isCreatingFolder) return;
                      setShowFolderModal(false);
                      setFolderForm({ name: '', description: '', role: '', files: [] });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isCreatingFolder}
                    >
                      {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Upload CV Modal */}
        {showCvUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upload CV</h2>
                  <button
                    onClick={() => {
                      setShowCvUploadModal(false);
                      setCvUploadForm({
                        folderId: '',
                        candidateName: '',
                        candidateEmail: '',
                        notes: '',
                        files: []
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={uploadCv} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Folder *
                    </label>
                    <select
                      value={cvUploadForm.folderId}
                      onChange={(e) => setCvUploadForm({ ...cvUploadForm, folderId: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a folder...</option>
                      {cvFolders.map(folder => (
                        <option key={folder._id} value={folder._id}>
                          {folder.name} {folder.role && `(${folder.role})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CV Files * (PDF, DOC, DOCX - Max 5MB each)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                        const validFiles = [];
                        for (const file of files) {
                          if (file.size > maxSize) {
                            toast.error(`File "${file.name}" exceeds 5MB limit and was skipped.`);
                            continue;
                          }
                          validFiles.push(file);
                        }
                        if (!validFiles.length) {
                          e.target.value = '';
                          return;
                        }
                        setCvUploadForm({ ...cvUploadForm, files: validFiles });
                      }}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {cvUploadForm.files && cvUploadForm.files.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border border-gray-100 rounded-md p-2 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700">
                          Selected {cvUploadForm.files.length} file(s):
                        </p>
                        {cvUploadForm.files.map((file, idx) => (
                          <p key={idx} className="text-xs text-gray-600 flex justify-between">
                            <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                            <span className="ml-2">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={cvUploadForm.candidateName}
                      onChange={(e) => setCvUploadForm({ ...cvUploadForm, candidateName: e.target.value })}
                      placeholder="Name of the candidate"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={cvUploadForm.candidateEmail}
                      onChange={(e) => setCvUploadForm({ ...cvUploadForm, candidateEmail: e.target.value })}
                      placeholder="candidate@example.com"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={cvUploadForm.notes}
                      onChange={(e) => setCvUploadForm({ ...cvUploadForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Additional notes about this CV..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (isUploadingCv) return;
                        setShowCvUploadModal(false);
                        setCvUploadForm({
                          folderId: '',
                          candidateName: '',
                          candidateEmail: '',
                          notes: '',
                          files: []
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isUploadingCv}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isUploadingCv}
                    >
                      {isUploadingCv ? 'Uploading...' : 'Upload CV'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CV Preview Modal */}
        {showCvPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">CV Preview</h2>
                <button
                  onClick={() => {
                    setShowCvPreviewModal(false);
                    if (cvPreviewUrl) {
                      URL.revokeObjectURL(cvPreviewUrl);
                      setCvPreviewUrl(null);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-gray-100">
                {cvPreviewLoading || !cvPreviewUrl ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  </div>
                ) : (
                  <iframe
                    src={cvPreviewUrl}
                    title="CV Preview"
                    className="w-full h-full border-0 rounded-b-lg"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* CV Comment Modal */}
        {showCvCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">CV Comment</h2>
                  <button
                    onClick={() => {
                      if (cvCommentLoading) return;
                      setShowCvCommentModal(false);
                      setCvCommentForm({ cvId: null, reason: '', description: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={saveCvComment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={cvCommentForm.reason}
                      onChange={(e) => setCvCommentForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Strong profile, Follow up later"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={cvCommentForm.description}
                      onChange={(e) => setCvCommentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add any detailed notes about this CV..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (cvCommentLoading) return;
                        setShowCvCommentModal(false);
                        setCvCommentForm({ cvId: null, reason: '', description: '' });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={cvCommentLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={cvCommentLoading}
                    >
                      {cvCommentLoading ? 'Saving...' : 'Save Comment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
