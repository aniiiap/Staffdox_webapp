import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { Calendar, User, Tag, Search, Filter, Clock, Eye, ArrowRight, FileText, Plus, Edit, Trash2, X, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';

const categories = [
  'All',
  'Career Tips',
  'Industry News',
  'Job Search',
  'Interview Tips',
  'Resume Writing',
  'Professional Development',
  'Company Culture',
  'Other'
];

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin management state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    category: 'Other',
    published: false,
    metaDescription: '',
    readTime: '',
    featuredImage: null
  });
  const [blogFilters, setBlogFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  
  // View analytics state
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedBlogForAnalytics, setSelectedBlogForAnalytics] = useState(null);


  // Basic SEO: set page title
  useEffect(() => {
    document.title = 'Blog | Staffdox – Career Insights & Job Search Advice';
  }, []);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/api/user/me')
        .then((response) => {
          setUser(response.data.user);
          setIsAdmin(response.data.user?.role === 'admin');
        })
        .catch(() => {
          setUser(null);
          setIsAdmin(false);
        });
    }
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let response;
      // If admin, fetch all blogs (including drafts), otherwise fetch only published
      if (isAdmin) {
        const params = new URLSearchParams({
          page,
          limit: 12,
          ...(blogFilters.status && { status: blogFilters.status }),
          ...(blogFilters.category && { category: blogFilters.category }),
          ...(blogFilters.search && { search: blogFilters.search }),
          ...(selectedCategory !== 'All' && { category: selectedCategory }),
          ...(selectedTag && { tag: selectedTag }),
          ...(searchQuery && { search: searchQuery })
        });
        response = await API.get(`/api/blogs/admin/all?${params.toString()}`);
      } else {
        const params = {
          page,
          limit: 12,
          ...(selectedCategory !== 'All' && { category: selectedCategory }),
          ...(selectedTag && { tag: selectedTag }),
          ...(searchQuery && { search: searchQuery })
        };
        response = await API.get('/api/blogs', { params });
      }
      
      const fetchedBlogs = response.data.blogs || [];
      setBlogs(fetchedBlogs);
      setTotalPages(response.data.totalPages || 1);
      
      // Extract unique tags from blogs
      const allTags = new Set();
      fetchedBlogs.forEach(blog => {
        blog.tags?.forEach(tag => allTags.add(tag));
      });
      setTags(Array.from(allTags));
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, selectedTag, searchQuery, isAdmin, blogFilters]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  // Admin blog management functions
  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation for rich text (Quill may include empty tags)
      const plainText = (blogForm.content || '').replace(/<[^>]*>/g, '').trim();
      if (!plainText) {
        toast.error('Content is required');
        return;
      }

      const formData = new FormData();
      formData.append('title', blogForm.title);
      formData.append('content', blogForm.content);
      formData.append('excerpt', blogForm.excerpt);
      formData.append('tags', blogForm.tags);
      formData.append('category', blogForm.category);
      formData.append('published', blogForm.published);
      formData.append('metaDescription', blogForm.metaDescription);
      // Always send readTime (even if empty) so backend can clear it if needed
      formData.append('readTime', blogForm.readTime || '');
      if (blogForm.featuredImage) {
        formData.append('featuredImage', blogForm.featuredImage);
      }

      if (editingBlog) {
        await API.put(`/api/blogs/admin/${editingBlog._id}`, formData);
        toast.success('Blog updated successfully');
      } else {
        await API.post('/api/blogs/admin', formData);
        toast.success('Blog created successfully');
      }
      
      setShowBlogModal(false);
      setEditingBlog(null);
      setBlogForm({
        title: '',
        content: '',
        excerpt: '',
        tags: '',
        category: 'Other',
        published: false,
        metaDescription: '',
        readTime: '',
        featuredImage: null
      });
      fetchBlogs();
    } catch (error) {
      console.error('Blog submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save blog');
    }
  };

  const handleEditBlog = (blog, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      tags: blog.tags?.join(', ') || '',
      category: blog.category || 'Other',
      published: blog.published || false,
      metaDescription: blog.metaDescription || '',
      readTime: blog.readTime || '',
      featuredImage: null
    });
    setShowBlogModal(true);
  };

  const handleDeleteBlog = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await API.delete(`/api/blogs/admin/${id}`);
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      console.error('Delete blog error:', error);
      toast.error('Failed to delete blog');
    }
  };

  const handleViewAnalytics = async (blog, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedBlogForAnalytics(blog);
    setShowAnalyticsModal(true);
    setAnalyticsLoading(true);
    
    try {
      const response = await API.get(`/api/blogs/admin/views/${blog._id}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Fetch analytics error:', error);
      toast.error('Failed to load view analytics');
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - full-width illustration background */}
      <div
        className="relative text-white py-20 md:py-28 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(15,23,42,0.75), rgba(15,23,42,0.9)), url('/illustration/5042209_810.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Our Blog
            </h1>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed">
              Discover career insights, job search strategies, and hiring tips to grow your professional journey.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Admin Controls */}
        {isAdmin && (
          <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setEditingBlog(null);
                  setBlogForm({
                    title: '',
                    content: '',
                    excerpt: '',
                    tags: '',
                    category: 'Other',
                    published: false,
                    metaDescription: '',
                    featuredImage: null
                  });
                  setShowBlogModal(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create New Blog
              </button>
            </div>
            <div className="flex gap-4">
              <select
                value={blogFilters.status}
                onChange={(e) => {
                  setBlogFilters(prev => ({ ...prev, status: e.target.value }));
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        )}

        {/* Search and Filter Section - Blog Style */}
        <div className="mb-10 space-y-5">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles, topics, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter - compact, single-row with horizontal scroll on small screens */}
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-600">Tags:</span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? '' : tag);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => {
                    setSelectedTag('');
                    setPage(1);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No blogs found. Check back later!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {blogs.map((blog) => (
                <article
                  key={blog._id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 relative"
                >
                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <button
                        onClick={(e) => handleViewAnalytics(blog, e)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEditBlog(blog, e)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit Blog"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBlog(blog._id, e)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600 transition-colors"
                        title="Delete Blog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <Link
                    to={`/blog/${blog.published ? (blog.slug || blog._id) : blog._id}`}
                    className="block"
                  >
                  {/* Featured Image - Blog Style */}
                  <div className="relative h-56 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                    {blog.featuredImage ? (
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                        <FileText className="w-20 h-20 text-blue-300" />
                      </div>
                    )}
                    {/* Status + Category Pills */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      {isAdmin && !blog.published && (
                        <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full shadow-md">
                          Draft
                        </span>
                      )}
                      <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm text-blue-700 text-xs font-bold rounded-full shadow-md">
                        {blog.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Content - Blog Style */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {blog.title}
                    </h3>
                    
                    {blog.excerpt && (
                      <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      {blog.author && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="font-medium">{blog.author.firstName} {blog.author.lastName}</span>
                        </div>
                      )}
                      {blog.publishedAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(blog.publishedAt)}</span>
                        </div>
                      )}
                      {blog.readTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{blog.readTime}</span>
                        </div>
                      )}
                      {blog.views > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{blog.views} views</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More */}
                    <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      Read Article
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Blog Create/Edit Modal for Admin */}
        {isAdmin && showBlogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBlog ? 'Edit Blog' : 'Create New Blog'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowBlogModal(false);
                      setEditingBlog(null);
                      setBlogForm({
                        title: '',
                        content: '',
                        excerpt: '',
                        tags: '',
                        category: 'Other',
                        published: false,
                        metaDescription: '',
                        featuredImage: null
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleBlogSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content * (Rich Text)
                    </label>
                    <RichTextEditor
                      value={blogForm.content}
                      onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use headings, bold/italic/underline, bullet points, numbered lists, links, images, and alignment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt (optional, max 300 chars)
                    </label>
                    <textarea
                      value={blogForm.excerpt}
                      onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                      maxLength={300}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{blogForm.excerpt.length}/300</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={blogForm.category}
                        onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Career Tips">Career Tips</option>
                        <option value="Industry News">Industry News</option>
                        <option value="Job Search">Job Search</option>
                        <option value="Interview Tips">Interview Tips</option>
                        <option value="Resume Writing">Resume Writing</option>
                        <option value="Professional Development">Professional Development</option>
                        <option value="Company Culture">Company Culture</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        placeholder="e.g., career, tips, advice"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image (JPG, PNG, GIF, WEBP - Max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => setBlogForm({ ...blogForm, featuredImage: e.target.files[0] })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {editingBlog?.featuredImage && !blogForm.featuredImage && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Current image:</p>
                        <img src={editingBlog.featuredImage} alt="Current" className="h-40 w-auto rounded-lg border border-gray-200" />
                      </div>
                    )}
                    {blogForm.featuredImage && (
                      <div className="mt-3">
                        <p className="text-sm text-green-600 mb-2">New image selected: {blogForm.featuredImage.name}</p>
                        <img src={URL.createObjectURL(blogForm.featuredImage)} alt="Preview" className="h-40 w-auto rounded-lg border border-gray-200" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description (optional, for SEO)
                    </label>
                    <textarea
                      value={blogForm.metaDescription}
                      onChange={(e) => setBlogForm({ ...blogForm, metaDescription: e.target.value })}
                      maxLength={160}
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{blogForm.metaDescription.length}/160</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Read Time (optional, e.g., "5 min read", "10 minutes")
                    </label>
                    <input
                      type="text"
                      value={blogForm.readTime}
                      onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                      placeholder="e.g., 5 min read"
                      maxLength={50}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Add estimated reading time for this blog</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={blogForm.published}
                      onChange={(e) => setBlogForm({ ...blogForm, published: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                      Publish immediately
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlogModal(false);
                        setEditingBlog(null);
                        setBlogForm({
                          title: '',
                          content: '',
                          excerpt: '',
                          tags: '',
                          category: 'Other',
                          published: false,
                          metaDescription: '',
                          featuredImage: null
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingBlog ? 'Update Blog' : 'Create Blog'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Analytics Modal for Admin */}
        {isAdmin && showAnalyticsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">View Analytics</h2>
                    {selectedBlogForAnalytics && (
                      <p className="text-gray-600 mt-1">{selectedBlogForAnalytics.title}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAnalyticsModal(false);
                      setAnalyticsData(null);
                      setSelectedBlogForAnalytics(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {analyticsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-6">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Total Views</div>
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.total}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Unique Viewers</div>
                        <div className="text-2xl font-bold text-green-600">{analyticsData.uniqueViewersCount}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Anonymous Views</div>
                        <div className="text-2xl font-bold text-gray-600">{analyticsData.anonymousViewsCount}</div>
                      </div>
                    </div>

                    {/* Viewers List */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewers ({analyticsData.views.length})</h3>
                      {analyticsData.views.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {analyticsData.views.map((view, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                {view.user ? (
                                  <>
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      {view.user.avatar ? (
                                        <img
                                          src={view.user.avatar}
                                          alt={`${view.user.firstName} ${view.user.lastName}`}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-5 h-5 text-blue-600" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">
                                        {view.user.firstName} {view.user.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">{view.user.email}</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">Anonymous User</div>
                                      <div className="text-sm text-gray-500">
                                        <span className="font-mono">IP: {view.ipAddress}</span>
                                        {view.ipAddress && (view.ipAddress === '::1' || view.ipAddress === '127.0.0.1') && (
                                          <span className="ml-2 text-xs text-gray-400">(localhost)</span>
                                        )}
                                      </div>
                                      {view.userAgent && (
                                        <div className="text-xs text-gray-400 mt-1 truncate max-w-md" title={view.userAgent}>
                                          {view.userAgent.length > 50 ? `${view.userAgent.substring(0, 50)}...` : view.userAgent}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">
                                  {new Date(view.viewedAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(view.viewedAt).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No views yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No analytics data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

