#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkTables() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check specifically for CRM tables
    const crmTables = ['companies', 'contacts', 'deal_contacts', 'contact_preferences', 'activity_sync_rules'];
    console.log('\n🔍 CRM Tables Status:');
    
    const existingTables = result.rows.map(r => r.table_name);
    crmTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables(); 