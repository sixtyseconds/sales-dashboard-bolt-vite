// Environment detection and configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('vercel.app') || !isLocalhost;

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
    note: 'Using Supabase for all data operations'
  });
} 