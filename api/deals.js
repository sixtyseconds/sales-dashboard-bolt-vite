import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'api' && segment !== 'deals');
  const dealId = pathSegments[0];
  
  if (request.method === 'GET') {
    try {
      if (!dealId) {
        // GET /api/deals - List all deals
        return await handleDealsList(url);
      } else if (pathSegments.length === 1) {
        // GET /api/deals/:id - Single deal
        return await handleSingleDeal(dealId);
      } else if (pathSegments.length === 2) {
        // GET /api/deals/:id/activities, etc.
        const subResource = pathSegments[1];
        
        switch (subResource) {
          case 'activities':
            return await handleDealActivities(url, dealId);
          case 'contacts':
            return await handleDealContacts(dealId);
          case 'files':
            return await handleDealFiles(dealId);
          default:
            return apiResponse(null, 'Resource not found', 404);
        }
      }
      
      return apiResponse(null, 'Endpoint not found', 404);
    } catch (error) {
      console.error('Error in deals API:', error);
      return apiResponse(null, error.message, 500);
    }
  } else if (request.method === 'POST') {
    // POST /api/deals - Create deal
    return await handleCreateDeal(url);
  } else if (request.method === 'PUT' || request.method === 'PATCH') {
    if (pathSegments.length === 1) {
      // PUT /api/deals/:id - Update deal
      return await handleUpdateDeal(url, dealId);
    }
    
    return apiResponse(null, 'Endpoint not found', 404);
  } else if (request.method === 'DELETE') {
    if (pathSegments.length === 1) {
      // DELETE /api/deals/:id - Delete deal
      return await handleDeleteDeal(dealId);
    }
    
    return apiResponse(null, 'Endpoint not found', 404);
  }
  
  return apiResponse(null, 'Method not allowed', 405);
}

// List all deals
async function handleDealsList(url) {
  const { ownerId, stageId, status, includeRelationships, limit, search } = Object.fromEntries(url.searchParams);
  
  let query = `
    SELECT 
      d.*,
      ${includeRelationships === 'true' ? `
        c.name as company_name,
        c.domain as company_domain,
        c.size as company_size,
        c.industry as company_industry,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        ct.full_name as contact_full_name,
        ct.email as contact_email,
        ct.title as contact_title,
        ds.name as stage_name,
        ds.color as stage_color,
        ds.default_probability as default_probability
      ` : 'null as company_name, null as company_domain, null as contact_full_name, null as contact_email, null as stage_name, null as stage_color, null as default_probability'}
    FROM deals d
    ${includeRelationships === 'true' ? `
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
    ` : ''}
  `;
  
  const params = [];
  const conditions = [];
  
  if (search) {
    conditions.push(`(d.name ILIKE $${params.length + 1} OR d.company ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }
  
  if (ownerId) {
    conditions.push(`d.owner_id = $${params.length + 1}`);
    params.push(ownerId);
  }
  
  if (stageId) {
    conditions.push(`d.stage_id = $${params.length + 1}`);
    params.push(stageId);
  }
  
  if (status) {
    conditions.push(`d.status = $${params.length + 1}`);
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY d.updated_at DESC`;
  
  if (limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
  }

  const result = await executeQuery(query, params);
  
  const data = result.rows.map(row => ({
    ...row,
    // Add computed fields
    daysInStage: Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24)),
    timeStatus: (() => {
      const days = Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24));
      if (days > 30) return 'danger';
      if (days > 14) return 'warning';
      return 'normal';
    })(),
    // Relationships if included
    deal_stages: (includeRelationships === 'true' && row.stage_name) ? {
      id: row.stage_id,
      name: row.stage_name,
      color: row.stage_color,
      default_probability: row.default_probability
    } : null,
    companies: (includeRelationships === 'true' && row.company_name) ? {
      id: row.company_id,
      name: row.company_name,
      domain: row.company_domain,
      size: row.company_size,
      industry: row.company_industry
    } : null,
    contacts: (includeRelationships === 'true' && row.contact_full_name) ? {
      id: row.primary_contact_id,
      first_name: row.contact_first_name,
      last_name: row.contact_last_name,
      full_name: row.contact_full_name,
      email: row.contact_email,
      title: row.contact_title
    } : null
  }));

  return apiResponse(data);
}

