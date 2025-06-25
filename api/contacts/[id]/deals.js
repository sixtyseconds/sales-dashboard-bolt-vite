import { executeQuery, apiResponse } from '../../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 2]; // [id] is second to last before 'deals'
  
  if (request.method === 'GET') {
    return handleGetContactDeals(response, contactId);
  } else {
    response.setHeader('Allow', ['GET']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

async function handleGetContactDeals(response, contactId) {
  try {
    const query = `
      SELECT 
        d.*,
        ds.name as stage_name,
        ds.color as stage_color,
        c.name as company_name
      FROM deals d
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.contact_id = $1
      ORDER BY d.updated_at DESC
    `;

    const result = await executeQuery(query, [contactId]);
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact deals:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 