import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      await client.query('SELECT 1');
      
      return apiResponse({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      return apiResponse({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 