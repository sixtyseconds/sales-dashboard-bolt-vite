import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/api/contacts').filter(p => p);
      
      // Handle different contact endpoints
      if (pathParts.length === 0) {
        // GET /api/contacts - List all contacts
        return await handleContactsList(client, url);
      } else if (pathParts.length === 1) {
        // GET /api/contacts/:id - Single contact
        const contactId = pathParts[0].replace('/', '');
        return await handleSingleContact(client, url, contactId);
      } else if (pathParts.length === 2) {
        // GET /api/contacts/:id/deals, /api/contacts/:id/activities, etc.
        const [contactId, resource] = pathParts[0].replace('/', '').split('/');
        const subResource = pathParts[1] || resource;
        
        switch (subResource) {
          case 'deals':
            return await handleContactDeals(client, contactId);
          case 'activities':
            return await handleContactActivities(client, url, contactId);
          case 'stats':
            return await handleContactStats(client, contactId);
          case 'tasks':
            return await handleContactTasks(client, contactId);
          default:
            return apiResponse(null, 'Resource not found', 404);
        }
      }
      
      return apiResponse(null, 'Endpoint not found', 404);
    } catch (error) {
      console.error('Error in contacts API:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
}

// List all contacts
async function handleContactsList(client, url) {
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
}

// Single contact by ID
async function handleSingleContact(client, url, contactId) {
  const { includeCompany } = Object.fromEntries(url.searchParams);
  
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
    WHERE ct.id = $1
  `;

  const result = await client.query(query, [contactId]);
  
  if (result.rows.length === 0) {
    return apiResponse(null, 'Contact not found', 404);
  }
  
  const row = result.rows[0];
  const data = {
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
  };

  return apiResponse(data);
}

// Contact deals
async function handleContactDeals(client, contactId) {
  const query = `
    SELECT 
      d.*,
      ds.name as stage_name,
      ds.color as stage_color,
      ds.default_probability
    FROM deals d
    LEFT JOIN deal_stages ds ON d.stage_id = ds.id
    WHERE d.primary_contact_id = $1 OR d.id IN (
      SELECT deal_id FROM deal_contacts WHERE contact_id = $1
    )
    ORDER BY d.updated_at DESC
  `;

  const result = await client.query(query, [contactId]);
  return apiResponse(result.rows);
}

// Contact activities
async function handleContactActivities(client, url, contactId) {
  const { limit = '10' } = Object.fromEntries(url.searchParams);
  
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

  const result = await client.query(query, [contactId, parseInt(limit)]);
  return apiResponse(result.rows);
}

// Contact statistics
async function handleContactStats(client, contactId) {
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
}

// Contact tasks
async function handleContactTasks(client, contactId) {
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
} 