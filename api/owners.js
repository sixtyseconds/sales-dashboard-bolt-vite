import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          stage,
          created_at,
          updated_at
        FROM users
        ORDER BY first_name ASC, last_name ASC
      `;

      const result = await executeQuery(query);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 