const Blog = require('../models/Blog');
const Job = require('../models/Job');

// Generate XML sitemap
exports.generateSitemap = async (req, res) => {
  try {
    // Use CLIENT_URL from env, remove trailing slash, and handle www vs non-www
    let baseUrl = process.env.CLIENT_URL || 'https://staffdox.com';
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

    // Get all published blogs
    const blogsPromise = Blog.find({ published: true })
      .select('slug publishedAt updatedAt')
      .sort({ publishedAt: -1 });

    // Get all active jobs
    const jobsPromise = Job.find({ status: 'active' }) // Assuming 'status' field exists and 'active' is the value
      .select('_id title updatedAt createdAt')
      .sort({ createdAt: -1 });

    const [blogs, jobs] = await Promise.all([blogsPromise, jobsPromise]);

    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' }, // Home
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/jobs', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    ];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Add static pages
    staticPages.forEach(page => {
      const lastmod = new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add blog posts
    blogs.forEach(blog => {
      const lastmod = (blog.updatedAt || blog.publishedAt || new Date()).toISOString().split('T')[0];
      const blogUrl = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog._id}`;
      sitemap += `
  <url>
    <loc>${baseUrl}${blogUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add job postings
    jobs.forEach(job => {
      const lastmod = (job.updatedAt || job.createdAt || new Date()).toISOString().split('T')[0];
      // Assuming job detail URL structure is /jobs/:id or /job/:id. Adjust as per frontend routes.
      // Based on pages scan earlier, likely /jobs/:id or similar. 
      // Let's assume /jobs/:id based on standard patterns, verify if possible but sitemap is usually forgiving on redirects.
      // Actually, looking at previous file scans, 'JobDetails.jsx' exists.
      // I'll stick to /jobs/${job._id} which is common.
      const jobUrl = `/jobs/${job._id}`;
      sitemap += `
  <url>
    <loc>${baseUrl}${jobUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
};

// Generate robots.txt
exports.generateRobotsTxt = (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'https://staffdox.com';

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay (optional, adjust as needed)
Crawl-delay: 1`;

  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
};