// Single deal by ID
async function handleSingleDeal(dealId) {
  const { includeRelationships } = Object.fromEntries(url.searchParams);
  
  let query = `
    SELECT 
      d.*,
      ${includeRelationships === 'true' ? `
        c.name as company_name,
        c.domain as company_domain,
        c.size as company_size,
        c.industry as company_industry,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        ct.full_name as contact_full_name,
        ct.email as contact_email,
        ct.title as contact_title,
        ds.name as stage_name,
        ds.color as stage_color,
        ds.default_probability as default_probability
      ` : 'null as company_name, null as company_domain, null as contact_full_name, null as contact_email, null as stage_name, null as stage_color, null as default_probability'}
    FROM deals d
    ${includeRelationships === 'true' ? `
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
    ` : ''}
    WHERE d.id = $1
  `;

  const result = await executeQuery(query, [dealId]);
  
  if (result.rows.length === 0) {
    return apiResponse(null, 'Deal not found', 404);
  }
  
  const row = result.rows[0];
  const data = {
    ...row,
    // Add computed fields
    daysInStage: Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24)),
    timeStatus: (() => {
      const days = Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24));
      if (days > 30) return 'danger';
      if (days > 14) return 'warning';
      return 'normal';
    })(),
    // Relationships if included
    deal_stages: (includeRelationships === 'true' && row.stage_name) ? {
      id: row.stage_id,
      name: row.stage_name,
      color: row.stage_color,
      default_probability: row.default_probability
    } : null,
    companies: (includeRelationships === 'true' && row.company_name) ? {
      id: row.company_id,
      name: row.company_name,
      domain: row.company_domain,
      size: row.company_size,
      industry: row.company_industry
    } : null,
    contacts: (includeRelationships === 'true' && row.contact_full_name) ? {
      id: row.primary_contact_id,
      first_name: row.contact_first_name,
      last_name: row.contact_last_name,
      full_name: row.contact_full_name,
      email: row.contact_email,
      title: row.contact_title
    } : null
  };
  
  return apiResponse(data);
}

// Create deal
async function handleCreateDeal(url) {
  const body = await request.json();
  const {
    name,
    company,
    company_id,
    primary_contact_id,
    contact_name,
    contact_email,
    contact_phone,
    value,
    description,
    stage_id,
    owner_id,
    expected_close_date,
    probability,
    status = 'active'
  } = body;
  
  const query = `
    INSERT INTO deals (
      name, company, company_id, primary_contact_id, contact_name, contact_email, contact_phone,
      value, description, stage_id, owner_id, expected_close_date, probability, status,
      created_at, updated_at, stage_changed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW())
    RETURNING *
  `;
  
  const params = [
    name, company, company_id, primary_contact_id, contact_name, contact_email, contact_phone,
    value, description, stage_id, owner_id, expected_close_date, probability, status
  ];
  
  const result = await executeQuery(query, params);
  return apiResponse(result.rows[0], 'Deal created successfully', 201);
}

// Update deal
async function handleUpdateDeal(url, dealId) {
  const body = await request.json();
  const updates = [];
  const params = [];
  
  // Build dynamic update query
  let paramCount = 1;
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      updates.push(`${key} = $${paramCount}`);
      params.push(value);
      paramCount++;
    }
  });
  
  // Always update updated_at
  updates.push(`updated_at = NOW()`);
  
  // If stage_id is being updated, also update stage_changed_at
  if ('stage_id' in body) {
    updates.push(`stage_changed_at = NOW()`);
  }
  
  if (updates.length === 1) { // Only updated_at
    return apiResponse(null, 'No fields to update', 400);
  }
  
  params.push(dealId); // Add dealId as the last parameter
  
  const query = `
    UPDATE deals 
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await executeQuery(query, params);
  
  if (result.rows.length === 0) {
    return apiResponse(null, 'Deal not found', 404);
  }
  
  return apiResponse(result.rows[0], 'Deal updated successfully');
}

// Delete deal
async function handleDeleteDeal(dealId) {
  const query = `DELETE FROM deals WHERE id = $1 RETURNING id`;
  const result = await executeQuery(query, [dealId]);
  
  if (result.rows.length === 0) {
    return apiResponse(null, 'Deal not found', 404);
  }
  
  return apiResponse({ id: dealId }, 'Deal deleted successfully');
} 