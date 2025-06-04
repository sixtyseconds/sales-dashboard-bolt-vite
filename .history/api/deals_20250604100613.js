import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const { includeRelationships, limit, ownerId } = Object.fromEntries(url.searchParams);
      
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
            ds.default_probability as stage_probability
          ` : 'null as company_name, null as company_domain, null as contact_name, null as contact_email'}
        FROM deals d
        ${includeRelationships === 'true' ? `
          LEFT JOIN companies c ON d.company_id = c.id
          LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
          LEFT JOIN deal_stages ds ON d.stage_id = ds.id
        ` : ''}
      `;
      
      const params = [];
      const conditions = [];
      
      if (ownerId) {
        conditions.push(`d.owner_id = $${params.length + 1}`);
        params.push(ownerId);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY d.updated_at DESC`;
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));
      }

      const result = await client.query(query, params);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching deals:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 