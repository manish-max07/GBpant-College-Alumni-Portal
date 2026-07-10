import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserShield,
  FaSyncAlt,
  FaTimes,
  FaPlus,
  FaLock,
  FaUnlock,
  FaGlobe,
  FaEnvelope,
  FaNetworkWired,
  FaTrash
} from 'react-icons/fa';

const AdminPanelWorkingFull = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [blockedEntities, setBlockedEntities] = useState([]);
  const [blockingStats, setBlockingStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    entityType: 'ip',
    entityValue: '',
    duration: '24',
    reason: ''
  });

  // Only show admin panel for the specific admin email
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  console.log('🔧 AdminPanel Debug:', { 
    user: user?.email, 
    isAdmin, 
    isVisible,
    blockedEntitiesCount: blockedEntities.length 
  });

  useEffect(() => {
    if (isAdmin && isVisible) {
      loadBlockedEntities();
      loadBlockingStats();
    }
  }, [isAdmin, isVisible]);

  const loadBlockedEntities = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('📋 Loading blocked entities...');
      const response = await api.get('/api/admin/blocked-entities');
      console.log('✅ Blocked entities response:', response.data);
      
      if (response.data.success) {
        setBlockedEntities(response.data.data || []);
        toast.success(`Loaded ${response.data.data?.length || 0} blocked entities`);
      } else {
        console.error('API returned success: false');
        setBlockedEntities([]);
      }
    } catch (error) {
      console.error('❌ Failed to load blocked entities:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load blocked entities');
      }
      setBlockedEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockingStats = async () => {
    try {
      console.log('📊 Loading blocking stats...');
      const response = await api.get('/api/admin/blocked-entities/stats');
      console.log('✅ Blocking stats response:', response.data);
      
      if (response.data.success) {
        setBlockingStats(response.data.data);
        toast.success('Loaded blocking stats');
      } else {
        console.error('Stats API returned success: false');
        setBlockingStats(null);
      }
    } catch (error) {
      console.error('❌ Failed to load blocking stats:', error);
      toast.error('Failed to load stats');
      setBlockingStats(null);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.entityType || !newBlock.entityValue.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🚫 Adding new blocked entity:', newBlock);
      const response = await api.post('/api/admin/blocked-entities', {
        entity_type: newBlock.entityType,
        entity_value: newBlock.entityValue.trim(),
        duration_hours: newBlock.duration === 'permanent' ? null : parseInt(newBlock.duration),
        reason: newBlock.reason || 'Added by admin'
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
      console.error('❌ Failed to add blocked entity:', error);
      if (error.response?.status === 409) {
        toast.error('This entity is already blocked');
      } else {
        toast.error('Failed to add blocked entity: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (entityId, entityType, entityValue) => {
    if (!window.confirm(`Are you sure you want to unblock this ${entityType}: ${entityValue}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔓 Unblocking entity:', entityId);
      const response = await api.put(`/api/admin/blocked-entities/${entityId}`, {
        action: 'unblock',
        reason: 'Unblocked by admin'
      });
      console.log('✅ Unblock response:', response.data);
      
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} unblocked successfully!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to unblock entity:', error);
      toast.error('Failed to unblock entity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReblock = async (entityId, entityType, entityValue, originalReason) => {
    if (!window.confirm(`Are you sure you want to re-block this ${entityType}: ${entityValue}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔁 Re-blocking entity:', entityId);
      
      // Re-block with 24 hours duration by default
      const response = await api.put(`/api/admin/blocked-entities/${entityId}`, {
        action: 'extend',
        duration_hours: 24,
        reason: originalReason || 'Re-blocked by admin'
      });
      console.log('✅ Re-block response:', response.data);
      
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} re-blocked successfully for 24 hours!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to re-block entity:', error);
      toast.error('Failed to re-block entity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async (entityId, entityType, entityValue) => {
    if (!window.confirm(`Are you sure you want to permanently DELETE this ${entityType}: ${entityValue}?\n\nThis action cannot be undone!`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Deleting entity:', entityId);
      const response = await api.delete(`/api/admin/blocked-entities/${entityId}`);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} permanently deleted!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to delete entity:', error);
      toast.error('Failed to delete entity: ' + (error.response?.data?.message || error.message));
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      loadBlockedEntities();
                      loadBlockingStats();
                    }}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                    <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>Add Block</span>
                  </button>
                </div>

                {/* Stats Overview */}
                {blockingStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100">Total Blocked</p>
                          <p className="text-2xl font-bold">{blockingStats.totals?.total || 0}</p>
                        </div>
                        <FaShieldAlt className="w-8 h-8 text-red-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100">Active</p>
                          <p className="text-2xl font-bold">{blockingStats.totals?.active || 0}</p>
                        </div>
                        <FaLock className="w-8 h-8 text-orange-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Expired</p>
                          <p className="text-2xl font-bold">{blockingStats.totals?.expired || 0}</p>
                        </div>
                        <FaUnlock className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Block Form */}
                {showAddForm && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Blocked Entity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Entity Type
                        </label>
                        <select
                          value={newBlock.entityType}
                          onChange={(e) => setNewBlock({...newBlock, entityType: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="ip">IP Address</option>
                          <option value="email">Email Address</option>
                          <option value="domain">Domain Name</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <select
                          value={newBlock.duration}
                          onChange={(e) => setNewBlock({...newBlock, duration: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="1">1 Hour</option>
                          <option value="10">10 Hours</option>
                          <option value="24">24 Hours</option>
                          <option value="168">1 Week</option>
                          <option value="permanent">Permanent</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Entity Value *
                        </label>
                        <input
                          type="text"
                          value={newBlock.entityValue}
                          onChange={(e) => setNewBlock({...newBlock, entityValue: e.target.value})}
                          placeholder={
                            newBlock.entityType === 'ip' ? 'e.g., 192.168.1.100' :
                            newBlock.entityType === 'email' ? 'e.g., user@example.com' :
                            'e.g., example.com'
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason (Optional)
                        </label>
                        <textarea
                          value={newBlock.reason}
                          onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                          placeholder="Optional reason for blocking..."
                          rows={2}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleAddBlock}
                        disabled={loading || !newBlock.entityValue.trim()}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Block Entity'}
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Blocked Entities List */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Blocked Entities ({blockedEntities.length})</h3>
                  </div>
                  {blockedEntities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FaExclamationTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No blocked entities found.</p>
                      <p className="text-sm">Click "Add Block" to start blocking entities.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {blockedEntities.map((entity) => (
                        <div key={entity.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {getEntityIcon(entity.entity_type)}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                                  <span>{entity.entity_value}</span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {entity.entity_type.toUpperCase()}
                                  </span>
                                  {entity.is_active ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      ACTIVE
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      EXPIRED
                                    </span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Blocked: {formatDate(entity.blocked_at)}
                                  {entity.blocked_until && (
                                    <span> • Expires: {formatDate(entity.blocked_until)}</span>
                                  )}
                                  {entity.is_permanent && <span> • Permanent</span>}
                                </p>
                                {entity.reason && (
                                  <p className="text-sm text-gray-600 italic">Reason: {entity.reason}</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  Blocked by: {entity.blocked_by}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {entity.is_active ? (
                                <button
                                  onClick={() => handleUnblock(entity.id, entity.entity_type, entity.entity_value)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                                  disabled={loading}
                                >
                                  <FaUnlock className="w-3 h-3" />
                                  <span>Unblock</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReblock(entity.id, entity.entity_type, entity.entity_value, entity.reason)}
                                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 flex items-center space-x-1"
                                  disabled={loading}
                                >
                                  <FaLock className="w-3 h-3" />
                                  <span>Re-block</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEntity(entity.id, entity.entity_type, entity.entity_value)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                                disabled={loading}
                              >
                                <FaTrash className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
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

export default AdminPanelWorkingFull;
