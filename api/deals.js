import { executeQuery, handleCORS, apiResponse } from './_db.js';

export default async function handler(request, response) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request, response);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'api' && segment !== 'deals');
    const dealId = pathSegments[0];
    
    if (request.method === 'GET') {
      if (!dealId) {
        // GET /api/deals - List all deals
        return await handleDealsList(response, url);
      } else {
        // GET /api/deals/:id - Single deal
        return await handleSingleDeal(response, dealId, url);
      }
    } else if (request.method === 'POST') {
      // POST /api/deals - Create deal
      return await handleCreateDeal(response, request);
    } else if (request.method === 'PUT' || request.method === 'PATCH') {
      if (dealId) {
        // PUT /api/deals/:id - Update deal
        return await handleUpdateDeal(response, request, dealId);
      }
      return apiResponse(response, null, 'Deal ID required', 400);
    } else if (request.method === 'DELETE') {
      if (dealId) {
        // DELETE /api/deals/:id - Delete deal
        return await handleDeleteDeal(response, dealId);
      }
      return apiResponse(response, null, 'Deal ID required', 400);
    }
    
    return apiResponse(response, null, 'Method not allowed', 405);
  } catch (error) {
    console.error('Error in deals API:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// List all deals
async function handleDealsList(response, url) {
  try {
    const { ownerId, stageId, status, includeRelationships, limit, search } = Object.fromEntries(url.searchParams);
    
    let query = `
      SELECT 
        d.*,
        ${includeRelationships === 'true' ? `
          c.name as company_name,
          c.domain as company_domain,
          ct.first_name as contact_first_name,
          ct.last_name as contact_last_name,
          ct.full_name as contact_full_name,
          ct.email as contact_email,
          ds.name as stage_name,
          ds.color as stage_color,
          ds.default_probability as default_probability
        ` : 'null as company_name, null as contact_full_name, null as contact_email, null as stage_name'}
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
      daysInStage: row.stage_changed_at ? Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24)) : 0,
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
        domain: row.company_domain
      } : null,
      contacts: (includeRelationships === 'true' && row.contact_full_name) ? {
        id: row.primary_contact_id,
        full_name: row.contact_full_name,
        email: row.contact_email
      } : null
    }));

    return apiResponse(response, data);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Single deal by ID
async function handleSingleDeal(response, dealId, url) {
  try {
    const { includeRelationships } = Object.fromEntries(url.searchParams);
    
    let query = `
      SELECT 
        d.*,
        ${includeRelationships === 'true' ? `
          c.name as company_name,
          c.domain as company_domain,
          ct.full_name as contact_full_name,
          ct.email as contact_email,
          ds.name as stage_name,
          ds.color as stage_color
        ` : 'null as company_name, null as contact_full_name, null as stage_name'}
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
      return apiResponse(response, null, 'Deal not found', 404);
    }
    
    const row = result.rows[0];
    const data = {
      ...row,
      daysInStage: row.stage_changed_at ? Math.floor((new Date() - new Date(row.stage_changed_at)) / (1000 * 60 * 60 * 24)) : 0,
      // Add relationships if requested
      deal_stages: (includeRelationships === 'true' && row.stage_name) ? {
        id: row.stage_id,
        name: row.stage_name,
        color: row.stage_color
      } : null,
      companies: (includeRelationships === 'true' && row.company_name) ? {
        id: row.company_id,
        name: row.company_name,
        domain: row.company_domain
      } : null,
      contacts: (includeRelationships === 'true' && row.contact_full_name) ? {
        id: row.primary_contact_id,
        full_name: row.contact_full_name,
        email: row.contact_email
      } : null
    };
    
    return apiResponse(response, data);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Create deal
async function handleCreateDeal(response, request) {
  try {
    const body = await request.json();
    const {
      name,
      company,
      company_id,
      primary_contact_id,
      contact_name,
      contact_email,
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
        name, company, company_id, primary_contact_id, contact_name, contact_email,
        value, description, stage_id, owner_id, expected_close_date, probability, status,
        created_at, updated_at, stage_changed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
      RETURNING *
    `;
    
    const params = [
      name, company, company_id, primary_contact_id, contact_name, contact_email,
      value, description, stage_id, owner_id, expected_close_date, probability, status
    ];
    
    const result = await executeQuery(query, params);
    return apiResponse(response, result.rows[0], 'Deal created successfully', 201);
  } catch (error) {
    console.error('Error creating deal:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Update deal
async function handleUpdateDeal(response, request, dealId) {
  try {
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
    
    if (updates.length === 0) {
      return apiResponse(response, null, 'No fields to update', 400);
    }
    
    // Always update updated_at
    updates.push(`updated_at = NOW()`);
    
    // If stage_id is being updated, also update stage_changed_at
    if ('stage_id' in body) {
      updates.push(`stage_changed_at = NOW()`);
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
      return apiResponse(response, null, 'Deal not found', 404);
    }
    
    return apiResponse(response, result.rows[0], 'Deal updated successfully');
  } catch (error) {
    console.error('Error updating deal:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Delete deal
async function handleDeleteDeal(response, dealId) {
  try {
    const query = `DELETE FROM deals WHERE id = $1 RETURNING id`;
    const result = await executeQuery(query, [dealId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Deal not found', 404);
    }
    
    return apiResponse(response, { id: dealId }, 'Deal deleted successfully');
  } catch (error) {
    console.error('Error deleting deal:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 