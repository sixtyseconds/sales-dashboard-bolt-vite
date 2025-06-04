import { getDbClient, handleCORS, apiResponse } from './_db.js';

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    try {
      const client = await getDbClient();
      const url = new URL(request.url);
      const { 
        ownerId, 
        type, 
        startDate, 
        endDate, 
        limit, 
        includeRelationships,
        search,
        contactId,
        companyId 
      } = Object.fromEntries(url.searchParams);
      
      let query = `
        SELECT 
          a.*,
          ${includeRelationships === 'true' ? `
            c.name as company_name,
            c.domain as company_domain,
            ct.first_name as contact_first_name,
            ct.last_name as contact_last_name,
            ct.full_name as contact_full_name,
            ct.email as contact_email
          ` : 'null as company_name, null as contact_full_name, null as contact_email'}
        FROM activities a
        ${includeRelationships === 'true' ? `
          LEFT JOIN companies c ON a.company_id = c.id
          LEFT JOIN contacts ct ON a.contact_id = ct.id
        ` : ''}
      `;
      
      const params = [];
      const conditions = [];
      
      if (search) {
        conditions.push(`(a.client_name ILIKE $${params.length + 1} OR a.details ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (ownerId) {
        conditions.push(`a.user_id = $${params.length + 1}`);
        params.push(ownerId);
      }
      
      if (type) {
        conditions.push(`a.type = $${params.length + 1}`);
        params.push(type);
      }
      
      if (contactId) {
        conditions.push(`a.contact_id = $${params.length + 1}`);
        params.push(contactId);
      }
      
      if (companyId) {
        conditions.push(`a.company_id = $${params.length + 1}`);
        params.push(companyId);
      }
      
      if (startDate) {
        conditions.push(`a.date >= $${params.length + 1}`);
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push(`a.date <= $${params.length + 1}`);
        params.push(endDate);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY a.date DESC, a.created_at DESC`;
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));
      }

      const result = await client.query(query, params);
      
      const data = result.rows.map(row => ({
        ...row,
        // Add relationships if included
        companies: (includeRelationships === 'true' && row.company_name) ? {
          id: row.company_id,
          name: row.company_name,
          domain: row.company_domain
        } : null,
        contacts: (includeRelationships === 'true' && row.contact_full_name) ? {
          id: row.contact_id,
          first_name: row.contact_first_name,
          last_name: row.contact_last_name,
          full_name: row.contact_full_name,
          email: row.contact_email
        } : null
      }));

      return apiResponse(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return apiResponse(null, error.message, 500);
    }
  } else if (request.method === 'POST') {
    try {
      const client = await getDbClient();
      const body = await request.json();
      const {
        user_id,
        type,
        client_name,
        contact_identifier,
        details,
        amount,
        date,
        status = 'completed'
      } = body;
      
      const query = `
        INSERT INTO activities (
          user_id, type, client_name, contact_identifier, details, amount, date, status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      
      const params = [
        user_id, type, client_name, contact_identifier, details, amount, date, status
      ];
      
      const result = await client.query(query, params);
      return apiResponse(result.rows[0], 'Activity created successfully', 201);
    } catch (error) {
      console.error('Error creating activity:', error);
      return apiResponse(null, error.message, 500);
    }
  }

  return apiResponse(null, 'Method not allowed', 405);
} 