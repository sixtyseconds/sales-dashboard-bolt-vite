import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    const startTime = Date.now();
    
    // Basic health without database first
    const basicHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: {
        version: '1.0.0',
        uptime: process.uptime() + 's',
        platform: process.platform,
        nodejs: process.version
      },
      environment: {
        hasDbUrl: !!process.env.DATABASE_URL,
        isVercel: !!process.env.VERCEL,
        dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      }
    };

    try {
      // Test database connectivity with a timeout
      console.log('Testing database connectivity...');
      
      const dbPromise = executeQuery('SELECT 1 as test, NOW() as db_time');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 20000)
      );

      const dbResult = await Promise.race([dbPromise, timeoutPromise]);
      const dbTime = Date.now() - startTime;
      
      const healthData = {
        ...basicHealth,
        database: {
          connected: true,
          responseTime: dbTime + 'ms',
          serverTime: dbResult.rows[0]?.db_time
        }
      };

      console.log('Health check passed with database');
      return apiResponse(response, healthData);
      
    } catch (error) {
      console.error('Health check database test failed:', error);
      
      const healthData = {
        ...basicHealth,
        status: 'degraded',
        database: {
          connected: false,
          error: error.message,
          responseTime: (Date.now() - startTime) + 'ms'
        }
      };
      
      // Return 200 but with degraded status if only DB fails
      return apiResponse(response, healthData, null, 200);
    }
  }

  return apiResponse(response, null, 'Method not allowed', 405);
} 