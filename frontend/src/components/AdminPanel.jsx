import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserShield,
  FaChartBar,
  FaTrashAlt,
  FaSyncAlt,
  FaServer,
  FaEye,
  FaTimes
} from 'react-icons/fa';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [securityStats, setSecurityStats] = useState(null);
  const [blockedIPs, setBlockedIPs] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only show admin panel for the specific admin email
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      loadSecurityStats();
    }
  }, [isAdmin]);

  const loadSecurityStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/debug/security-stats');
      if (response.data.success) {
        setSecurityStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedIPs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/debug/blocked-ips');
      if (response.data.success) {
        setBlockedIPs(response.data);
      }
    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
      toast.error('Failed to load blocked IPs');
    } finally {
      setLoading(false);
    }
  };

  const clearAllBlockedIPs = async () => {
    if (!window.confirm('Are you sure you want to unblock all IPs? This will clear all security tracking.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/debug/unblock-all-ips');
      if (response.data.success) {
        toast.success('All blocked IPs cleared successfully!');
        await loadSecurityStats();
        await loadBlockedIPs();
      }
    } catch (error) {
      console.error('Failed to clear blocked IPs:', error);
      toast.error('Failed to clear blocked IPs');
    } finally {
      setLoading(false);
    }
  };

  const clearSpecificIP = async (ip) => {
    if (!window.confirm(`Clear blocked status for IP: ${ip}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/debug/clear-blocked-ip', { ip });
      if (response.data.success) {
        toast.success(`Cleared IP: ${ip}`);
        await loadSecurityStats();
        await loadBlockedIPs();
      }
    } catch (error) {
      console.error('Failed to clear specific IP:', error);
      toast.error('Failed to clear IP');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin
  }

  return (
    <>
      {/* Floating Admin Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Admin Panel"
      >
        <FaUserShield className="w-5 h-5" />
      </button>

      {/* Admin Panel Modal */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={loadSecurityStats}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FaSyncAlt className="w-4 h-4" />
                  <span>Refresh Stats</span>
                </button>
                
                <button
                  onClick={loadBlockedIPs}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 p-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FaEye className="w-4 h-4" />
                  <span>View Blocked IPs</span>
                </button>
                
                <button
                  onClick={clearAllBlockedIPs}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FaTrashAlt className="w-4 h-4" />
                  <span>Clear All IPs</span>
                </button>
                
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
                  <FaServer className="w-4 h-4" />
                  <span>System OK</span>
                </div>
              </div>

              {/* Security Stats */}
              {securityStats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaChartBar className="w-5 h-5 mr-2 text-blue-600" />
                    Security Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-blue-600">{securityStats.activeRateLimits || 0}</div>
                      <div className="text-sm text-gray-600">Rate Limits</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-green-600">{securityStats.trackedIPs || 0}</div>
                      <div className="text-sm text-gray-600">Tracked IPs</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-yellow-600">{securityStats.trackedEmails || 0}</div>
                      <div className="text-sm text-gray-600">Tracked Emails</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-red-600">{securityStats.suspiciousIPs || 0}</div>
                      <div className="text-sm text-gray-600">Blocked IPs</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked IPs */}
              {blockedIPs && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-600" />
                    Blocked IPs ({blockedIPs.totalBlockedIPs})
                  </h3>
                  
                  {blockedIPs.totalBlockedIPs === 0 ? (
                    <div className="text-green-700 bg-green-100 p-3 rounded border border-green-200">
                      ✅ No IPs are currently blocked - System is clean!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(blockedIPs.stats?.suspiciousIPs || {}).map(([ip, data], index) => (
                        <div key={index} className="bg-white p-3 rounded border border-red-200 flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm font-semibold text-red-900">{ip}</div>
                            <div className="text-xs text-gray-600">
                              Reason: {data.reason || 'Unknown'} • 
                              Blocked: {new Date(data.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => clearSpecificIP(ip)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-gray-600">Loading...</span>
                  </div>
                </div>
              )}

              {/* Admin Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700">
                  <strong>Admin Access:</strong> {user?.email}<br/>
                  <strong>Last Updated:</strong> {new Date().toLocaleString()}<br/>
                  <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;
