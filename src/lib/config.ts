// Environment detection and configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('vercel.app') || !isLocalhost;

// API configuration - Use local server for development, Supabase for production
const getApiBaseUrl = () => {
  // If environment variable is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // For localhost development, always use the local API server
  if (isLocalhost) {
    return 'http://localhost:8000/api';
  }
  
  // Use Vercel API routes for production
  if (isProduction) {
    return '/api';
  }
  
  // Fallback to localhost for development if Supabase URL not set
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
    note: config.isLocalhost ? 'Using local API server' : 'Using Supabase Edge Functions for API calls'
  });
} 