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
      
      // Get activity counts
      const activityQuery = `
        SELECT 
          type,
          COUNT(*) as count
        FROM activities 
        WHERE contact_id = $1
        GROUP BY type
      `;
      
      // Get deals data
      const dealsQuery = `
        SELECT 
          COUNT(*) as total_deals,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_deals,
          COALESCE(SUM(value), 0) as total_value
        FROM deals 
        WHERE primary_contact_id = $1 OR id IN (
          SELECT deal_id FROM deal_contacts WHERE contact_id = $1
        )
      `;
      
      const [activityResult, dealsResult] = await Promise.all([
        client.query(activityQuery, [contactId]),
        client.query(dealsQuery, [contactId])
      ]);
      
      // Process activity counts
      const activityCounts = {};
      activityResult.rows.forEach(row => {
        activityCounts[row.type] = parseInt(row.count);
      });
      
      const dealsData = dealsResult.rows[0] || {};
      
      const stats = {
        meetings: activityCounts.meeting || 0,
        emails: activityCounts.email || 0,
        calls: activityCounts.call || 0,
        totalDeals: parseInt(dealsData.total_deals) || 0,
        activeDeals: parseInt(dealsData.active_deals) || 0,
        totalDealsValue: parseFloat(dealsData.total_value) || 0,
        // Calculate engagement score based on activity
        engagementScore: Math.min(100, Math.max(0, 
          (activityCounts.meeting || 0) * 15 + 
          (activityCounts.email || 0) * 5 + 
          (activityCounts.call || 0) * 10
        )),
        recentActivities: activityResult.rows
      };
      
      return apiResponse(stats);
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 