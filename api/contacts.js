import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  try {
    if (request.method === 'GET') {
      // Parse URL for Vercel compatibility - extract path and query separately
      const urlParts = request.url.split('?');
      const pathname = urlParts[0];
      const queryString = urlParts[1] || '';
      const searchParams = new URLSearchParams(queryString);
      
      // Extract path segments for routing
      const pathSegments = pathname.split('/').filter(segment => segment && segment !== 'api' && segment !== 'contacts');
      
      if (pathSegments.length === 0) {
        // GET /api/contacts - List all contacts
        return await handleContactsList(response, searchParams);
      } else if (pathSegments.length === 1) {
        // GET /api/contacts/:id - Single contact
        const contactId = pathSegments[0];
        return await handleSingleContact(response, searchParams, contactId);
      } else if (pathSegments.length === 2) {
        // GET /api/contacts/:id/deals, etc.
        const [contactId, subResource] = pathSegments;
        
        switch (subResource) {
          case 'deals':
            return await handleContactDeals(response, contactId);
          case 'activities':
            return await handleContactActivities(response, searchParams, contactId);
          case 'stats':
            return await handleContactStats(response, contactId);
          case 'owner':
            return await handleContactOwner(response, contactId);
          case 'tasks':
            return await handleContactTasks(response, contactId);
          default:
            return apiResponse(response, null, 'Resource not found', 404);
        }
      }
      
      return apiResponse(response, null, 'Endpoint not found', 404);
    }

    return apiResponse(response, null, 'Method not allowed', 405);
  } catch (error) {
    console.error('Error in contacts API:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// List all contacts
async function handleContactsList(response, searchParams) {
  try {
    const { search, companyId, includeCompany, limit, ownerId } = Object.fromEntries(searchParams);
    
    let query = `
      SELECT 
        ct.*,
        ${includeCompany === 'true' ? `
          c.id as company_id,
          c.name as company_name,
          c.domain as company_domain,
          c.size as company_size,
          c.industry as company_industry
        ` : 'null as company_id, null as company_name, null as company_domain'}
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
        industry: row.company_industry
      } : null
    }));

    return apiResponse(response, data);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Single contact by ID
async function handleSingleContact(response, searchParams, contactId) {
  try {
    const { includeCompany } = Object.fromEntries(searchParams);
    
    let query = `
      SELECT 
        ct.*,
        ${includeCompany === 'true' ? `
          c.id as company_id,
          c.name as company_name,
          c.domain as company_domain,
          c.size as company_size,
          c.industry as company_industry
        ` : 'null as company_id, null as company_name, null as company_domain'}
      FROM contacts ct
      ${includeCompany === 'true' ? 'LEFT JOIN companies c ON ct.company_id = c.id' : ''}
      WHERE ct.id = $1
    `;

    const result = await executeQuery(query, [contactId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact not found', 404);
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
        industry: row.company_industry
      } : null
    };

    return apiResponse(response, data);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Contact deals
async function handleContactDeals(response, contactId) {
  try {
    const query = `
      SELECT 
        d.*,
        ds.name as stage_name,
        ds.color as stage_color,
        ds.default_probability
      FROM deals d
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      WHERE d.primary_contact_id = $1
      ORDER BY d.updated_at DESC
    `;

    const result = await executeQuery(query, [contactId]);
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact deals:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Contact activities
async function handleContactActivities(response, searchParams, contactId) {
  try {
    const { limit = '10' } = Object.fromEntries(searchParams);
    
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
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact activities:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Contact stats
async function handleContactStats(response, contactId) {
  try {
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
      executeQuery(activityQuery, [contactId]),
      executeQuery(dealsQuery, [contactId])
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
    
    return apiResponse(response, stats);
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Contact owner
async function handleContactOwner(response, contactId) {
  try {
    const query = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.stage,
        p.email,
        p.avatar_url,
        c.created_at as assigned_date
      FROM contacts c
      LEFT JOIN profiles p ON c.owner_id = p.id
      WHERE c.id = $1
    `;

    const result = await executeQuery(query, [contactId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact or owner not found', 404);
    }
    
    const row = result.rows[0];
    const ownerData = {
      id: row.id,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      first_name: row.first_name,
      last_name: row.last_name,
      title: row.stage,
      email: row.email,
      avatar_url: row.avatar_url,
      assigned_date: row.assigned_date
    };

    return apiResponse(response, ownerData);
  } catch (error) {
    console.error('Error fetching contact owner:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Contact tasks  
async function handleContactTasks(response, contactId) {
  try {
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

    const result = await executeQuery(tasksQuery, [contactId]);
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact tasks:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 