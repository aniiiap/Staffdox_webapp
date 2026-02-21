import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { Calendar, User, Tag, ArrowLeft, Share2, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/blogs/${id}`);
      setBlog(response.data.blog);

      // Fetch related blogs
      if (response.data.blog) {
        fetchRelatedBlogs(response.data.blog.category, response.data.blog._id);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Blog not found');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, excludeId) => {
    try {
      const response = await API.get('/api/blogs', {
        params: {
          category,
          limit: 3,
          page: 1
        }
      });
      const filtered = (response.data.blogs || []).filter(b => b._id !== excludeId);
      setRelatedBlogs(filtered.slice(0, 3));
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={blog.title}
        description={blog.metaDescription || blog.excerpt || 'Read career insights from Staffdox.'}
        keywords={blog.tags?.join(', ')}
        ogImage={blog.featuredImage}
        ogType="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blog.title,
          description: blog.metaDescription || blog.excerpt,
          image: blog.featuredImage,
          datePublished: blog.publishedAt,
          author: blog.author ? {
            '@type': 'Person',
            name: `${blog.author.firstName} ${blog.author.lastName}`
          } : undefined
        }}
      />
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {blog.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
            {blog.author && (
              <div className="flex items-center gap-2">
                {blog.author.avatar ? (
                  <img
                    src={blog.author.avatar}
                    alt={`${blog.author.firstName} ${blog.author.lastName}`}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {blog.author.firstName} {blog.author.lastName}
                  </p>
                </div>
              </div>
            )}

            {blog.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
            )}

            {blog.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{blog.readTime}</span>
              </div>
            )}

            {blog.views > 0 && (
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>{blog.views} views</span>
              </div>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-bold prose-a:text-blue-600 prose-a:underline prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-gray-700 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 max-w-none mb-12 blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Share Section */}
        <div className="border-t border-b border-gray-200 py-8 my-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enjoyed this article?
              </h3>
              <p className="text-gray-600">
                Share it with your network!
              </p>
            </div>
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Article
            </button>
          </div>
        </div>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog._id}
                  to={`/blog/${relatedBlog.slug || relatedBlog._id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                >
                  {relatedBlog.featuredImage && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={relatedBlog.featuredImage}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedBlog.title}
                    </h3>
                    {relatedBlog.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {relatedBlog.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
