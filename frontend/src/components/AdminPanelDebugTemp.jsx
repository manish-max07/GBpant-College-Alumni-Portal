import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  FaShieldAlt,
  FaUserShield,
  FaTimes
} from 'react-icons/fa';

const AdminPanelFixed = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  // Only show admin panel for the specific admin email
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  useEffect(() => {
    console.log('🔧 AdminPanelFixed mounted');
    console.log('👤 User:', user);
    console.log('📧 User email:', user?.email);
    console.log('🔑 Is Admin:', isAdmin);
    console.log('🔑 Expected Admin:', ADMIN_EMAIL);
    
    setDebugInfo({
      userExists: !!user,
      userEmail: user?.email || 'No email',
      isAdmin: isAdmin,
      expectedAdmin: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
  }, [user, isAdmin]);

  const testAPI = async () => {
    try {
      console.log('🧪 Testing blocked entities API...');
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 50) + '...');
      }
      
      const response = await api.get('/api/admin/blocked-entities');
      console.log('✅ API Test Response:', response.data);
      toast.success('API Test Successful!');
    } catch (error) {
      console.error('❌ API Test Failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
      toast.error('API Test Failed: ' + (error.response?.data?.message || error.message));
    }
  };

  console.log('🔄 AdminPanelFixed render - isAdmin:', isAdmin, 'user:', user?.email);

  return (
    <div>
      {/* Debug Info Display - Always visible for admin testing */}
      {isAdmin && (
        <div 
          className="fixed top-4 left-4 z-[9999] bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-sm max-w-sm"
          style={{ zIndex: 9999 }}
        >
          <div className="font-bold mb-2">🔧 Admin Debug Info:</div>
          <div>User: {debugInfo.userEmail}</div>
          <div>Is Admin: {debugInfo.isAdmin ? '✅' : '❌'}</div>
          <div>Time: {debugInfo.timestamp?.substring(11, 19)}</div>
          <div className="mt-2">
            <button 
              onClick={testAPI}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
            >
              Test API
            </button>
            <button 
              onClick={() => setIsVisible(!isVisible)}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
            >
              {isVisible ? 'Hide' : 'Show'} Panel
            </button>
          </div>
        </div>
      )}

      {/* Only show admin button if user is admin */}
      {isAdmin && (
        <>
          {/* Floating Admin Button */}
          <button
            onClick={() => {
              console.log('🔧 AdminPanel: Toggle button clicked');
              setIsVisible(!isVisible);
            }}
            className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 animate-pulse"
            title="Admin Security Panel"
            style={{ zIndex: 9999 }}
          >
            <FaUserShield className="w-5 h-5" />
          </button>

          {/* Admin Panel Modal */}
          {isVisible && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
                onClick={() => setIsVisible(false)}
                style={{ zIndex: 9998 }}
              />
              <div 
                className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none"
                style={{ zIndex: 9999 }}
              >
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                      <FaShieldAlt className="w-6 h-6" />
                      <h2 className="text-xl font-bold">Admin Security Panel (DEBUG MODE)</h2>
                    </div>
                    <button
                      onClick={() => setIsVisible(false)}
                      className="text-red-200 hover:text-white transition-colors p-2"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-bold text-green-800 mb-2">✅ Admin Panel is Working!</h3>
                      <p className="text-green-700 mb-2">
                        You are successfully authenticated as an admin. The panel is now visible!
                      </p>
                      <div className="text-sm text-green-600">
                        <strong>Admin Email:</strong> {user?.email}<br/>
                        <strong>Expected:</strong> {ADMIN_EMAIL}<br/>
                        <strong>Match:</strong> {isAdmin ? '✅ YES' : '❌ NO'}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">🧪 API Test Section:</h4>
                      <p className="text-blue-700 mb-3">
                        Test the blocked entities API endpoints to ensure they're working correctly.
                      </p>
                      <button 
                        onClick={testAPI}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
                      >
                        Test GET /api/admin/blocked-entities
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const response = await api.get('/api/admin/blocked-entities/stats');
                            console.log('📊 Stats Response:', response.data);
                            toast.success('Stats API working!');
                          } catch (error) {
                            console.error('❌ Stats API Failed:', error);
                            toast.error('Stats API failed: ' + error.message);
                          }
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        Test GET /api/admin/blocked-entities/stats
                      </button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚡ Quick Actions:</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            console.log('🔄 Reloading page...');
                            window.location.reload();
                          }}
                          className="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                          🔄 Reload Page
                        </button>
                        <button 
                          onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                          }}
                          className="block w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                        >
                          🚪 Logout & Clear Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanelFixed;
