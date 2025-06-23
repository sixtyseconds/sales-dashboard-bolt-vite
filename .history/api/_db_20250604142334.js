import pkg from 'pg';

const { Client } = pkg;

// Create a new connection for each request (better for serverless)
export async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Add connection timeout settings
    connectionTimeoutMillis: 5000, // 5 seconds
    query_timeout: 10000, // 10 seconds
    statement_timeout: 10000, // 10 seconds
    idle_in_transaction_session_timeout: 10000 // 10 seconds
  });
  
  try {
    await client.connect();
    console.log('🔗 Connected to Neon database');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Helper function to execute queries with proper cleanup
export async function executeQuery(query, params = []) {
  const client = await getDbClient();
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // Always close the connection
    await client.end();
  }
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