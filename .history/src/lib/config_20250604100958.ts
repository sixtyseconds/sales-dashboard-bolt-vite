// Environment detection and configuration
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// API Base URL - automatically switches between development and production
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000/api'  // Local Express server for development
  : '/api';                      // Vercel serverless functions for production

// Database configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isProduction,
  isDevelopment,
  environment: import.meta.env.MODE,
};

// Helper to log configuration in development
if (isDevelopment) {
  console.log('🔧 Configuration:', {
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
  });
} 