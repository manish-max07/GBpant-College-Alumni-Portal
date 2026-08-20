import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../config/index.js';

console.log('🌐 API Base URL:', config.API_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔑 Adding token to request:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('❌ API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      code: error.response?.data?.code,
      url: error.config?.url
    });

    if (error.response?.status === 401) {
      // Token expired or invalid - clear token but don't redirect here
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || 'Session expired';
      
      console.log('🔒 Authentication error - clearing token');
      localStorage.removeItem('token');
      
      // Dispatch custom event to notify useAuth hook
      window.dispatchEvent(new CustomEvent('auth-token-removed'));
      
      if (errorCode === 'TOKEN_EXPIRED') {
        toast.error('Your session has expired. Please login again.');
      } else {
        toast.error('Please login to continue.');
      }
      
      // Don't redirect here - let the useAuth hook and ProtectedRoute handle it
      // This prevents conflicts with React Router
    } else if (error.response?.status === 403) {
      const msg = error.response?.data?.message || 'Access denied - insufficient permissions';
      toast.error(msg);
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
