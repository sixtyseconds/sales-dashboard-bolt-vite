import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const { search, limit } = Object.fromEntries(url.searchParams);
      
      let query = `
        SELECT * FROM companies
      `;
      
      const params = [];
      
      if (search) {
        query += ` WHERE name ILIKE $1 OR domain ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY updated_at DESC`;
      
      if (limit) {
        const limitParam = params.length + 1;
        query += ` LIMIT $${limitParam}`;
        params.push(parseInt(limit));
      }
      
      const result = await executeQuery(query, params);
      return apiResponse(response, result.rows);
    }

    return apiResponse(response, null, 'Method not allowed', 405);
  } catch (error) {
    console.error('Error in companies API:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 