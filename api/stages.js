import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  try {
    if (request.method === 'GET') {
      // GET /api/stages - List all deal stages
      const query = `
        SELECT * FROM deal_stages 
        ORDER BY position ASC, created_at ASC
      `;
      
      const result = await executeQuery(query);
      return apiResponse(response, result.rows);
    }

    return apiResponse(response, null, 'Method not allowed', 405);
  } catch (error) {
    console.error('Error in stages API:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 