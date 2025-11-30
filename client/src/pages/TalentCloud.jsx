import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmployerHeader from '../components/EmployerHeader';
import EmployerFooter from '../components/EmployerFooter';
import {
  CreditCard,
  Users,
  Shield,
  Briefcase,
  Search,
  ArrowRight
} from 'lucide-react';

export default function TalentCloud() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = [
    {
      id: 'assisted-hiring',
      title: 'Assisted Hiring',
      description: 'Get expert assistance in finding and hiring the right talent for your organization.',
      icon: Briefcase,
      color: 'orange'
    },
    {
      id: 'screening',
      title: 'Screening',
      description: 'Efficiently screen and evaluate candidates with our advanced screening tools and assessments.',
      icon: Search,
      color: 'indigo'
    },
    {
      id: 'compliance-management',
      title: 'Compliance Management',
      description: 'Stay compliant with labor laws and regulations with our automated compliance management system.',
      icon: Shield,
      color: 'purple'
    },
    {
      id: 'payroll-management',
      title: 'Payroll Management',
      description: 'Streamline and automate your employee payment processes with our comprehensive payment management solution.',
      icon: CreditCard,
      color: 'blue'
    },
    {
      id: 'third-party-payroll',
      title: 'Third Party Payroll',
      description: 'Outsource your payroll operations to experts and focus on your core business activities.',
      icon: Users,
      color: 'green'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        icon: 'text-blue-600',
        hover: 'hover:bg-blue-50',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-100',
        icon: 'text-green-600',
        hover: 'hover:bg-green-50',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-100',
        icon: 'text-purple-600',
        hover: 'hover:bg-purple-50',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-100',
        icon: 'text-orange-600',
        hover: 'hover:bg-orange-50',
        border: 'border-orange-200'
      },
      indigo: {
        bg: 'bg-indigo-100',
        icon: 'text-indigo-600',
        hover: 'hover:bg-indigo-50',
        border: 'border-indigo-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <EmployerHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Staffdox Talent Cloud</h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              One-Stop Solution. Talent Decoded.
            </p>
            <p className="text-lg text-indigo-200 mt-4 max-w-3xl mx-auto">
              Comprehensive talent management solutions including payment processing, payroll services, compliance management, assisted hiring, and candidate screening to streamline your HR operations.
            </p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Solutions For</h2>
          <p className="text-lg text-gray-600">
            Explore our comprehensive suite of talent management solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            const colors = getColorClasses(service.color);
            
            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl shadow-lg border-2 ${colors.border} p-6 transition-all ${colors.hover} hover:shadow-xl cursor-pointer group`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`${colors.bg} rounded-lg p-3 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Hiring Process?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get in touch with our team to learn more about how Staffdox Talent Cloud can help your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/employer/login?tab=sales"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/employer/dashboard"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>

      <EmployerFooter />
    </div>
  );
}

