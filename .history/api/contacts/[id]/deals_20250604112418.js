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
      
      const query = `
        SELECT 
          d.*,
          ds.name as stage_name,
          ds.color as stage_color,
          ds.default_probability
        FROM deals d
        LEFT JOIN deal_stages ds ON d.stage_id = ds.id
        WHERE d.primary_contact_id = $1 OR d.id IN (
          SELECT deal_id FROM deal_contacts WHERE contact_id = $1
        )
        ORDER BY d.updated_at DESC
      `;

      const result = await client.query(query, [contactId]);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching contact deals:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 