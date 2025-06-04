import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT DISTINCT
          p.id,
          p.first_name,
          p.last_name,
          p.stage,
          p.email,
          (p.first_name || ' ' || p.last_name) as full_name
        FROM profiles p
        WHERE p.id IN (
          SELECT DISTINCT owner_id FROM companies WHERE owner_id IS NOT NULL
          UNION
          SELECT DISTINCT owner_id FROM deals WHERE owner_id IS NOT NULL
          UNION
          SELECT DISTINCT owner_id FROM contacts WHERE owner_id IS NOT NULL
        )
        ORDER BY p.first_name, p.last_name
      `;

      const result = await client.query(query);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching owners:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 