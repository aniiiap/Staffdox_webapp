import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  X,
  FileCheck,
  User,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function YourCV() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/user/me')
        .then(response => {
          setMe(response.data.user);
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
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
      } else {
        // Fallback: refresh user data from server
        const userResponse = await API.get('/api/user/me');
        setMe(userResponse.data.user);
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

  const handleDownload = async () => {
    if (!me?.resume) {
      toast.error('No resume to download');
      return;
    }

    try {
      // Use the API endpoint to download the resume
      const response = await API.get('/api/user/my-resume', {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Fallback: use the resume path to get extension
        const ext = me.resume.split('.').pop() || 'pdf';
        filename = `resume.${ext}`;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error('Failed to download resume:', error);
      toast.error(error.response?.data?.message || 'Failed to download resume');
    }
  };

  const handleView = async () => {
    if (!me?.resume) {
      toast.error('No resume to view');
      return;
    }
    
    try {
      // Fetch PDF through authenticated API to include auth token
      // Add timestamp to prevent caching of old resume
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await API.delete('/api/user/delete-resume');
      setMe(prev => ({ ...prev, resume: null }));
      toast.success('Resume deleted successfully');
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error(error.response?.data?.message || 'Failed to delete resume');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to manage your CV</h2>
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your CV</h1>
        <p className="text-gray-600">
          Upload and manage your resume/CV. Keep it updated to increase your chances of getting noticed by employers.
        </p>
      </div>

      {/* Profile Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {me.firstName || 'User'} {me.lastName || ''}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{me.email}</p>
              {me.currentPosition && (
                <p className="text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  {me.currentPosition}
                  {me.currentCompany && ` at ${me.currentCompany}`}
                </p>
              )}
            </div>
          </div>
          <Link
            to="/profile"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit Profile →
          </Link>
        </div>
      </div>

      {/* CV Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your CV/Resume</h2>
          <p className="text-gray-600 text-sm">
            Upload your latest resume in PDF, DOC, or DOCX format. Maximum file size: 5MB
          </p>
        </div>

        {me.resume ? (
          <div className="space-y-6">
            {/* Current Resume */}
            <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Resume Uploaded</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      File: <span className="font-medium">{me.resume.split('/').pop()}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Your resume is ready to use for job applications
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleView}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Replace Resume */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Replace Resume</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Upload className={`w-12 h-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your resume here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                  <label className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 cursor-pointer inline-block">
                    {uploadingResume ? 'Uploading...' : 'Choose New File'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingResume}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  dragActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-gray-600 mb-2">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: PDF, DOC, DOCX (Maximum file size: 5MB)
                </p>
              </div>
              <label className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 cursor-pointer inline-block text-lg font-medium">
                {uploadingResume ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </span>
                ) : (
                  'Choose File'
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingResume}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileCheck className="w-5 h-5 mr-2 text-purple-600" />
          CV Tips
        </h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Keep your CV updated with your latest skills and experience</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Use a clear, professional format that is easy to read</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Highlight your key achievements and relevant experience</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Tailor your CV for specific job applications when possible</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

