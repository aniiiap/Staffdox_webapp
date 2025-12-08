import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ArrowRight
} from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setSubscribing(true);
    try {
      await API.post('/api/newsletter/subscribe', { email: email.trim() });
      toast.success('Successfully subscribed! Check your email for confirmation.');
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const jobCategories = [
    'Technology', 'Finance', 'Healthcare', 'Marketing', 'Sales',
    'Human Resources', 'Operations', 'Design', 'Education'
  ];

  const companyLinks = [
    // { name: 'About Us', href: '/about' },
    // { name: 'Our Team', href: '/team' },
    // { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact' }
  ];

  const candidateLinks = [
    { name: 'Find Jobs', href: '/jobs' },
    { name: 'Career Advice', href: '/career-advice' }
  ];

  // const employerLinks = [
  //   { name: 'Post a Job', href: '/post-job' },
  //   { name: 'Find Candidates', href: '/candidates' },
  //   { name: 'Recruitment Services', href: '/recruitment' },
  //   { name: 'Employer Resources', href: '/employer-resources' }
  // ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-3 sm:mb-4">
              <img 
                src="/icons/staffdox_logo.png" 
                alt="Staffdox Logo" 
                className="h-8 sm:h-10 w-auto mr-2"
              />
              <span className="text-xl sm:text-2xl font-bold">Staffdox</span>
            </div>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed">
              Connecting talented professionals with top employers. Your career success is our mission.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 sm:space-y-3">
              <a href="mailto:info@staffdox.co.in" className="flex items-start sm:items-center text-gray-300 hover:text-blue-400 transition-colors text-sm sm:text-base">
                <Mail className="w-4 h-4 mr-2 sm:mr-3 text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-all">info@staffdox.co.in</span>
              </a>
              <a href="tel:+919351060628" className="flex items-center text-gray-300 hover:text-blue-400 transition-colors text-sm sm:text-base">
                <Phone className="w-4 h-4 mr-2 sm:mr-3 text-blue-400 flex-shrink-0" />
                <span>+91 9351060628</span>
              </a>
              <div className="flex items-start sm:items-center text-gray-300 text-sm sm:text-base">
                <MapPin className="w-4 h-4 mr-2 sm:mr-3 text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span>Office No 4&5, Second Floor, NTC, Bhilwara, Rajasthan 311001</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4 mt-6">
              {/* <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a> */}
              <a href="https://www.linkedin.com/company/107484269/admin/dashboard/" target="_blank" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/staffdox/" target="_blank" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Job Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Job Categories</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {jobCategories.map((category) => (
                <li key={category}>
                  <Link 
                    to={`/jobs?category=${category}`}
                    className="text-sm sm:text-base text-gray-300 hover:text-blue-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span>{category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm sm:text-base text-gray-300 hover:text-blue-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Candidate & Employer Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">For Candidates</h3>
            <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
              {candidateLinks.map((link) => (
                <li key={link.name}>
                  {link.name === 'Career Advice' ? (
                    <span className="text-gray-500 flex items-center cursor-not-allowed">
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0" />
                      {link.name}
                    </span>
                  ) : (
                    <Link 
                      to={link.href}
                      onClick={() => {
                        // Scroll to top when clicking Find Jobs or other candidate links
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-gray-300 hover:text-blue-400 transition-colors flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* <h3 className="text-lg font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2">
              {employerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul> */}
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left mb-2 sm:mb-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Stay Updated</h3>
              <p className="text-sm sm:text-base text-gray-300">Get the latest job opportunities and career tips delivered to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={subscribing}
                required
                className="flex-1 sm:w-64 px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              />
              <button 
                type="submit"
                disabled={subscribing}
                className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 rounded-r-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <span className="mr-1 sm:mr-2">{subscribing ? 'Subscribing...' : 'Subscribe'}</span>
                {!subscribing && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © {currentYear} Staffdox. All rights reserved.
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="text-gray-400 hover:text-blue-400 transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
