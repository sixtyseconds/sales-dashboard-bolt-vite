import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT 
          id,
          name,
          color,
          default_probability,
          created_at,
          updated_at
        FROM deal_stages
        ORDER BY name ASC
      `;

      const result = await client.query(query);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching deal stages:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 