// Environment configuration for frontend
const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 
          (import.meta.env.NODE_ENV === 'production' 
            ? 'https://gbpant-alumni-portal.onrender.com'  // Fallback
            : 'http://localhost:5000'),
  
  // App Configuration
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'GB Pant College Alumni Portal',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Timeout Configuration
  API_TIMEOUT: 10000,
  
  // Debug mode
  DEBUG: import.meta.env.NODE_ENV === 'development',
};

// Ensure API URL has protocol
if (config.API_URL && !config.API_URL.startsWith('http')) {
  config.API_URL = `https://${config.API_URL}`;
}

// Log configuration in development
if (config.DEBUG) {
  console.log('🔧 Frontend Configuration:', {
    API_URL: config.API_URL,
    APP_TITLE: config.APP_TITLE,
    NODE_ENV: config.NODE_ENV,
  });
}

export default config;