#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
  try {
    console.log('🔍 Checking existing database schema...\n');
    
    await client.connect();
    console.log('✅ Connected to Neon database\n');

    // Check schemas
    console.log('📋 Available schemas:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    console.table(schemas.rows);

    // Check existing tables
    console.log('\n📋 Existing tables:');
    const tables = await client.query(`
      SELECT 
        schemaname, 
        tablename, 
        tableowner
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `);
    console.table(tables.rows);

    // Check for users/auth related tables
    console.log('\n🔍 Looking for user/auth tables:');
    const userTables = await client.query(`
      SELECT tablename, schemaname
      FROM pg_tables 
      WHERE tablename ILIKE '%user%' OR tablename ILIKE '%auth%'
      ORDER BY tablename;
    `);
    
    if (userTables.rows.length > 0) {
      console.table(userTables.rows);
    } else {
      console.log('No user/auth tables found');
    }

    // Check if we have deals/activities tables
    console.log('\n🔍 Checking for existing CRM tables:');
    const crmTables = await client.query(`
      SELECT tablename, schemaname
      FROM pg_tables 
      WHERE tablename IN ('deals', 'activities', 'deal_stages', 'deal_activities', 'profiles')
      ORDER BY tablename;
    `);
    
    if (crmTables.rows.length > 0) {
      console.table(crmTables.rows);
      
      // Show sample structure of key tables
      for (const table of crmTables.rows) {
        console.log(`\n📊 Structure of ${table.tablename}:`);
        try {
          const columns = await client.query(`
            SELECT 
              column_name, 
              data_type, 
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_name = '${table.tablename}' 
              AND table_schema = '${table.schemaname}'
            ORDER BY ordinal_position;
          `);
          console.table(columns.rows);
        } catch (e) {
          console.log(`Error getting columns: ${e.message}`);
        }
      }
    } else {
      console.log('No existing CRM tables found');
    }

    // Check extensions
    console.log('\n🔧 Available extensions:');
    const extensions = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      ORDER BY extname;
    `);
    console.table(extensions.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkSchema().catch(console.error); 