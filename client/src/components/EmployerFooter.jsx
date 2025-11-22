import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram
} from 'lucide-react';

export default function EmployerFooter() {
  const currentYear = new Date().getFullYear();

  const employerLinks = [
    { name: 'Post a Job', href: '/employer/login#plans-section' },
    { name: 'Find Candidates', href: '/employer/login' },
    { name: 'Recruitment Services', href: '/employer/dashboard' },
    { name: 'Employer Resources', href: '/employer/dashboard' }
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about', clickable: false },
    { name: 'Contact', href: '/contact', clickable: true },
    { name: 'Privacy Policy', href: '/privacy-policy', clickable: true },
    { name: 'Terms & Conditions', href: '/terms-and-conditions', clickable: true }
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/help', clickable: false },
    { name: 'FAQs', href: '/faq', clickable: false },
    { name: 'Contact Support', href: '/contact', clickable: true },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/icons/staffdox_logo.png" 
                alt="Staffdox Logo" 
                className="h-10 w-auto mr-2"
              />
              <span className="text-2xl font-bold">Staffdox</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering businesses to find the right talent. Your trusted recruitment partner.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:info@staffdox.co.in" className="flex items-center text-gray-300 hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
                <span>info@staffdox.co.in</span>
              </a>
              <a href="tel:+919351060628" className="flex items-center text-gray-300 hover:text-blue-400 transition-colors">
                <Phone className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
                <span>+91 9351060628</span>
              </a>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
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
              <a href="https://www.linkedin.com/company/107484269/admin/dashboard/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/staffdox/" target="_blank" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2">
              {employerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  {link.clickable !== false ? (
                    <Link 
                      to={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <span className="text-gray-500 cursor-not-allowed">
                      {link.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  {link.clickable ? (
                    <Link 
                      to={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <span className="text-gray-500 cursor-not-allowed">
                      {link.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Staffdox. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
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
}

