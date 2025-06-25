import { executeQuery, apiResponse } from '../../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 2]; // [id] is second to last before 'activities'
  
  const searchParams = new URLSearchParams(request.url.split('?')[1] || '');
  
  if (request.method === 'GET') {
    return handleGetContactActivities(response, contactId, searchParams);
  } else {
    response.setHeader('Allow', ['GET']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

async function handleGetContactActivities(response, contactId, searchParams) {
  try {
    const limit = parseInt(searchParams.get('limit')) || 10;
    
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

    const result = await executeQuery(query, [contactId, limit]);
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact activities:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 