import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { 
  Briefcase, 
  LogOut, 
  User, 
  Menu, 
  X,
  Search,
  Phone,
  ShoppingCart,
  Plus,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployerHeader() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [cart, setCart] = useState([]);
  const dropdownRef = useRef(null);
  const cartRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        API.get('/api/user/me')
          .then((response) => {
            setUser(response.data.user);
          })
          .catch(() => {
            setUser(null);
            localStorage.removeItem('token');
            delete API.defaults.headers.common['Authorization'];
          });
      } else {
        setUser(null);
      }
    };

    fetchUser();

    // Listen for auth state changes
    const handleAuthStateChange = () => {
      fetchUser();
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    return () => window.removeEventListener('authStateChanged', handleAuthStateChange);
  }, []);

  // Load cart from localStorage and listen for cart changes
  useEffect(() => {
    const loadCart = () => {
      const cartFromStorage = localStorage.getItem('paymentCart');
      if (cartFromStorage) {
        try {
          setCart(JSON.parse(cartFromStorage));
        } catch (error) {
          console.error('Error parsing cart:', error);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    };

    loadCart();
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Poll for cart changes (in case localStorage is updated directly)
    const interval = setInterval(loadCart, 500);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCartDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cart functions
  const updateCartQuantity = (planName, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(planName);
      return;
    }

    const updatedCart = cart.map(item => 
      item.name === planName 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('paymentCart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const removeFromCart = (planName) => {
    const updatedCart = cart.filter(item => item.name !== planName);
    setCart(updatedCart);
    
    if (updatedCart.length === 0) {
      localStorage.removeItem('paymentCart');
    } else {
      localStorage.setItem('paymentCart', JSON.stringify(updatedCart));
    }
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const getPlanPrice = (item) => {
    // If item has numericPrice, use it (from cart when plan is added)
    if (item?.numericPrice !== undefined && item.numericPrice !== null) {
      return item.numericPrice;
    }
    
    // If item has price as string, parse it
    if (item?.price) {
      if (item.price === 'Free' || item.price === 'Custom') return 0;
      // Remove currency symbols and commas, then parse
      const priceStr = item.price.toString().replace(/[₹,\s]/g, '');
      const price = parseInt(priceStr, 10);
      if (!isNaN(price)) return price;
    }
    
    // Fallback: if item is just a string (planName), use hardcoded prices for backward compatibility
    if (typeof item === 'string') {
      const planName = item;
      const prices = {
        'Basic': 1999,
        'Starter': 19999,
        'Professional': 39999,
        'Enterprise': 0,
        'Free': 0
      };
      return prices[planName] || 0;
    }
    
    return 0;
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = getPlanPrice(item);
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCartDropdown(false);
    // Navigate to checkout - cart will be loaded from localStorage
    navigate('/checkout');
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token: null } }));
    toast.success('Logged out successfully');
    navigate('/employer/login');
  };

  const scrollToPlans = () => {
    // If we're on the employer dashboard, scroll to plans
    if (location.pathname === '/employer/dashboard') {
      const plansSection = document.getElementById('plans-section');
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Otherwise, navigate to dashboard and scroll after a delay
      navigate('/employer/dashboard');
      setTimeout(() => {
        const plansSection = document.getElementById('plans-section');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/employer/dashboard" className="flex items-center">
            <div className="flex items-center">
              <img 
                src="/icons/staffdox_logo.png" 
                alt="Staffdox Logo" 
                className="h-10 w-auto mr-2"
              />
              <span className="text-2xl font-bold text-blue-500">Staffdox</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={scrollToPlans}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              Our Offerings
            </button>
            <Link
              to="/talent-cloud"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              Talent Cloud
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Phone Number */}
            <div className="hidden md:flex items-center space-x-2 text-gray-700">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+91 9351060628</span>
            </div>

            {/* Buy Online Button */}
            <button
              onClick={scrollToPlans}
              className="hidden md:block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Buy online
            </button>

            {/* Post a Job Button */}
            {user && (
              <Link
                to="/recruiter"
                className="hidden md:flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <span>Post a job</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">FREE</span>
              </Link>
            )}

            {/* Shopping Cart */}
            <div className="relative hidden md:block" ref={cartRef}>
              <button 
                onClick={() => setShowCartDropdown(prev => !prev)}
                className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ShoppingCart className="w-5 h-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                    {getCartItemCount() > 9 ? '9+' : getCartItemCount()}
                  </span>
                )}
              </button>

              {/* Cart Dropdown */}
              {showCartDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border max-h-96 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
                  </div>
                  
                  <div className="overflow-y-auto flex-1">
                    {cart.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        Your cart is Empty
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {cart.map((item) => {
                          const price = getPlanPrice(item);
                          const itemTotal = price * (item.quantity || 1);

                          return (
                            <div key={item.name} className="px-4 py-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    {item.quantity || 1} {item.name} Plan{(item.quantity || 1) > 1 ? 's' : ''}
                                  </h4>
                                  <p className="text-xs text-gray-600 mt-1">{item.description || `${item.name} subscription plan`}</p>
                                </div>
                                <p className="font-semibold text-gray-900 ml-2 text-sm">₹{itemTotal.toLocaleString('en-IN')}</p>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <button
                                    onClick={() => updateCartQuantity(item.name, (item.quantity || 1) - 1)}
                                    className="p-1 hover:bg-gray-100 transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <span className="px-3 py-1 text-xs font-medium text-gray-900 min-w-[2rem] text-center">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    onClick={() => updateCartQuantity(item.name, (item.quantity || 1) + 1)}
                                    className="p-1 hover:bg-gray-100 transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.name)}
                                  className="text-xs text-red-600 hover:text-red-700 ml-auto"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t px-4 py-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 text-sm">Total</span>
                        <span className="font-bold text-gray-900">₹{calculateCartTotal().toLocaleString('en-IN')}</span>
                      </div>
                      <button
                        onClick={handleProceedToCheckout}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors text-sm mt-2"
                      >
                        Proceed to checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
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
                  <span className="hidden md:block">{user.firstName || user.email}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 break-all">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/recruiter"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Briefcase className="w-4 h-4 mr-3" />
                      Recruiter Dashboard
                    </Link>
                    
                    <Link
                      to="/recruiter?tab=applicants"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Briefcase className="w-4 h-4 mr-3" />
                      My Applicants
                    </Link>
                    
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
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/employer/login?tab=register"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/employer/login?tab=register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  scrollToPlans();
                }}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 w-full text-left"
              >
                Our Offerings
              </button>
              <Link
                to="/talent-cloud"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                Talent Cloud
              </Link>
              {user && (
                <Link
                  to="/recruiter"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Post a job
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

