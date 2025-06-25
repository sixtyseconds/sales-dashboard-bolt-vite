import { executeQuery, apiResponse } from '../../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 2]; // [id] is second to last before 'owner'
  
  if (request.method === 'GET') {
    return handleGetContactOwner(response, contactId);
  } else {
    response.setHeader('Allow', ['GET']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

async function handleGetContactOwner(response, contactId) {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.title,
        ct.created_at as assigned_date
      FROM contacts ct
      LEFT JOIN users u ON ct.owner_id = u.id
      WHERE ct.id = $1
    `;

    const result = await executeQuery(query, [contactId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact not found', 404);
    }

    const owner = result.rows[0];
    
    // If no owner assigned, return default info
    if (!owner.id) {
      return apiResponse(response, {
        name: 'Unassigned',
        title: 'No Sales Rep',
        email: 'Not assigned',
        assigned_date: owner.assigned_date
      });
    }

    return apiResponse(response, owner);
  } catch (error) {
    console.error('Error fetching contact owner:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 