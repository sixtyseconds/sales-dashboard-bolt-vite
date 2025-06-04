import { getDbClient, handleCORS, apiResponse } from '../_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const dealId = pathParts[pathParts.length - 1];
      const { includeRelationships } = Object.fromEntries(url.searchParams);
      
      let query = `
        SELECT 
          d.*,
          ${includeRelationships === 'true' ? `
            c.name as company_name,
            c.domain as company_domain,
            c.size as company_size,
            c.industry as company_industry,
            ct.full_name as contact_name,
            ct.email as contact_email,
            ct.title as contact_title,
            ds.name as stage_name,
            ds.color as stage_color,
            ds.default_probability as default_probability
          ` : 'null as company_name, null as company_domain, null as contact_name, null as contact_email, null as stage_name, null as stage_color, null as default_probability'}
        FROM deals d
        ${includeRelationships === 'true' ? `
          LEFT JOIN companies c ON d.company_id = c.id
          LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
          LEFT JOIN deal_stages ds ON d.stage_id = ds.id
        ` : ''}
        WHERE d.id = $1
      `;

      const result = await client.query(query, [dealId]);
      
      if (result.rows.length === 0) {
        return apiResponse(null, 'Deal not found', 404);
      }
      
      return apiResponse(result.rows[0]);
    } catch (error) {
      console.error('Error fetching deal:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 