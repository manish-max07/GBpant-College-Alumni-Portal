import React, { useState, useEffect, useCallback } from 'react';
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
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaLinkedin,
  FaUserCheck,
  FaUserTimes,
  FaClock
} from 'react-icons/fa';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const AdminPanelWorkingFull = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('security');

  // Security tab state
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

  // Pending approvals tab state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Delete account tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, full_name, email, user_type }
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  console.log('🔧 AdminPanel Debug:', {
    user: user?.email,
    isAdmin,
    isVisible,
    activeTab
  });

  // ─── Load data when panel opens ───────────────────────────────────────────
  useEffect(() => {
    if (isAdmin && isVisible) {
      if (activeTab === 'security') {
        loadBlockedEntities();
        loadBlockingStats();
      } else if (activeTab === 'pending') {
        loadPendingUsers();
      }
    }
  }, [isAdmin, isVisible, activeTab]);

  // ─── Security Tab Functions ────────────────────────────────────────────────
  const loadBlockedEntities = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.get('/api/admin/blocked-entities');
      if (response.data.success) {
        setBlockedEntities(response.data.data || []);
        toast.success(`Loaded ${response.data.data?.length || 0} blocked entities`);
      } else {
        setBlockedEntities([]);
      }
    } catch (error) {
      console.error('❌ Failed to load blocked entities:', error);
      if (error.response?.status === 401) toast.error('Authentication required');
      else if (error.response?.status === 403) toast.error('Admin access required');
      else toast.error('Failed to load blocked entities');
      setBlockedEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockingStats = async () => {
    try {
      const response = await api.get('/api/admin/blocked-entities/stats');
      if (response.data.success) {
        setBlockingStats(response.data.data);
      } else {
        setBlockingStats(null);
      }
    } catch (error) {
      console.error('❌ Failed to load blocking stats:', error);
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
      const response = await api.post('/api/admin/blocked-entities', {
        entity_type: newBlock.entityType,
        entity_value: newBlock.entityValue.trim(),
        duration_hours: newBlock.duration === 'permanent' ? null : parseInt(newBlock.duration),
        reason: newBlock.reason || 'Added by admin'
      });
      if (response.data.success) {
        toast.success(`${newBlock.entityType.toUpperCase()} blocked successfully!`);
        setNewBlock({ entityType: 'ip', entityValue: '', duration: '24', reason: '' });
        setShowAddForm(false);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      console.error('❌ Failed to add blocked entity:', error);
      if (error.response?.status === 409) toast.error('This entity is already blocked');
      else toast.error('Failed to add blocked entity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (entityId, entityType, entityValue) => {
    if (!window.confirm(`Are you sure you want to unblock this ${entityType}: ${entityValue}?`)) return;
    setLoading(true);
    try {
      const response = await api.put(`/api/admin/blocked-entities/${entityId}`, {
        action: 'unblock',
        reason: 'Unblocked by admin'
      });
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} unblocked successfully!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      toast.error('Failed to unblock entity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReblock = async (entityId, entityType, entityValue, originalReason) => {
    if (!window.confirm(`Are you sure you want to re-block this ${entityType}: ${entityValue}?`)) return;
    setLoading(true);
    try {
      const response = await api.put(`/api/admin/blocked-entities/${entityId}`, {
        action: 'extend',
        duration_hours: 24,
        reason: originalReason || 'Re-blocked by admin'
      });
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} re-blocked successfully for 24 hours!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
      toast.error('Failed to re-block entity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async (entityId, entityType, entityValue) => {
    if (!window.confirm(`Are you sure you want to permanently DELETE this ${entityType}: ${entityValue}?\n\nThis action cannot be undone!`)) return;
    setLoading(true);
    try {
      const response = await api.delete(`/api/admin/blocked-entities/${entityId}`);
      if (response.data.success) {
        toast.success(`${entityType.toUpperCase()} permanently deleted!`);
        await loadBlockedEntities();
        await loadBlockingStats();
      }
    } catch (error) {
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

  // ─── Pending Approvals Tab Functions ──────────────────────────────────────
  const loadPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const response = await api.get('/api/admin/pending-users');
      if (response.data.success) {
        setPendingUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('❌ Failed to load pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApproveUser = async (userId, userEmail) => {
    setApprovingId(userId);
    try {
      const response = await api.put(`/api/admin/approve-user/${userId}`);
      if (response.data.success) {
        toast.success(`✅ ${userEmail} approved! Approval email sent.`);
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      toast.error('Failed to approve user: ' + (error.response?.data?.message || error.message));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to REJECT and delete the account for:\n${userEmail}\n\nThis cannot be undone.`)) return;
    setRejectingId(userId);
    try {
      const response = await api.put(`/api/admin/reject-user/${userId}`);
      if (response.data.success) {
        toast.success(`🗑️ ${userEmail} rejected and deleted.`);
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      toast.error('Failed to reject user: ' + (error.response?.data?.message || error.message));
    } finally {
      setRejectingId(null);
    }
  };

  // ─── Delete Account Tab Functions ─────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Enter at least 2 characters to search');
      return;
    }
    setSearchLoading(true);
    try {
      const response = await api.get(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (response.data.success) {
        setSearchResults(response.data.users || []);
        if (response.data.users.length === 0) toast('No users found', { icon: 'ℹ️' });
      }
    } catch (error) {
      toast.error('Search failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      const response = await api.delete(`/api/admin/users/${deleteModal.id}`);
      if (response.data.success) {
        toast.success(`🗑️ "${deleteModal.full_name}" deleted permanently.`);
        setSearchResults((prev) => prev.filter((u) => u.id !== deleteModal.id));
        setDeleteModal(null);
      }
    } catch (error) {
      toast.error('Delete failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Render guard ──────────────────────────────────────────────────────────
  if (!isAdmin) return null;

  // ─── Tab Navigation ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'pending', label: '⏳ Pending Approvals', badge: pendingUsers.length || null },
    { id: 'delete', label: '🔍 Delete Account', badge: null },
    { id: 'security', label: '🛡️ Security & IP Blocking', badge: null }
  ];

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
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <FaShieldAlt className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Admin Panel</h2>
                  <span className="bg-red-800 px-2 py-1 rounded text-xs">ADMIN ONLY</span>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-red-200 hover:text-white transition-colors p-2"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 flex-shrink-0 bg-white">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* ═══ PENDING APPROVALS TAB ══════════════════════════════════ */}
                {activeTab === 'pending' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Pending Approvals
                        <span className="ml-2 text-sm text-gray-500">({pendingUsers.length})</span>
                      </h3>
                      <button
                        onClick={loadPendingUsers}
                        disabled={pendingLoading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        <FaSyncAlt className={pendingLoading ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </div>

                    {pendingLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <FaSyncAlt className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-3" />
                          <p className="text-gray-500">Loading pending users...</p>
                        </div>
                      </div>
                    ) : pendingUsers.length === 0 ? (
                      <div className="py-16 text-center">
                        <FaCheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                        <p className="text-gray-600 font-medium">No pending approvals!</p>
                        <p className="text-gray-400 text-sm mt-1">All accounts have been reviewed.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingUsers.map((u) => (
                          <div
                            key={u.id}
                            className="border border-amber-200 rounded-xl p-4 bg-amber-50 hover:bg-amber-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <h4 className="font-semibold text-gray-900">{u.full_name || 'No Name'}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    u.user_type === 'alumni'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {u.user_type?.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  <FaEnvelope className="inline mr-1.5 text-gray-400" />
                                  {u.email}
                                </p>
                                {u.mobile && (
                                  <p className="text-sm text-gray-500 mb-1">📱 {u.mobile}</p>
                                )}
                                {u.roll_no && (
                                  <p className="text-sm text-gray-500 mb-1">🎓 Roll No: {u.roll_no}</p>
                                )}
                                {u.user_type === 'alumni' && u.passing_year && (
                                  <p className="text-sm text-gray-500 mb-1">
                                    📅 Passing Year: {u.passing_year} • {u.alumni_branch} ({u.alumni_program})
                                  </p>
                                )}
                                {u.user_type === 'student' && u.current_year && (
                                  <p className="text-sm text-gray-500 mb-1">
                                    📚 Year {u.current_year} • {u.student_branch} ({u.student_program})
                                  </p>
                                )}
                                {u.linkedin_profile && (
                                  <a
                                    href={u.linkedin_profile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                  >
                                    <FaLinkedin className="w-4 h-4" />
                                    LinkedIn Profile
                                  </a>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  <FaClock className="inline mr-1" />
                                  Registered: {new Date(u.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleApproveUser(u.id, u.email)}
                                  disabled={approvingId === u.id || rejectingId === u.id}
                                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                >
                                  {approvingId === u.id ? (
                                    <FaSyncAlt className="animate-spin w-3 h-3" />
                                  ) : (
                                    <FaUserCheck className="w-3 h-3" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(u.id, u.email)}
                                  disabled={approvingId === u.id || rejectingId === u.id}
                                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                >
                                  {rejectingId === u.id ? (
                                    <FaSyncAlt className="animate-spin w-3 h-3" />
                                  ) : (
                                    <FaUserTimes className="w-3 h-3" />
                                  )}
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ DELETE ACCOUNT TAB ═════════════════════════════════════ */}
                {activeTab === 'delete' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800">Delete User Account</h3>

                    {/* Search bar */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Search by name, email, mobile, roll no..."
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                      >
                        {searchLoading ? <FaSyncAlt className="animate-spin w-4 h-4" /> : <FaSearch className="w-4 h-4" />}
                        Search
                      </button>
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</p>
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            className="border border-gray-200 rounded-xl p-4 hover:border-red-200 hover:bg-red-50 transition-all"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-semibold text-gray-900">{u.full_name || '(No name)'}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    u.user_type === 'alumni'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {u.user_type?.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    u.is_approved
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {u.is_approved ? '✅ Approved' : '⏳ Pending'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{u.email}</p>
                                {u.roll_no && <p className="text-sm text-gray-500">Roll No: {u.roll_no}</p>}
                                {u.mobile && <p className="text-sm text-gray-500">📱 {u.mobile}</p>}
                              </div>
                              <button
                                onClick={() => setDeleteModal({
                                  id: u.id,
                                  full_name: u.full_name,
                                  email: u.email,
                                  user_type: u.user_type
                                })}
                                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                              >
                                <FaTrash className="w-3 h-3" />
                                Delete Account
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.length === 0 && !searchLoading && searchQuery && (
                      <div className="py-10 text-center text-gray-400">
                        <FaSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No results found. Try a different search term.</p>
                      </div>
                    )}

                    {!searchQuery && (
                      <div className="py-10 text-center text-gray-400">
                        <FaSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Search for a user to manage their account</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ SECURITY & IP BLOCKING TAB ═════════════════════════════ */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
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
                        onClick={() => { loadBlockedEntities(); loadBlockingStats(); }}
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Value *</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
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
                                  <div className="flex-shrink-0">{getEntityIcon(entity.entity_type)}</div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                                      <span>{entity.entity_value}</span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {entity.entity_type.toUpperCase()}
                                      </span>
                                      {entity.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">ACTIVE</span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">EXPIRED</span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Blocked: {formatDate(entity.blocked_at)}
                                      {entity.blocked_until && <span> • Expires: {formatDate(entity.blocked_until)}</span>}
                                      {entity.is_permanent && <span> • Permanent</span>}
                                    </p>
                                    {entity.reason && <p className="text-sm text-gray-600 italic">Reason: {entity.reason}</p>}
                                    <p className="text-xs text-gray-400">Blocked by: {entity.blocked_by}</p>
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
                )}

              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ════════════════════════════════════════ */}
      {deleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[10000] p-4"
          style={{ zIndex: 10000 }}
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-60"
            onClick={() => !isDeleting && setDeleteModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
              <FaTrash className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Delete Account Permanently</h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              This action <strong>cannot be undone</strong>. All data will be permanently deleted.
            </p>

            {/* User details */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-500 uppercase text-xs mr-2">Name</span>
                {deleteModal.full_name || '(No name)'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-500 uppercase text-xs mr-2">Email</span>
                {deleteModal.email}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-500 uppercase text-xs mr-2">Type</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  deleteModal.user_type === 'alumni'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {deleteModal.user_type?.toUpperCase()}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <FaSyncAlt className="animate-spin w-4 h-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="w-4 h-4" />
                    🗑️ Delete Account Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanelWorkingFull;
