import { executeQuery, apiResponse } from '../../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 2]; // [id] is second to last before 'stats'
  
  if (request.method === 'GET') {
    return handleGetContactStats(response, contactId);
  } else {
    response.setHeader('Allow', ['GET']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

async function handleGetContactStats(response, contactId) {
  try {
    // Get activity counts
    const activitiesQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE type = 'meeting') as meetings,
        COUNT(*) FILTER (WHERE type = 'email') as emails,
        COUNT(*) FILTER (WHERE type = 'call') as calls,
        COUNT(*) as total_activities
      FROM activities 
      WHERE contact_id = $1
    `;

    // Get deal counts and values
    const dealsQuery = `
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE stage IN ('closed_won', 'won')) as won_deals,
        COALESCE(SUM(value), 0) as total_deals_value,
        COALESCE(SUM(value) FILTER (WHERE stage IN ('closed_won', 'won')), 0) as won_deals_value
      FROM deals 
      WHERE contact_id = $1
    `;

    const [activitiesResult, dealsResult] = await Promise.all([
      executeQuery(activitiesQuery, [contactId]),
      executeQuery(dealsQuery, [contactId])
    ]);

    const activities = activitiesResult.rows[0];
    const deals = dealsResult.rows[0];

    // Calculate engagement score (simple algorithm)
    const engagementScore = Math.min(100, Math.round(
      (parseInt(activities.meetings) * 10) +
      (parseInt(activities.emails) * 2) +
      (parseInt(activities.calls) * 5) +
      (parseInt(deals.total_deals) * 15)
    ));

    const stats = {
      meetings: parseInt(activities.meetings) || 0,
      emails: parseInt(activities.emails) || 0,
      calls: parseInt(activities.calls) || 0,
      totalActivities: parseInt(activities.total_activities) || 0,
      totalDeals: parseInt(deals.total_deals) || 0,
      activeDeals: parseInt(deals.total_deals) - parseInt(deals.won_deals) || 0,
      totalDealsValue: parseFloat(deals.total_deals_value) || 0,
      wonDealsValue: parseFloat(deals.won_deals_value) || 0,
      engagementScore: engagementScore
    };

    return apiResponse(response, stats);
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 