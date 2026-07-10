import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useAuth = () => {
  // Initialize user from localStorage for instant loading
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize authentication state based on both token and saved user
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return !!(token && savedUser);
  });
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  const checkAuthStatus = async (isInitialCheck = false, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second
    
    try {
      // Only set loading to true if this is not the initial check or if we're not already loading
      if (isInitialCheck) {
        setLoading(true);
        setInitialCheckComplete(false);
      }
      
      const token = localStorage.getItem('token');
      
      console.log('🔍 useAuth: Checking authentication status...', { 
        hasToken: !!token,
        currentPath: window.location.pathname,
        isInitialCheck,
        retryCount
      });
      
      if (!token) {
        console.log('❌ useAuth: No token found in localStorage');
        localStorage.removeItem('user'); // Also remove saved user data
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      console.log('🔍 useAuth: Token found, verifying with backend...');
      // Verify token with backend
      const response = await api.get('/api/profile/me');
      
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        
        console.log('✅ useAuth: Authentication successful', { 
          userId: userData?.id,
          userType: userData?.user_type,
          profileComplete: userData?.profile_complete
        });
        
        // Persist user data to localStorage for instant loading on refresh
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ useAuth: Invalid response from /me endpoint');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('❌ useAuth: Auth check failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        retryCount
      });
      
      // Check if this is a network error that we should retry
      const isNetworkError = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
      const shouldRetry = isNetworkError && retryCount < MAX_RETRIES && isInitialCheck;
      
      if (shouldRetry) {
        console.log(`🔄 useAuth: Retrying auth check in ${RETRY_DELAY}ms... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          checkAuthStatus(isInitialCheck, retryCount + 1);
        }, RETRY_DELAY);
        return; // Don't update state yet, we're retrying
      }
      
      // Only remove token if it's actually an auth error (401)
      // Keep token for network errors, server errors, etc. (but still set as not authenticated)
      if (error.response?.status === 401) {
        console.log('🔒 useAuth: Token is invalid/expired, removing from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (isNetworkError) {
        console.log('🌐 useAuth: Network error during auth check, keeping token but setting as not authenticated');
        // Don't clear user data for network errors - keep it for when connection is restored
      }
      
      // For auth errors, clear user data. For network errors, we might keep the cached user data
      if (error.response?.status === 401) {
        setUser(null);
      }
      setIsAuthenticated(false);
    } finally {
      console.log('🔍 useAuth: Setting loading to false');
      setLoading(false);
      if (isInitialCheck) {
        setInitialCheckComplete(true);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // Navigation will be handled by the component using this hook
  };

  const invalidateAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // This will trigger ProtectedRoute to redirect to login
  };

  const getDashboardPath = () => {
    if (user) {
      // Handle both user_type (from DB) and userType (from login response)
      const userType = user.user_type || user.userType;
      if (userType === 'alumni') {
        return '/alumni-dashboard';
      } else if (userType === 'student') {
        return '/student-dashboard';
      }
    }
    return '/';
  };

  useEffect(() => {
    console.log('🚀 useAuth: Initializing authentication check...');
    checkAuthStatus(true); // Mark this as initial check
    
    // Listen for storage changes (when token or user data is removed from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log(`🔄 ${e.key} changed in localStorage, rechecking auth status`);
        checkAuthStatus(false);
      }
    };
    
    // Listen for custom event when token is removed by API interceptor
    const handleTokenRemoved = () => {
      console.log('🔄 Token removed by API interceptor, updating auth state');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-token-removed', handleTokenRemoved);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-token-removed', handleTokenRemoved);
    };
  }, []);

  const retryAuth = () => {
    console.log('🔄 useAuth: Manual retry requested');
    checkAuthStatus(true);
  };

  return {
    user,
    loading,
    isAuthenticated,
    initialCheckComplete,
    checkAuthStatus,
    retryAuth,
    logout,
    invalidateAuth,
    getDashboardPath
  };
};

export default useAuth;
