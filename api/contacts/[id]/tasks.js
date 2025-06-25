import { executeQuery, apiResponse } from '../../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 2]; // [id] is second to last before 'tasks'
  
  if (request.method === 'GET') {
    return handleGetContactTasks(response, contactId);
  } else {
    response.setHeader('Allow', ['GET']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

async function handleGetContactTasks(response, contactId) {
  try {
    const query = `
      SELECT 
        a.*,
        c.name as company_name
      FROM activities a
      LEFT JOIN companies c ON a.company_id = c.id
      WHERE a.contact_id = $1 
      AND (a.type = 'task' OR a.due_date IS NOT NULL)
      ORDER BY 
        CASE WHEN a.status = 'pending' THEN 1 ELSE 2 END,
        a.due_date ASC,
        a.created_at DESC
    `;

    const result = await executeQuery(query, [contactId]);
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact tasks:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 