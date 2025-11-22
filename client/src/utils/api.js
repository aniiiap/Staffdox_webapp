// client/src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: false,
  timeout: 10000, // 10 second timeout for better UX
});

// Simple request cache to prevent duplicate requests
const requestCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds cache

const getCacheKey = (config) => {
  return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
};

// Request interceptor to add token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and cache responses
API.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' || !response.config.method) {
      const cacheKey = getCacheKey(response.config);
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    // Handle rate limiting errors (429) - don't logout
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 15; // Default to 15 seconds instead of 60
      const message = error.response?.data?.message || 'Too many requests. Please try again in a moment.';
      return Promise.reject({
        ...error,
        isRateLimit: true,
        retryAfter,
        message
      });
    }

    // Handle authentication errors (401) - only logout if token exists
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      // Only clear token if it exists (avoid clearing on public routes)
      if (token) {
        localStorage.removeItem('token');
        delete API.defaults.headers.common['Authorization'];
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { token: null } }));
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to get cached data (for use in components)
export function getCachedRequest(method, url, params = {}) {
  const cacheKey = `get-${url}-${JSON.stringify(params)}`;
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper function to clear cache (useful after mutations)
export function clearRequestCache(urlPattern) {
  if (urlPattern) {
    for (const [key] of requestCache) {
      if (key.includes(urlPattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
}

export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

export default API;
