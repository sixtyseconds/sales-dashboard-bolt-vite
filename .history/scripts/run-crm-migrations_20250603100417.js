#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Neon database connection
const supabaseUrl = 'https://ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech';
const supabaseAnonKey = 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// For direct postgres connection, we'll use a different approach
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

const migrations = [
  '20250127120000_create_companies_table.sql',
  '20250127120100_create_contacts_table.sql', 
  '20250127120200_create_relationship_tables.sql',
  '20250127120300_update_existing_tables.sql',
  '20250127120400_migrate_existing_data.sql',
  '20250127120500_fix_duplicate_deal_logic.sql'
];

async function runMigrations() {
  try {
    console.log('🚀 Starting CRM migrations...\n');
    
    await client.connect();
    console.log('✅ Connected to Neon database\n');

    for (const migration of migrations) {
      console.log(`📄 Running migration: ${migration}`);
      
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migration}`);
        continue;
      }
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        const result = await client.query(sql);
        console.log(`✅ Migration completed: ${migration}`);
        
        // If this is the migration summary migration, show results
        if (migration.includes('migrate_existing_data')) {
          console.log('\n📊 Migration Summary:');
          if (result.rows && result.rows.length > 0) {
            console.table(result.rows);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error in migration ${migration}:`, error.message);
        
        // Continue with other migrations even if one fails
        if (error.message.includes('already exists')) {
          console.log(`   (Table/constraint already exists - continuing...)`);
        } else {
          throw error;
        }
      }
      
      console.log('');
    }
    
    console.log('🎉 All CRM migrations completed successfully!');
    
    // Run a quick validation query
    console.log('\n🔍 Validating new tables...');
    
    const validation = await client.query(`
      SELECT 
        schemaname, 
        tablename, 
        tableowner
      FROM pg_tables 
      WHERE tablename IN ('companies', 'contacts', 'deal_contacts', 'contact_preferences', 'activity_sync_rules')
      ORDER BY tablename;
    `);
    
    console.log('📋 New CRM tables created:');
    console.table(validation.rows);
    
    // Check migration summary if view exists
    try {
      const summary = await client.query('SELECT * FROM migration_summary ORDER BY entity;');
      console.log('\n📈 Data migration summary:');
      console.table(summary.rows);
    } catch (e) {
      console.log('📈 Migration summary view not available');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migrations
runMigrations().catch(console.error); 