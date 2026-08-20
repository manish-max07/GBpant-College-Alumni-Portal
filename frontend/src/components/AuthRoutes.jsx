import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from './Loading';
import PendingApproval from './PendingApproval';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Component to protect routes that require authentication
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialCheckComplete, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Auth state changed', {
      isAuthenticated,
      loading,
      initialCheckComplete,
      currentPath: window.location.pathname
    });
    
    // Only redirect if the initial auth check is complete and user is not authenticated
    if (initialCheckComplete && !loading && !isAuthenticated) {
      console.log('❌ ProtectedRoute: User not authenticated after initial check, redirecting to login');
      // Clear any stale data and redirect to login
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    } else if (!loading && isAuthenticated) {
      console.log('✅ ProtectedRoute: User authenticated, staying on current page');
    }
  }, [isAuthenticated, loading, initialCheckComplete, navigate]);

  // Show loading while we're still checking authentication status
  if (loading || !initialCheckComplete) {
    console.log('⏳ ProtectedRoute: Still loading authentication state...');
    return <Loading />;
  }

  // If initial check is complete and user is not authenticated, return null (will redirect via useEffect)
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: Not authenticated after initial check, will redirect');
    return null;
  }

  // If profile is complete but account is not yet approved, show pending screen
  // Admin bypasses this check
  const isAdmin = ADMIN_EMAIL && user?.email === ADMIN_EMAIL;
  if (user && user.profile_complete && !user.is_approved && !isAdmin) {
    console.log('⏳ ProtectedRoute: Profile complete but account pending approval');
    return <PendingApproval />;
  }

  console.log('✅ ProtectedRoute: Rendering protected content');
  return children;
};

// Component to redirect authenticated users away from auth pages
export const PublicRoute = ({ children, redirectIfAuthenticated = true }) => {
  const { isAuthenticated, loading, initialCheckComplete, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is authenticated
    if (initialCheckComplete && !loading && isAuthenticated && redirectIfAuthenticated) {
      console.log('✅ PublicRoute: User authenticated, redirecting to dashboard');
      const dashboardPath = getDashboardPath();
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, loading, initialCheckComplete, redirectIfAuthenticated, getDashboardPath, navigate]);

  // Show loading while we're still checking authentication status
  if (loading || !initialCheckComplete) {
    return <Loading />;
  }

  // If user is authenticated and we should redirect, return null (will redirect via useEffect)
  if (isAuthenticated && redirectIfAuthenticated) {
    return null;
  }

  return children;
};

export default { ProtectedRoute, PublicRoute };
