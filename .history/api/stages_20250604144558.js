import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
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

      const result = await executeQuery(query);
      
      return apiResponse(response, result.rows);
    } catch (error) {
      console.error('Error fetching deal stages:', error);
      return apiResponse(response, null, error.message, 500);
    }
  }

  return apiResponse(response, null, 'Method not allowed', 405);
} 