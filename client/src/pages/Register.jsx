// client/src/pages/Register.jsx
import React, { useState } from 'react';
import API, { setAuthToken } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: ''});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/api/auth/register', form);
      const { token } = data;
      localStorage.setItem('token', token);
      setAuthToken(token);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token } }));
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const continueWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  }

  const continueWithLinkedIn = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/linkedin`;
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <input name="firstName" placeholder="First name" required onChange={handleChange} className="flex-1 p-3 border rounded" />
          <input name="lastName" placeholder="Last name" onChange={handleChange} className="flex-1 p-3 border rounded" />
        </div>

        <input name="email" type="email" required onChange={handleChange} className="w-full p-3 border rounded" placeholder="Email" />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            onChange={handleChange}
            className="w-full p-3 border rounded"
            placeholder="Password"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
          >
            {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </span>
        </div>

        <button className="w-full p-3 bg-green-600 text-white rounded">Create account</button>
      </form>

      <div className="mt-4 text-center">
        <p className="mb-2">or</p>
        <button
          onClick={continueWithGoogle}
          className="w-full p-3 border rounded flex items-center justify-center mb-2"
        >
          <img src="/icons/google.jpg" alt="Google" className="w-5 h-5 mr-2" />
          Continue with Google
        </button>

        <button
          onClick={continueWithLinkedIn}
          className="w-full p-3 border rounded flex items-center justify-center"
        >
          <img src="/icons/linkedin.jpg" alt="LinkedIn" className="w-5 h-5 mr-2" />
          Continue with LinkedIn
        </button>

        <p className="mt-3 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
