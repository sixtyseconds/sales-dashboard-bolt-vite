#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

// Using the same Neon connection string as the React app
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function quickTest() {
  try {
    console.log('🔗 Testing Neon database connection...');
    await client.connect();
    
    // Test companies count
    const companiesResult = await client.query('SELECT COUNT(*) as count FROM companies');
    console.log(`✅ Companies: ${companiesResult.rows[0].count} records`);
    
    // Test deals count  
    const dealsResult = await client.query('SELECT COUNT(*) as count FROM deals');
    console.log(`✅ Deals: ${dealsResult.rows[0].count} records`);
    
    // Test deals with CRM relationships
    const crmDealsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM deals d 
      WHERE d.company_id IS NOT NULL AND d.primary_contact_id IS NOT NULL
    `);
    console.log(`✅ Deals with CRM relationships: ${crmDealsResult.rows[0].count} records`);
    
    console.log('\n🎉 Neon database is ready for the React app!');
    console.log(`🚀 Test the CRM at: http://localhost:5175/companies`);
    console.log(`🚀 Test the Pipeline at: http://localhost:5175/pipeline`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

quickTest(); 