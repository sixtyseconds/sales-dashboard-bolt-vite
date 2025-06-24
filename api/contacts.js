import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'api' && segment !== 'contacts');
      
      if (pathSegments.length === 0) {
        // GET /api/contacts - List all contacts
        return await handleContactsList(response, url);
      } else if (pathSegments.length === 1) {
        // GET /api/contacts/:id - Single contact
        const contactId = pathSegments[0];
        return await handleSingleContact(response, url, contactId);
      } else if (pathSegments.length === 2) {
        // GET /api/contacts/:id/deals, etc.
        const [contactId, subResource] = pathSegments;
        
        switch (subResource) {
          case 'deals':
            return await handleContactDeals(response, contactId);
          case 'activities':
            return await handleContactActivities(response, url, contactId);
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
async function handleContactsList(response, url) {
  try {
    const { search, companyId, includeCompany, limit, ownerId } = Object.fromEntries(url.searchParams);
    
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
async function handleSingleContact(response, url, contactId) {
  try {
    const { includeCompany } = Object.fromEntries(url.searchParams);
    
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
async function handleContactActivities(response, url, contactId) {
  try {
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
    return apiResponse(response, result.rows);
  } catch (error) {
    console.error('Error fetching contact activities:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 