export default async function handler(request) {
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method === 'GET') {
      const testData = {
        status: 'success',
        message: 'API is working correctly',
        timestamp: new Date().toISOString(),
        environment: {
          nodejs: process.version,
          platform: process.platform,
          hasDbUrl: !!process.env.DATABASE_URL,
          vercel: !!process.env.VERCEL,
        }
      };

      console.log('Test endpoint accessed successfully');
      
      return new Response(
        JSON.stringify({
          data: testData,
          error: null,
          count: 1
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: null,
        error: 'Method not allowed',
        count: 0
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in test API:', error);
    return new Response(
      JSON.stringify({
        data: null,
        error: error.message,
        count: 0
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
} 