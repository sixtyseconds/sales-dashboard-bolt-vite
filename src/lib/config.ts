// Environment detection and configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('vercel.app') || !isLocalhost;

// API configuration
const getApiBaseUrl = () => {
  // If environment variable is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production (Vercel), use same domain
  if (isProduction) {
    return `${window.location.origin}/api`;
  }
  
  // In development, use local API server
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Database configuration (using Supabase only)
export const config = {
  isLocalhost,
  isProduction,
  // Add debug mode
  debug: !isProduction,
};

// Helper to log configuration in development
if (config.debug) {
  console.log('🔧 Configuration:', {
    hostname: window.location.hostname,
    isLocalhost: config.isLocalhost,
    isProduction: config.isProduction,
    debug: config.debug,
    apiBaseUrl: API_BASE_URL,
    note: 'Using Supabase for all data operations'
  });
} 