import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import {
  User,
  LogOut,
  Briefcase,
  Home,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Check,
  FileText,
  ChevronDown,
  CreditCard,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const Header = memo(function Header() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showEmployerMenu, setShowEmployerMenu] = useState(false);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [employerSubmitting, setEmployerSubmitting] = useState(false);
  const [employerForm, setEmployerForm] = useState({
    contactName: '',
    contactPhone: '',
    designation: '',
    companyName: '',
    companyEmail: '',
    companySize: '',
    city: '',
    companyWebsite: '',
    cinOrGst: '',
    linkedin: '',
    note: ''
  });
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const employerMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const companySizeOptions = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/user/me')
        .then((response) => {
          setUser(response.data.user);
        })
        .catch((error) => {
          // Only clear user on 401 (unauthorized), not on other errors
          if (error.response?.status === 401) {
            setUser(null);
            localStorage.removeItem('token');
            delete API.defaults.headers.common['Authorization'];
          }
          // For other errors (network, rate limit, etc.), keep user state
        });
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      setEmployerForm(prev => ({
        ...prev,
        contactName: fullName || prev.contactName || '',
        contactPhone: user.phone || user.mobile || user.mobileNumber || '',
        designation: user.currentPosition || prev.designation || '',
        companyName: user.currentCompany || prev.companyName || '',
        companyEmail: user.email || prev.companyEmail || '',
        city: user.city || user.location || prev.city || ''
      }));
    } else {
      setEmployerForm({
        contactName: '',
        contactPhone: '',
        designation: '',
        companyName: '',
        companyEmail: '',
        companySize: '',
        city: '',
        companyWebsite: '',
        cinOrGst: '',
        linkedin: '',
        note: ''
      });
    }
  }, [user]);

  // Listen for auth state changes (OAuth login)
  useEffect(() => {
    const handleAuthStateChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        API.get('/api/user/me')
          .then((response) => {
            setUser(response.data.user);
          })
          .catch((error) => {
            // Only clear user on 401 (unauthorized), not on other errors
            if (error.response?.status === 401) {
              setUser(null);
              localStorage.removeItem('token');
              delete API.defaults.headers.common['Authorization'];
            }
            // For other errors (network, rate limit, etc.), keep user state
          });
      } else {
        setUser(null);
        delete API.defaults.headers.common['Authorization'];
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    return () => window.removeEventListener('authStateChanged', handleAuthStateChange);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await API.get('/api/notifications?limit=10');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await API.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotificationDropdown && user) {
      fetchNotifications();
    }
  }, [showNotificationDropdown, user, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/api/notifications/all/read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      // Refresh to make sure counts/ordering are in sync
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };


  const handleEmployerSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      contactName: employerForm.contactName.trim(),
      contactPhone: employerForm.contactPhone.trim(),
      designation: employerForm.designation.trim(),
      companyName: employerForm.companyName.trim(),
      companyEmail: employerForm.companyEmail.trim(),
      companySize: employerForm.companySize,
      city: employerForm.city.trim(),
      companyWebsite: employerForm.companyWebsite.trim(),
      cinOrGst: employerForm.cinOrGst.trim(),
      linkedin: employerForm.linkedin.trim(),
      note: employerForm.note.trim()
    };

    if (!payload.contactName || !payload.contactPhone || !payload.designation || !payload.companyName || !payload.companyEmail || !payload.city) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!payload.companySize) {
      toast.error('Please select a company size range');
      return;
    }

    setEmployerSubmitting(true);
    try {
      if (user) {
        await API.post('/api/user/recruiter/apply', payload);
      } else {
        await API.post('/api/user/recruiter/apply-public', payload);
      }
      toast.success('Request submitted. Our admin team will get back to you shortly.');
      setShowEmployerModal(false);
      setEmployerForm(prev => ({
        ...prev,
        contactName: user ? prev.contactName : '',
        contactPhone: user ? prev.contactPhone : '',
        designation: user ? prev.designation : '',
        companyName: user ? prev.companyName : '',
        companyEmail: user ? prev.companyEmail : '',
        city: user ? prev.city : '',
        companySize: '',
        companyWebsite: '',
        cinOrGst: '',
        linkedin: '',
        note: ''
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setEmployerSubmitting(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setShowNotificationDropdown(false);
    
    // Handle new application notifications - redirect to applications/applicants page
    if (notification.type === 'new_application' && notification.job && notification.job._id) {
      if (user?.role === 'admin') {
        navigate('/admin?tab=applications');
      } else if (user?.role === 'recruiter') {
        navigate('/recruiter?tab=applicants');
      } else {
        // Fallback to job details if role is not admin or recruiter
        navigate(`/jobs/${notification.job._id}`);
      }
    } else if (notification.job && notification.job._id) {
      // For other notification types, redirect to job details
      navigate(`/jobs/${notification.job._id}`);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the click handler
    try {
      await API.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if needed
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to remove notification');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await API.delete('/api/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
      await fetchUnreadCount();
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
      if (employerMenuRef.current && !employerMenuRef.current.contains(event.target)) {
        setShowEmployerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setShowDropdown(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token: null } }));
    
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
  ];

  // Show Jobs in navigation for candidates and guests, but hide for recruiters
  if (!user || (user && user.role !== 'recruiter')) {
    navItems.push({ path: '/jobs', label: 'Jobs', icon: Briefcase });
  }

  // Add "Your CV" for logged-in users (not admins)
  if (user && user.role === 'user') {
    navItems.push({ path: '/your-cv', label: 'Your CV', icon: FileText });
  }

  // Show Blog for everyone
  navItems.push({ path: '/blog', label: 'Blog', icon: BookOpen });

  if (user?.role === 'recruiter') {
    navItems.push({ path: '/recruiter', label: 'Recruiter', icon: Settings });
  }
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <>
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center min-w-0">
            <div className="flex items-center">
              <img 
                src="/icons/staffdox_logo.png" 
                alt="Staffdox Logo" 
                className="h-8 sm:h-10 w-auto mr-1 sm:mr-2 flex-shrink-0"
              />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">Staffdox</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4 xl:mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </form>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setShowNotificationDropdown(!showNotificationDropdown);
                      setShowDropdown(false);
                    }}
                    className={`relative p-2 text-gray-700 hover:text-gray-900 focus:outline-none transition-all duration-200 rounded-full ${
                      showNotificationDropdown 
                        ? 'bg-blue-100 text-blue-600 scale-110' 
                        : 'hover:bg-gray-100'
                    } active:scale-95 transform`}
                  >
                    <Bell 
                      className={`w-6 h-6 transition-transform duration-200 ${
                        showNotificationDropdown ? 'animate-pulse' : ''
                      }`}
                    />
                    {unreadCount > 0 && (
                      <span className={`absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold transition-transform duration-200 ${
                        showNotificationDropdown ? 'scale-125' : 'scale-100'
                      }`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border max-h-96 overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-3">
                          {notifications.length > 0 && (
                            <button
                              onClick={deleteAllNotifications}
                              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {loadingNotifications ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            Loading notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {notifications.map((notification) => (
                              <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors relative group ${
                                  !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 pr-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    {notification.job && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {notification.job.title} • {notification.job.company}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                                    )}
                                    <button
                                      onClick={(e) => deleteNotification(notification._id, e)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-600 flex-shrink-0"
                                      title="Remove notification"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

            {!user && (
              <div className="relative hidden md:block" ref={employerMenuRef}>
                <button
                  onClick={() => setShowEmployerMenu(prev => !prev)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-200 rounded-md"
                >
                  <span>For Employers</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showEmployerMenu ? 'rotate-180' : ''}`} />
                </button>
                {showEmployerMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50 py-2">
                    <Link
                      to="/employer/dashboard"
                      onClick={() => setShowEmployerMenu(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Buy online
                    </Link>
                    <Link
                      to="/employer/login"
                      onClick={() => setShowEmployerMenu(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Employer Login
                    </Link>
                  </div>
                )}
              </div>
            )}

                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm xl:text-base">{user.firstName || user.email}</span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 break-all">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin?tab=applications"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Briefcase className="w-4 h-4 mr-3" />
                        My Applicants
                      </Link>
                    ) : user.role === 'recruiter' ? (
                      <Link
                        to="/recruiter?tab=applicants"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Briefcase className="w-4 h-4 mr-3" />
                        My Applicants
                      </Link>
                    ) : (
                      <Link
                        to="/my-applications"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Briefcase className="w-4 h-4 mr-3" />
                        My Applications
                      </Link>
                    )}

                    {user.role === 'recruiter' && (
                      <Link
                        to="/recruiter?tab=plan"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CreditCard className="w-4 h-4 mr-3" />
                        My Plan
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
                <div className="relative hidden md:block" ref={employerMenuRef}>
                  <button
                    onClick={() => setShowEmployerMenu(prev => !prev)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <span>For Employers</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showEmployerMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showEmployerMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50 py-2">
                      <Link
                        to="/employer/dashboard"
                        onClick={() => setShowEmployerMenu(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Buy online
                      </Link>
                      <Link
                        to="/employer/login"
                        onClick={() => setShowEmployerMenu(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Employer Login
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 ml-2"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {!user && (
            <div className="mt-4 space-y-2">
              <Link
                to="/employer/dashboard"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-200"
              >
                Buy online
              </Link>
              <Link
                to="/employer/login"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-200"
              >
                Employer Login
              </Link>
            </div>
            )}

            {/* Mobile User Menu */}
            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>
                {user.role === 'admin' ? (
                  <Link
                    to="/admin?tab=applications"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Briefcase className="w-5 h-5 mr-3" />
                    My Applicants
                  </Link>
                ) : user.role === 'recruiter' ? (
                  <Link
                    to="/recruiter?tab=applicants"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Briefcase className="w-5 h-5 mr-3" />
                    My Applicants
                  </Link>
                ) : (
                  <Link
                    to="/my-applications"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Briefcase className="w-5 h-5 mr-3" />
                    My Applications
                  </Link>
                )}
                {user.role === 'recruiter' && (
                  <Link
                    to="/recruiter?tab=plan"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    My Plan
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

    {showEmployerModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowEmployerModal(false)}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Employer Login Request</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Share your hiring requirements and our admin team will reach out to onboard you as an employer.
            </p>
            <form onSubmit={handleEmployerSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={employerForm.contactName}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, contactName: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={employerForm.contactPhone}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    value={employerForm.companyEmail}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, companyEmail: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    value={employerForm.designation}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, designation: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. HR Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={employerForm.companyName}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, companyName: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Range *</label>
                  <select
                    value={employerForm.companySize}
                    onChange={(e) => setEmployerForm(prev => ({ ...prev, companySize: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select range</option>
                    {companySizeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={employerForm.city}
                  onChange={(e) => setEmployerForm(prev => ({ ...prev, city: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
                <textarea
                  rows={3}
                  value={employerForm.note}
                  onChange={(e) => setEmployerForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share any specific hiring needs or questions"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmployerModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={employerSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={employerSubmitting}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {employerSubmitting ? 'Submitting...' : 'Request Callback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </>
  );
});

export default Header;
