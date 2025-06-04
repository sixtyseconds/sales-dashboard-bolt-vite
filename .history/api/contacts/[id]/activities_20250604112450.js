import { getDbClient, handleCORS, apiResponse } from '../../_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const contactId = pathParts[pathParts.indexOf('contacts') + 1];
      const { limit = '10' } = Object.fromEntries(url.searchParams);
      
      const query = `
        SELECT 
          a.*,
          c.name as company_name
        FROM activities a
        LEFT JOIN companies c ON a.company_id = c.id
        WHERE a.contact_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2
      `;

      const result = await client.query(query, [contactId, parseInt(limit)]);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching contact activities:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 