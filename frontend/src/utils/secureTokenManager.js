/**
 * Secure Token Manager for Frontend
 * Provides secure token storage and management
 */

class SecureTokenManager {
  constructor() {
    this.tokenKey = 'gbpant_auth_token';
    this.refreshKey = 'gbpant_refresh_token';
    this.expiryKey = 'gbpant_token_expiry';
    
    // Check if we're in a secure context
    this.isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }

  /**
   * Store token securely
   */
  setToken(token, expiresIn = '24h') {
    try {
      const expiryTime = this.calculateExpiry(expiresIn);
      
      if (this.isSecure && 'sessionStorage' in window) {
        // Use sessionStorage for better security (cleared when browser closes)
        sessionStorage.setItem(this.tokenKey, token);
        sessionStorage.setItem(this.expiryKey, expiryTime.toString());
        
        // Clear any existing localStorage tokens
        this.clearLegacyTokens();
      } else {
        // Fallback to localStorage with expiry check
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.expiryKey, expiryTime.toString());
      }
      
      // Set up automatic cleanup
      this.scheduleTokenCleanup(expiryTime);
      
      return true;
    } catch (error) {
      console.error('Failed to store token securely:', error);
      return false;
    }
  }

  /**
   * Get token if valid
   */
  getToken() {
    try {
      let token, expiry;
      
      if (this.isSecure && 'sessionStorage' in window) {
        token = sessionStorage.getItem(this.tokenKey);
        expiry = sessionStorage.getItem(this.expiryKey);
      } else {
        token = localStorage.getItem(this.tokenKey);
        expiry = localStorage.getItem(this.expiryKey);
      }
      
      if (!token || !expiry) {
        return null;
      }
      
      // Check if token is expired
      if (Date.now() > parseInt(expiry)) {
        this.clearToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Clear token
   */
  clearToken() {
    try {
      if (this.isSecure && 'sessionStorage' in window) {
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.expiryKey);
        sessionStorage.removeItem(this.refreshKey);
      }
      
      // Also clear from localStorage for legacy cleanup
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.expiryKey);
      localStorage.removeItem('token'); // Legacy key
      
      this.clearLegacyTokens();
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Check if token exists and is valid
   */
  isAuthenticated() {
    return this.getToken() !== null;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry() {
    try {
      let expiry;
      
      if (this.isSecure && 'sessionStorage' in window) {
        expiry = sessionStorage.getItem(this.expiryKey);
      } else {
        expiry = localStorage.getItem(this.expiryKey);
      }
      
      if (!expiry) return 0;
      
      const timeLeft = parseInt(expiry) - Date.now();
      return Math.max(0, timeLeft);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Auto-refresh token before expiry
   */
  scheduleTokenRefresh(refreshCallback, refreshThreshold = 5 * 60 * 1000) { // 5 minutes
    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    if (timeUntilExpiry > refreshThreshold) {
      const refreshTime = timeUntilExpiry - refreshThreshold;
      
      setTimeout(async () => {
        try {
          if (this.isAuthenticated() && typeof refreshCallback === 'function') {
            const newToken = await refreshCallback();
            if (newToken) {
              this.setToken(newToken);
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.clearToken();
        }
      }, refreshTime);
    }
  }

  /**
   * Calculate token expiry time
   */
  calculateExpiry(expiresIn) {
    const now = Date.now();
    
    if (typeof expiresIn === 'string') {
      const value = parseInt(expiresIn);
      const unit = expiresIn.replace(value.toString(), '').toLowerCase();
      
      switch (unit) {
        case 'h': return now + (value * 60 * 60 * 1000);
        case 'm': return now + (value * 60 * 1000);
        case 's': return now + (value * 1000);
        case 'd': return now + (value * 24 * 60 * 60 * 1000);
        default: return now + (24 * 60 * 60 * 1000); // Default 24h
      }
    }
    
    return now + (24 * 60 * 60 * 1000); // Default 24h
  }

  /**
   * Schedule automatic token cleanup
   */
  scheduleTokenCleanup(expiryTime) {
    const cleanupTime = expiryTime - Date.now() + 1000; // 1 second after expiry
    
    if (cleanupTime > 0) {
      setTimeout(() => {
        this.clearToken();
      }, cleanupTime);
    }
  }

  /**
   * Clear legacy tokens that might be insecure
   */
  clearLegacyTokens() {
    const legacyKeys = [
      'token',
      'signup_sessionId',
      'login_sessionId',
      'password_sessionId',
      'signup_email',
      'login_email',
      'signup_name',
      'signup_userType',
      'user_type',
      'userFullName',
      'userEmail'
    ];
    
    legacyKeys.forEach(key => {
      localStorage.removeItem(key);
      if ('sessionStorage' in window) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Secure session data management
   */
  setSessionData(key, value, temporary = true) {
    try {
      const storage = temporary && this.isSecure ? sessionStorage : localStorage;
      storage.setItem(`gbpant_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  getSessionData(key, temporary = true) {
    try {
      const storage = temporary && this.isSecure ? sessionStorage : localStorage;
      const value = storage.getItem(`gbpant_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return null;
    }
  }

  clearSessionData(key = null, temporary = true) {
    try {
      const storage = temporary && this.isSecure ? sessionStorage : localStorage;
      
      if (key) {
        storage.removeItem(`gbpant_${key}`);
      } else {
        // Clear all gbpant-related data
        const keys = Object.keys(storage);
        keys.forEach(k => {
          if (k.startsWith('gbpant_')) {
            storage.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * Logout and clear all data
   */
  logout() {
    this.clearToken();
    this.clearSessionData();
    this.clearLegacyTokens();
    
    // Dispatch logout event for other components
    if ('CustomEvent' in window) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Validate token format before sending
   */
  validateTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Validate JWT structure
      JSON.parse(atob(parts[0]));
      JSON.parse(atob(parts[1]));
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const tokenManager = new SecureTokenManager();

/**
 * React Hook for secure token management
 */
export function useSecureAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(tokenManager.isAuthenticated());
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(tokenManager.getTimeUntilExpiry());

  useEffect(() => {
    // Update authentication status
    const updateAuth = () => {
      setIsAuthenticated(tokenManager.isAuthenticated());
      setTimeUntilExpiry(tokenManager.getTimeUntilExpiry());
    };

    // Listen for logout events
    const handleLogout = () => {
      setIsAuthenticated(false);
      setTimeUntilExpiry(0);
    };

    window.addEventListener('auth:logout', handleLogout);
    
    // Update every minute
    const interval = setInterval(updateAuth, 60000);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(interval);
    };
  }, []);

  const login = (token, expiresIn) => {
    if (tokenManager.setToken(token, expiresIn)) {
      setIsAuthenticated(true);
      setTimeUntilExpiry(tokenManager.getTimeUntilExpiry());
      return true;
    }
    return false;
  };

  const logout = () => {
    tokenManager.logout();
    setIsAuthenticated(false);
    setTimeUntilExpiry(0);
  };

  const getToken = () => tokenManager.getToken();
  const getAuthHeader = () => tokenManager.getAuthHeader();

  return {
    isAuthenticated,
    timeUntilExpiry,
    login,
    logout,
    getToken,
    getAuthHeader,
    setSessionData: (key, value) => tokenManager.setSessionData(key, value),
    getSessionData: (key) => tokenManager.getSessionData(key),
    clearSessionData: (key) => tokenManager.clearSessionData(key)
  };
}

export default tokenManager;
