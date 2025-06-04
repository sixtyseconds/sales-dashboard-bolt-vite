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
      
      // For now, we'll create simple tasks based on activities and deals
      const tasksQuery = `
        SELECT 
          'activity' as source,
          a.id::text as id,
          a.type || ' follow-up' as title,
          'Follow up on ' || a.type || ' activity' as description,
          'medium' as priority,
          a.created_at + INTERVAL '3 days' as due_date,
          false as completed
        FROM activities a 
        WHERE a.contact_id = $1
        AND a.created_at > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        SELECT 
          'deal' as source,
          d.id::text as id,
          'Follow up on deal' as title,
          'Check progress on deal worth £' || COALESCE(d.value::text, 'unknown') as description,
          CASE 
            WHEN d.value > 10000 THEN 'high'
            WHEN d.value > 5000 THEN 'medium'
            ELSE 'low'
          END as priority,
          d.updated_at + INTERVAL '7 days' as due_date,
          CASE WHEN d.status = 'won' THEN true ELSE false END as completed
        FROM deals d 
        WHERE (d.primary_contact_id = $1 OR d.id IN (
          SELECT deal_id FROM deal_contacts WHERE contact_id = $1
        ))
        AND d.status != 'lost'
        
        ORDER BY due_date DESC
        LIMIT 10
      `;

      const result = await client.query(tasksQuery, [contactId]);
      
      return apiResponse(result.rows);
    } catch (error) {
      console.error('Error fetching contact tasks:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 