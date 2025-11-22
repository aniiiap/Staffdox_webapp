// client/src/pages/OAuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '../utils/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      setAuthToken(token);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token } }));
      
      navigate('/');
    } else {
      navigate('/login');
    }
  }, []);

  return <div className="p-6 text-center mt-24">Signing you in...</div>;
}
