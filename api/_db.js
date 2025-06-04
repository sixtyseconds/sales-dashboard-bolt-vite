import pkg from 'pg';

const { Client } = pkg;

// Create a connection pool for better performance
let client = null;

export async function getDbClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await client.connect();
      console.log('🔗 Connected to Neon database');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      client = null;
      throw error;
    }
  }
  
  return client;
}

// Helper function to handle API responses
export function apiResponse(data, error = null, status = 200) {
  return new Response(
    JSON.stringify({
      data,
      error: error?.message || error,
      count: Array.isArray(data) ? data.length : (data ? 1 : 0)
    }),
    {
      status: error ? 500 : status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

// Handle CORS preflight requests
export function handleCORS(request) {
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
  return null;
} 