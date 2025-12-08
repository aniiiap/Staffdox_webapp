// client/src/pages/Login.jsx
import React, { useState } from 'react';
import API, { setAuthToken } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: ''});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/api/auth/login', form);
      const { token } = data;
      localStorage.setItem('token', token);
      setAuthToken(token);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token } }));
      
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const continueWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  }

  const continueWithLinkedIn = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/linkedin`;
  };

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-16 lg:mt-24 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Login</h2>
      <form onSubmit={submit} className="space-y-3 sm:space-y-4">
        <input 
          name="email" 
          type="email" 
          required 
          value={form.email} 
          onChange={handleChange}
          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" 
          placeholder="Email" 
        />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            onChange={handleChange}
            className="w-full p-2.5 sm:p-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Password"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
          >
            {showPassword ? <EyeOffIcon size={18} className="sm:w-5 sm:h-5" /> : <EyeIcon size={18} className="sm:w-5 sm:h-5" />}
          </span>
        </div>

        <div className="text-right">
          <Link to="/user-forgot-password" className="text-xs sm:text-sm text-blue-600 hover:underline">Forgot password?</Link>
        </div>

        <button className="w-full p-2.5 sm:p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium">Login</button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="mb-2 sm:mb-3 text-sm sm:text-base">or</p>
        <button
          onClick={continueWithGoogle}
          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-md flex items-center justify-center mb-2 hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          <img src="/icons/google.jpg" alt="Google" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Continue with Google</span>
          <span className="sm:hidden">Google</span>
        </button>

        <button
          onClick={continueWithLinkedIn}
          className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          <img src="/icons/linkedin.jpg" alt="LinkedIn" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Continue with LinkedIn</span>
          <span className="sm:hidden">LinkedIn</span>
        </button>

        <p className="mt-3 sm:mt-4 text-xs sm:text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
