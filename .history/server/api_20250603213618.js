#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Client } = pkg;
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Neon database client
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

// Connect to database
async function connectDB() {
  try {
    await client.connect();
    console.log('🔗 Connected to Neon database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Mock user endpoint
app.get('/api/user', (req, res) => {
  res.json({
    id: 'dev-user-123',
    email: 'dev@example.com',
    first_name: 'Development',
    last_name: 'User',
    stage: 'Manager',
    is_admin: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

// Companies with stats endpoint
app.get('/api/companies', async (req, res) => {
  try {
    const { search, includeStats, limit } = req.query;
    
    let query = `
      SELECT 
        c.*,
        ${includeStats === 'true' ? `
          COALESCE(contact_counts.contact_count, 0) as "contactCount",
          COALESCE(deal_counts.deal_count, 0) as "dealsCount",
          COALESCE(deal_counts.deal_value, 0) as "dealsValue"
        ` : '0 as "contactCount", 0 as "dealsCount", 0 as "dealsValue"'}
      FROM companies c
      ${includeStats === 'true' ? `
        LEFT JOIN (
          SELECT company_id, COUNT(*) as contact_count
          FROM contacts 
          WHERE company_id IS NOT NULL
          GROUP BY company_id
        ) contact_counts ON c.id = contact_counts.company_id
        LEFT JOIN (
          SELECT company_id, COUNT(*) as deal_count, COALESCE(SUM(value), 0) as deal_value
          FROM deals 
          WHERE company_id IS NOT NULL
          GROUP BY company_id
        ) deal_counts ON c.id = deal_counts.company_id
      ` : ''}
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE (c.name ILIKE $${params.length + 1} OR c.domain ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY c.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await client.query(query, params);
    
    res.json({
      data: result.rows,
      error: null,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deals with relationships endpoint
app.get('/api/deals', async (req, res) => {
  try {
    const { includeRelationships, limit } = req.query;
    
    let query = `
      SELECT 
        d.*,
        ${includeRelationships === 'true' ? `
          c.name as company_name,
          c.domain as company_domain,
          c.size as company_size,
          c.industry as company_industry,
          ct.full_name as contact_name,
          ct.email as contact_email,
          ct.title as contact_title,
          ds.name as stage_name,
          ds.color as stage_color,
          ds.default_probability as stage_probability
        ` : 'null as company_name, null as company_domain, null as contact_name, null as contact_email'}
      FROM deals d
      ${includeRelationships === 'true' ? `
        LEFT JOIN companies c ON d.company_id = c.id
        LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
        LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      ` : ''}
      ORDER BY d.updated_at DESC
    `;
    
    if (limit) {
      query += ` LIMIT $1`;
    }

    const params = limit ? [parseInt(limit)] : [];
    const result = await client.query(query, params);
    
    res.json({
      data: result.rows,
      error: null,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contacts with relationships endpoint
app.get('/api/contacts', async (req, res) => {
  try {
    const { search, companyId, includeCompany, limit } = req.query;
    
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

    res.json({
      data,
      error: null,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await client.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Deal stages endpoint
app.get('/api/stages', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        color,
        order_index,
        default_probability,
        is_final,
        created_at,
        updated_at
      FROM deal_stages
      ORDER BY order_index ASC
    `;

    const result = await client.query(query);
    
    res.json({
      data: result.rows,
      error: null,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching deal stages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Companies API: http://localhost:${PORT}/api/companies`);
    console.log(`👥 Contacts API: http://localhost:${PORT}/api/contacts`);
    console.log(`📋 Deals API: http://localhost:${PORT}/api/deals`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error); 