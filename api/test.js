export default function handler(request, response) {
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response.status(200).end();
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
      
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response.status(200).json({
        data: testData,
        error: null,
        count: 1
      });
    }

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    
    return response.status(405).json({
      data: null,
      error: 'Method not allowed',
      count: 0
    });
  } catch (error) {
    console.error('Error in test API:', error);
    
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    
    return response.status(500).json({
      data: null,
      error: error.message,
      count: 0
    });
  }
} 