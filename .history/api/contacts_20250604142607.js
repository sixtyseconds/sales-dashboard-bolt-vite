import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'api' && segment !== 'contacts');
      
      // Handle different contact endpoints
      if (pathSegments.length === 0) {
        // GET /api/contacts - List all contacts
        return await handleContactsList(url);
      } else if (pathSegments.length === 1) {
        // GET /api/contacts/:id - Single contact
        const contactId = pathSegments[0];
        return await handleSingleContact(url, contactId);
      } else if (pathSegments.length === 2) {
        // GET /api/contacts/:id/deals, /api/contacts/:id/activities, etc.
        const [contactId, subResource] = pathSegments;
        
        switch (subResource) {
          case 'deals':
            return await handleContactDeals(contactId);
          case 'activities':
            return await handleContactActivities(url, contactId);
          case 'stats':
            return await handleContactStats(contactId);
          case 'tasks':
            return await handleContactTasks(contactId);
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
async function handleContactsList(url) {
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

  const result = await executeQuery(query, params);
  
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
async function handleSingleContact(url, contactId) {
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

  const result = await executeQuery(query, [contactId]);
  
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
async function handleContactDeals(contactId) {
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

  const result = await executeQuery(query, [contactId]);
  return apiResponse(result.rows);
}

// Contact activities
async function handleContactActivities(url, contactId) {
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

  const result = await executeQuery(query, [contactId, parseInt(limit)]);
  return apiResponse(result.rows);
}

// Contact statistics
async function handleContactStats(contactId) {
  const query = `
    SELECT 
      COUNT(DISTINCT d.id) as total_deals,
      COALESCE(SUM(d.value), 0) as total_deal_value,
      COUNT(DISTINCT a.id) as total_activities,
      COUNT(DISTINCT CASE WHEN d.is_won THEN d.id END) as won_deals,
      COALESCE(SUM(CASE WHEN d.is_won THEN d.value ELSE 0 END), 0) as won_value
    FROM deals d
    LEFT JOIN activities a ON d.primary_contact_id = $1
    WHERE d.primary_contact_id = $1 OR d.id IN (
      SELECT deal_id FROM deal_contacts WHERE contact_id = $1
    )
  `;

  const result = await executeQuery(query, [contactId]);
  return apiResponse(result.rows[0] || {});
}

// Contact tasks
async function handleContactTasks(contactId) {
  const query = `
    SELECT 
      t.*,
      ct.first_name || ' ' || ct.last_name as contact_name
    FROM tasks t
    LEFT JOIN contacts ct ON t.contact_id = ct.id
    WHERE t.contact_id = $1
    ORDER BY t.due_date ASC, t.created_at DESC
  `;

  const result = await executeQuery(query, [contactId]);
  return apiResponse(result.rows);
} 