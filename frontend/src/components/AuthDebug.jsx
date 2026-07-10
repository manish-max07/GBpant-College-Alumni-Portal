import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthDebug() {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    initialCheckComplete,
    getDashboardPath,
    retryAuth
  } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">🐛 Auth Debug</h3>
      <div>Loading: {loading ? '✅' : '❌'}</div>
      <div>Initial Check: {initialCheckComplete ? '✅' : '❌'}</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>User ID: {user?.id || 'N/A'}</div>
      <div>User Type: {user?.user_type || 'N/A'}</div>
      <div>Dashboard Path: {getDashboardPath()}</div>
      <div>Current Path: {window.location.pathname}</div>
      <div>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ None'}</div>
      {!isAuthenticated && localStorage.getItem('token') && (
        <button 
          onClick={retryAuth}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
        >
          🔄 Retry Auth
        </button>
      )}
    </div>
  );
}
