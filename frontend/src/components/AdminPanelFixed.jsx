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
        setBlockingStats(response.data.stats);
      } else {
        setBlockingStats(null);
      }
    } catch (error) {
      console.error('❌ Failed to load blocking stats:', error);
      setBlockingStats(null);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.entityValue.trim() || !newBlock.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('➕ Adding new block:', newBlock);
      const response = await api.post('/api/admin/blocked-entities', {
        entityType: newBlock.entityType,
        entityValue: newBlock.entityValue.trim(),
        duration: newBlock.duration,
        reason: newBlock.reason.trim()
      });

      console.log('✅ Add block response:', response.data);
      if (response.data.success) {
        toast.success(`${newBlock.entityType.toUpperCase()} blocked successfully!`);
        setNewBlock({
          entityType: 'ip',
          entityValue: '',
          duration: '24',
          reason: ''
        });
        setShowAddForm(false);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to block entity:', error);
      toast.error(error.response?.data?.message || 'Failed to block entity');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (entityId, entityType, entityValue) => {
    if (!window.confirm(`Unblock ${entityType}: ${entityValue}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔓 Unblocking entity:', entityId);
      const response = await api.put(`/api/admin/blocked-entities/${entityId}/unblock`);
      console.log('✅ Unblock response:', response.data);
      
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} unblocked successfully!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to unblock entity:', error);
      toast.error('Failed to unblock entity');
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'ip': return <FaNetworkWired className="w-4 h-4" />;
      case 'email': return <FaEnvelope className="w-4 h-4" />;
      case 'domain': return <FaGlobe className="w-4 h-4" />;
      default: return <FaShieldAlt className="w-4 h-4" />;
    }
  };

  const getDurationLabel = (hours) => {
    if (!hours || hours > 100000) return 'Permanent';
    if (hours === 1) return '1 hour';
    if (hours === 10) return '10 hours';
    if (hours === 24) return '24 hours';
    if (hours === 168) return '1 week';
    return `${hours} hours`;
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Floating Admin Button */}
      <button
        onClick={() => {
          console.log('🔧 AdminPanel: Toggle button clicked');
          setIsVisible(!isVisible);
        }}
        className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
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
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <FaShieldAlt className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Admin Security Panel</h2>
                  <span className="bg-red-800 px-2 py-1 rounded text-xs">ADMIN ONLY</span>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-red-200 hover:text-white transition-colors p-2"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700">
                    <strong>Status:</strong> {loading ? 'Loading...' : 'Ready'}<br/>
                    <strong>Admin:</strong> {user?.email}<br/>
                    <strong>Entities Loaded:</strong> {blockedEntities.length}<br/>
                    <strong>Stats Loaded:</strong> {blockingStats ? 'Yes' : 'No'}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => { loadBlockedEntities(); loadBlockingStats(); }}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FaSyncAlt className="w-4 h-4" />
                    <span>Refresh Data</span>
                  </button>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 p-3 rounded-lg transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span>Add Block</span>
                  </button>

                  <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 text-purple-700 p-3 rounded-lg">
                    <FaLock className="w-4 h-4" />
                    <span>{blockedEntities.length} Blocked</span>
                  </div>

                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
                    <FaServer className="w-4 h-4" />
                    <span>System OK</span>
                  </div>
                </div>

                {/* Add Block Form */}
                {showAddForm && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <FaPlus className="w-5 h-5 mr-2" />
                      Add New Block
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                        <select
                          value={newBlock.entityType}
                          onChange={(e) => setNewBlock({...newBlock, entityType: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="ip">IP Address</option>
                          <option value="email">Email Address</option>
                          <option value="domain">Domain Name</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Block Duration</label>
                        <select
                          value={newBlock.duration}
                          onChange={(e) => setNewBlock({...newBlock, duration: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="1">1 Hour</option>
                          <option value="10">10 Hours</option>
                          <option value="24">24 Hours</option>
                          <option value="168">1 Week</option>
                          <option value="999999">Infinite (Until Unblocked)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {newBlock.entityType === 'ip' ? 'IP Address' : newBlock.entityType === 'email' ? 'Email Address' : 'Domain Name'}
                        </label>
                        <input
                          type="text"
                          value={newBlock.entityValue}
                          onChange={(e) => setNewBlock({...newBlock, entityValue: e.target.value})}
                          placeholder={newBlock.entityType === 'ip' ? '192.168.1.1' : newBlock.entityType === 'email' ? 'user@example.com' : 'example.com'}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Block Reason</label>
                        <input
                          type="text"
                          value={newBlock.reason}
                          onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                          placeholder="Reason for blocking this entity"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={handleAddBlock}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Blocking...' : 'Block Entity'}
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Blocking Statistics */}
                {blockingStats && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaChartBar className="w-5 h-5 mr-2 text-blue-600" />
                      Blocking Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded border text-center">
                        <div className="text-2xl font-bold text-blue-600">{blockingStats.totalBlocked || 0}</div>
                        <div className="text-sm text-gray-600">Total Blocked</div>
                      </div>
                      <div className="bg-white p-3 rounded border text-center">
                        <div className="text-2xl font-bold text-red-600">{blockingStats.blockedIPs || 0}</div>
                        <div className="text-sm text-gray-600">Blocked IPs</div>
                      </div>
                      <div className="bg-white p-3 rounded border text-center">
                        <div className="text-2xl font-bold text-yellow-600">{blockingStats.blockedEmails || 0}</div>
                        <div className="text-sm text-gray-600">Blocked Emails</div>
                      </div>
                      <div className="bg-white p-3 rounded border text-center">
                        <div className="text-2xl font-bold text-purple-600">{blockingStats.blockedDomains || 0}</div>
                        <div className="text-sm text-gray-600">Blocked Domains</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocked Entities List */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-600" />
                    Blocked Entities ({blockedEntities.length})
                  </h3>

                  {loading && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-gray-600">Loading...</span>
                      </div>
                    </div>
                  )}

                  {!loading && blockedEntities.length === 0 && (
                    <div className="text-green-700 bg-green-100 p-3 rounded border border-green-200">
                      ✅ No entities are currently blocked - System is clean!
                    </div>
                  )}

                  {!loading && blockedEntities.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {blockedEntities.map((entity) => (
                        <div key={entity.id} className="bg-white p-4 rounded border border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-red-600">
                                {getEntityIcon(entity.entity_type)}
                              </div>
                              <div>
                                <div className="font-mono text-sm font-semibold text-red-900">
                                  {entity.entity_value}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center space-x-2">
                                  <span className="capitalize bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {entity.entity_type}
                                  </span>
                                  <span>•</span>
                                  <span>{entity.block_reason}</span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <FaClock className="w-3 h-3 mr-1" />
                                    {getDurationLabel(entity.blocking_duration_hours)}
                                  </span>
                                  <span>•</span>
                                  <span>Blocked: {new Date(entity.blocked_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblock(entity.id, entity.entity_type, entity.entity_value)}
                              disabled={loading}
                              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 flex items-center space-x-1"
                            >
                              <FaUnlock className="w-3 h-3" />
                              <span>Unblock</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminPanelFixed;
