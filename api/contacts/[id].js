import { executeQuery, apiResponse } from '../_db.js';

export default async function handler(request, response) {
  const urlParts = request.url.split('/');
  const contactId = urlParts[urlParts.length - 1].split('?')[0];
  
  if (request.method === 'GET') {
    return handleGetContact(response, contactId);
  } else if (request.method === 'PUT') {
    return handleUpdateContact(response, request, contactId);
  } else if (request.method === 'DELETE') {
    return handleDeleteContact(response, contactId);
  } else {
    response.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return apiResponse(response, null, 'Method not allowed', 405);
  }
}

// Get single contact by ID
async function handleGetContact(response, contactId) {
  try {
    const query = `
      SELECT 
        ct.*,
        c.id as company_id,
        c.name as company_name,
        c.domain as company_domain,
        c.size as company_size,
        c.industry as company_industry,
        c.website as company_website
      FROM contacts ct
      LEFT JOIN companies c ON ct.company_id = c.id
      WHERE ct.id = $1
    `;

    const result = await executeQuery(query, [contactId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact not found', 404);
    }

    const contact = {
      ...result.rows[0],
      companies: result.rows[0].company_id ? {
        id: result.rows[0].company_id,
        name: result.rows[0].company_name,
        domain: result.rows[0].company_domain,
        size: result.rows[0].company_size,
        industry: result.rows[0].company_industry,
        website: result.rows[0].company_website
      } : null
    };

    return apiResponse(response, contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Update contact
async function handleUpdateContact(response, request, contactId) {
  try {
    const body = await request.json();
    const { 
      first_name,
      last_name,
      email,
      phone,
      title,
      company_id,
      linkedin_url,
      notes,
      is_primary
    } = body;

    const query = `
      UPDATE contacts 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          title = COALESCE($5, title),
          company_id = COALESCE($6, company_id),
          linkedin_url = COALESCE($7, linkedin_url),
          notes = COALESCE($8, notes),
          is_primary = COALESCE($9, is_primary),
          full_name = COALESCE($1, first_name) || ' ' || COALESCE($2, last_name),
          updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const params = [first_name, last_name, email, phone, title, company_id, linkedin_url, notes, is_primary, contactId];
    const result = await executeQuery(query, params);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact not found', 404);
    }

    return apiResponse(response, result.rows[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    return apiResponse(response, null, error.message, 500);
  }
}

// Delete contact
async function handleDeleteContact(response, contactId) {
  try {
    const query = `DELETE FROM contacts WHERE id = $1 RETURNING *`;
    const result = await executeQuery(query, [contactId]);
    
    if (result.rows.length === 0) {
      return apiResponse(response, null, 'Contact not found', 404);
    }

    return apiResponse(response, { message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return apiResponse(response, null, error.message, 500);
  }
} 