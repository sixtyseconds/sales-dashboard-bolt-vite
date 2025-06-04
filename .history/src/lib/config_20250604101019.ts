// Environment detection and configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API Base URL - automatically switches between development and production
export const API_BASE_URL = isLocalhost 
  ? 'http://localhost:8000/api'  // Local Express server for development
  : '/api';                      // Vercel serverless functions for production

// Database configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isLocalhost,
  isProduction: !isLocalhost,
};

// Helper to log configuration in development
if (isLocalhost) {
  console.log('🔧 Configuration:', {
    hostname: window.location.hostname,
    apiBaseUrl: config.apiBaseUrl,
    isLocalhost: config.isLocalhost,
    isProduction: config.isProduction,
  });
} 