// Environment detection and configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('vercel.app') || !isLocalhost;

// API Base URL - automatically switches between development and production
export const API_BASE_URL = isLocalhost 
  ? 'http://localhost:8000/api'  // Local Express server for development
  : '/api';                      // Vercel serverless functions for production

// Database configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isLocalhost,
  isProduction,
  // Add debug mode
  debug: !isProduction,
};

// Helper to test API connectivity
export async function testApiConnectivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    const data = await response.json();
    console.log('✅ API connectivity test passed:', data);
    return true;
  } catch (error) {
    console.error('❌ API connectivity test failed:', error);
    return false;
  }
}

// Helper to log configuration in development
if (config.debug) {
  console.log('🔧 Configuration:', {
    hostname: window.location.hostname,
    apiBaseUrl: config.apiBaseUrl,
    isLocalhost: config.isLocalhost,
    isProduction: config.isProduction,
    debug: config.debug
  });
  
  // Test API connectivity in development
  testApiConnectivity();
} 