#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Client } = pkg;
const app = express();
const PORT = 3001;

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
    first_name: 'Dev',
    last_name: 'User',
    stage: 'Manager',
    avatar_url: null,
    is_admin: true
  });
});

// Companies endpoints
app.get('/api/companies', async (req, res) => {
  try {
    const { search, includeStats, limit } = req.query;
    
    let query = `
      SELECT 
        c.*,
        ${includeStats === 'true' ? `
          (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count,
          (SELECT COUNT(*) FROM deals WHERE company_id = c.id) as deals_count,
          (SELECT COALESCE(SUM(value), 0) FROM deals WHERE company_id = c.id) as deals_value
        ` : '0 as contact_count, 0 as deals_count, 0 as deals_value'}
      FROM companies c
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE (c.name ILIKE $1 OR c.domain ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY c.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await client.query(query, params);
    
    const data = result.rows.map(row => ({
      ...row,
      contactCount: parseInt(row.contact_count),
      dealsCount: parseInt(row.deals_count), 
      dealsValue: parseFloat(row.deals_value)
    }));

    res.json({
      data,
      error: null,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deals with relationships endpoint
app.get('/api/deals', async (req, res) => {
  try {
    const query = `
      SELECT 
        d.*,
        ds.id as stage_id, 
        ds.name as stage_name, 
        ds.color as stage_color, 
        ds.default_probability,
        
        -- Company relationship
        c.id as company_id,
        c.name as company_name,
        c.domain as company_domain,
        c.size as company_size,
        c.industry as company_industry,
        c.website as company_website,
        c.linkedin_url as company_linkedin_url,
        
        -- Primary contact relationship
        ct.id as contact_id,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        ct.full_name as contact_full_name,
        ct.email as contact_email,
        ct.phone as contact_phone,
        ct.title as contact_title,
        ct.linkedin_url as contact_linkedin_url,
        ct.is_primary as contact_is_primary
        
      FROM deals d
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
      ORDER BY d.updated_at DESC;
    `;

    const result = await client.query(query);
    
    const data = result.rows.map(row => {
      // Calculate days in stage
      const stageChangedDate = new Date(row.stage_changed_at);
      const currentDate = new Date();
      const daysInStage = Math.floor((currentDate.getTime() - stageChangedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        // Deal fields
        ...row,
        daysInStage,
        timeStatus: daysInStage > 14 ? 'danger' : daysInStage > 7 ? 'warning' : 'normal',
        
        // Deal stages relationship
        deal_stages: row.stage_id ? {
          id: row.stage_id,
          name: row.stage_name,
          color: row.stage_color,
          default_probability: row.default_probability
        } : null,
        
        // Companies relationship
        companies: row.company_id ? {
          id: row.company_id,
          name: row.company_name,
          domain: row.company_domain,
          size: row.company_size,
          industry: row.company_industry,
          website: row.company_website,
          linkedin_url: row.company_linkedin_url
        } : null,
        
        // Contacts relationship
        contacts: row.contact_id ? {
          id: row.contact_id,
          first_name: row.contact_first_name,
          last_name: row.contact_last_name,
          full_name: row.contact_full_name,
          email: row.contact_email,
          phone: row.contact_phone,
          title: row.contact_title,
          linkedin_url: row.contact_linkedin_url,
          is_primary: row.contact_is_primary
        } : null,
        
        // Empty deal_contacts for now (can be enhanced later)
        deal_contacts: []
      };
    });

    res.json({
      data,
      error: null
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await client.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Companies API: http://localhost:${PORT}/api/companies`);
    console.log(`📋 Deals API: http://localhost:${PORT}/api/deals`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await client.end();
  process.exit(0);
});

startServer().catch(console.error); 