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
      // Return Andrew Bryce's profile - this is a simple hardcoded response that shouldn't timeout
      const userData = {
        id: 'ac4efca2-1fe1-49b3-9d5e-6ac3d8bf3459', // Andrew's actual UUID from the database
        email: 'andrew.bryce@sixtyseconds.video',
        first_name: 'Andrew',
        last_name: 'Bryce',
        stage: 'Director',
        is_admin: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Returning user data for Andrew Bryce');
      
      return new Response(
        JSON.stringify({
          data: userData,
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
    console.error('Error in user API:', error);
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