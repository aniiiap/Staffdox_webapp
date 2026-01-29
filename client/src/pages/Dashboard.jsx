import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { UserCircle2, X, Briefcase, Users, TrendingUp, FileText, ArrowRight, CheckCircle, Star, Target, Award, MessageCircle, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [totalApplicants, setTotalApplicants] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      API.get("/api/user/me")
        .then((r) => {
          setMe(r.data.user);
          setForm(r.data.user);
          // Fetch applicants count for admin and recruiter
          if (r.data.user.role === 'admin' || r.data.user.role === 'recruiter') {
            fetchApplicantsCount(r.data.user.role);
          }
        })
        .catch((error) => {
          // Only clear user on 401 (unauthorized), not on rate limit or network errors
          if (error.response?.status === 401) {
            setMe(null);
            localStorage.removeItem('token');
            delete API.defaults.headers.common['Authorization'];
          } else if (error.isRateLimit) {
            // Rate limit error - retry after a delay
            console.warn('Rate limited, retrying...');
            setTimeout(() => {
              API.get("/api/user/me")
                .then((r) => {
                  setMe(r.data.user);
                  setForm(r.data.user);
                  if (r.data.user.role === 'admin' || r.data.user.role === 'recruiter') {
                    fetchApplicantsCount(r.data.user.role);
                  }
                })
                .catch((err) => {
                  if (err.response?.status === 401) {
                    setMe(null);
                  }
                });
            }, 2000);
          }
          // For other errors, don't clear user state
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchApplicantsCount = async (role) => {
    try {
      if (role === 'admin') {
        // For admin, get all applications from all jobs
        const response = await API.get('/api/jobs');
        const allJobs = response.data.jobs || [];
        const total = allJobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
        setTotalApplicants(total);
      } else if (role === 'recruiter') {
        // For recruiter, get applications only from their jobs
        const response = await API.get('/api/jobs/my/jobs');
        const myJobs = response.data || [];
        const total = myJobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
        setTotalApplicants(total);
      }
    } catch (error) {
      console.error('Failed to fetch applicants count:', error);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (password.trim()) payload.password = password;

      const { data } = await API.put("/api/user/me", payload);
      setMe(data.user);
      toast.success("Profile updated successfully!");
      setPassword("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="h-16 bg-blue-500 rounded-lg mb-6 animate-pulse"></div>
              <div className="h-8 bg-blue-500 rounded-lg mb-8 animate-pulse"></div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="h-12 bg-white rounded-lg animate-pulse"></div>
                <div className="h-12 bg-white rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 via-beige-600 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 px-2">
              {me ? `Welcome back, ${me.firstName || 'Professional'}!` : 'Your Career Partner'}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto px-2">
              {me
                ? 'We connect talented professionals with exceptional opportunities. Let\'s advance your career together.'
                : 'Expert recruitment services tailored to your career goals. Find your next opportunity with us.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              {me ? (
                <>
                  {me.role === 'user' && (
                    <Link
                      to="/jobs"
                      className="bg-white text-blue-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Explore Opportunities</span>
                    </Link>
                  )}
                  {me.role === 'user' ? (
                    <Link
                      to="/your-cv"
                      className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Your CV</span>
                    </Link>
                  ) : me.role === 'recruiter' ? (
                    <Link
                      to="/recruiter"
                      className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Recruiter Dashboard</span>
                      <span className="sm:hidden">Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      to="/admin?tab=resumes"
                      className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>View Resumes</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/jobs"
                    className="bg-white text-blue-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    to="/register"
                    className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {me ? (
          <div>
            {/* Quick Actions Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {me.role === 'user' ? (
                <Link
                  to="/your-cv"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your CV</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {me.resume ? 'Your CV is uploaded and ready' : 'Upload your CV to get started'}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">Manage CV →</p>
                </Link>
              ) : me.role === 'recruiter' ? (
                <Link
                  to="/recruiter"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recruiter Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Post jobs and review applicants
                  </p>
                  <p className="text-sm text-blue-600 font-medium">Open Dashboard →</p>
                </Link>
              ) : (
                <>
                  {/* Admin: Resumes card */}
                  <Link
                    to="/admin?tab=resumes"
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumes</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      View all uploaded resumes
                    </p>
                    <p className="text-sm text-blue-600 font-medium">Open Resumes →</p>
                  </Link>

                  {/* Admin: CV Management card */}
                  <Link
                    to="/admin?tab=cv-management"
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Folder className="w-6 h-6 text-indigo-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">CV Management</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Organize CV folders and manage uploaded CVs
                    </p>
                    <p className="text-sm text-blue-600 font-medium">Open CV Management →</p>
                  </Link>
                </>
              )}

              {me.role === 'user' && (
                <Link
                  to="/my-applications"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Applications</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {me.appliedJobs?.length || 0} {me.appliedJobs?.length === 1 ? 'application' : 'applications'} tracked
                  </p>
                  <p className="text-sm text-blue-600 font-medium">View Status →</p>
                </Link>
              )}

              {(me.role === 'admin' || me.role === 'recruiter') && (
                <Link
                  to={me.role === 'admin' ? '/admin?tab=applications' : '/recruiter?tab=applicants'}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Applicants</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {totalApplicants} {totalApplicants === 1 ? 'applicant' : 'applicants'} total
                  </p>
                  <p className="text-sm text-blue-600 font-medium">View Applicants →</p>
                </Link>
              )}

              {me.role === 'user' && (
                <Link
                  to="/profile"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Completeness</h3>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{me.profileCompleteness || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${me.profileCompleteness || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Complete Profile →</p>
                </Link>
              )}
            </div>

            {/* Career Services Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border border-indigo-100">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Our Services</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Personalized Career Guidance</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our recruitment specialists provide tailored advice to help you navigate your career path and find the right opportunities.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Exclusive Opportunities</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Access to premium job opportunities from leading companies that may not be available elsewhere.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Application Support</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get help with your applications, CV optimization, and interview preparation from our expert team.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-gray-900">Career Development</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Resources and insights to help you grow professionally and achieve your long-term career goals.
                  </p>
                </div>
              </div>
            </div>

            {/* Browse Jobs CTA */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 text-center border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Explore Opportunities?</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                Browse our curated job listings and find positions that match your skills and career aspirations.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <span>Browse Jobs</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Why Choose Us Section */}
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Why Choose Staffdox?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-2">
                We're a trusted recruitment consultancy dedicated to connecting exceptional talent with outstanding opportunities.
                Our personalized approach ensures the right fit for both candidates and employers.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 lg:mb-16">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Recruitment</h3>
                <p className="text-gray-600">
                  Our experienced consultants understand your career goals and match you with opportunities that align with your aspirations.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Personalized Service</h3>
                <p className="text-gray-600">
                  Every candidate receives individualized attention and support throughout their job search journey.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Career Growth</h3>
                <p className="text-gray-600">
                  We don't just fill positions—we help build careers with access to roles that offer genuine growth potential.
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 sm:p-8 lg:p-12 mb-8 sm:mb-12 lg:mb-16 text-white">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">500+</div>
                  <div className="text-xs sm:text-sm text-blue-100">Active Positions</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">200+</div>
                  <div className="text-xs sm:text-sm text-blue-100">Partner Companies</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">1000+</div>
                  <div className="text-xs sm:text-sm text-blue-100">Successful Placements</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">95%</div>
                  <div className="text-xs sm:text-sm text-blue-100">Candidate Satisfaction</div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 lg:mb-12 px-2">How It Works</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 lg:gap-4 px-2">
                {[
                  { step: '1', title: 'Create Profile', desc: 'Register and build your professional profile' },
                  { step: '2', title: 'Upload CV', desc: 'Share your resume with our recruitment team' },
                  { step: '3', title: 'Get Matched', desc: 'We connect you with relevant opportunities' },
                  { step: '4', title: 'Land Your Role', desc: 'Get support through the application process' }
                ].map((item, index) => (
                  <React.Fragment key={item.step}>
                    <div
                      className="text-center flex-1 max-w-[200px] animate-fade-in-up w-full sm:w-auto"
                      style={{
                        animationDelay: `${index * 0.2}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-xl sm:text-2xl font-bold hover:scale-110 transition-transform duration-300 hover:shadow-lg">
                        {item.step}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 px-2">{item.desc}</p>
                    </div>
                    {index < 3 && (
                      <ArrowRight
                        className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-2 hidden sm:block flex-shrink-0 animate-pulse-arrow rotate-90 sm:rotate-0"
                        style={{
                          animationDelay: `${(index + 1) * 0.2}s`,
                          animationFillMode: 'both'
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Job Categories */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 text-center px-2">
            Browse by Industry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {['Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales', 'HR', 'Operations', 'Design', 'Education', 'Other'].map((category) => (
              <Link
                key={category}
                to={`/jobs?category=${category}`}
                className="bg-white rounded-lg shadow p-3 sm:p-4 text-center hover:shadow-lg hover:bg-blue-50 transition-all border border-gray-200"
              >
                <div className="text-sm sm:text-base font-medium text-gray-900">{category}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section for Non-logged Users */}
        {!me && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 sm:p-8 lg:p-12 text-center text-white mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">Ready to Take the Next Step?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Join thousands of professionals who have found their dream roles through Staffdox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <Link
                to="/register"
                className="bg-white text-blue-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                Get Started Today
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors text-sm sm:text-base"
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Edit Profile
            </h2>

            <div className="flex flex-col items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                {me?.avatar ? (
                  <img
                    src={me.avatar}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {(me.firstName || me.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="mt-2 text-sm text-blue-600 cursor-pointer">
                <input type="file" hidden onChange={() => toast("Coming soon!")} />
                Change Photo
              </label>
            </div>

            <form onSubmit={updateProfile} className="space-y-3">
              <input
                name="firstName"
                value={form.firstName || ""}
                onChange={handleChange}
                placeholder="First name"
                className="w-full p-3 border rounded"
              />
              <input
                name="lastName"
                value={form.lastName || ""}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full p-3 border rounded"
              />
              <input
                name="email"
                value={form.email || ""}
                disabled
                className="w-full p-3 border rounded bg-gray-100"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full p-3 border rounded"
              />

              <button className="w-full p-3 bg-blue-600 text-white rounded">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}
