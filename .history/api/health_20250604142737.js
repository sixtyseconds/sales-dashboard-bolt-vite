import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      // Test basic API health
      const startTime = Date.now();
      
      // Test database connectivity with a simple query
      const dbResult = await executeQuery('SELECT 1 as test');
      const dbTime = Date.now() - startTime;
      
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          responseTime: dbTime + 'ms'
        },
        api: {
          version: '1.0.0',
          uptime: process.uptime() + 's'
        }
      };

      return apiResponse(healthData);
    } catch (error) {
      console.error('Health check failed:', error);
      
      const healthData = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message
        },
        api: {
          version: '1.0.0',
          uptime: process.uptime() + 's'
        }
      };
      
      return apiResponse(healthData, null, 503);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 