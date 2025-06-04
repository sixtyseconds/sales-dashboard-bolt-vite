import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const { search, companyId, includeCompany, limit, ownerId } = Object.fromEntries(url.searchParams);
      
      let query = `
        SELECT 
          ct.*,
          ${includeCompany === 'true' ? `
            c.id as company_id,
            c.name as company_name,
            c.domain as company_domain,
            c.size as company_size,
            c.industry as company_industry,
            c.website as company_website
          ` : 'null as company_id, null as company_name, null as company_domain, null as company_size, null as company_industry, null as company_website'}
        FROM contacts ct
        ${includeCompany === 'true' ? 'LEFT JOIN companies c ON ct.company_id = c.id' : ''}
      `;
      
      const params = [];
      const conditions = [];
      
      if (search) {
        conditions.push(`(ct.first_name ILIKE $${params.length + 1} OR ct.last_name ILIKE $${params.length + 1} OR ct.full_name ILIKE $${params.length + 1} OR ct.email ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (companyId) {
        conditions.push(`ct.company_id = $${params.length + 1}`);
        params.push(companyId);
      }
      
      if (ownerId) {
        conditions.push(`ct.owner_id = $${params.length + 1}`);
        params.push(ownerId);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY ct.updated_at DESC`;
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));
      }

      const result = await client.query(query, params);
      
      const data = result.rows.map(row => ({
        ...row,
        // Company relationship if included
        companies: (includeCompany === 'true' && row.company_id) ? {
          id: row.company_id,
          name: row.company_name,
          domain: row.company_domain,
          size: row.company_size,
          industry: row.company_industry,
          website: row.company_website
        } : null
      }));

      return apiResponse(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 