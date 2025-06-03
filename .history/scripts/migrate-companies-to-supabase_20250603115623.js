#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Supabase client with service role (admin permissions)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Neon client (where our data is)
const neonClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrateCompaniesToSupabase() {
  try {
    console.log('🔧 Migrating companies to Supabase with service role key...');
    
    // Connect to Neon
    await neonClient.connect();
    
    // Step 1: Create the companies table in Supabase
    console.log('📋 Creating companies table in Supabase...');
    
    const createTableSQL = `
      -- Create companies table
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        domain TEXT UNIQUE,
        industry TEXT,
        size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
        website TEXT,
        address TEXT,
        phone TEXT,
        description TEXT,
        linkedin_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      
      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for companies
      DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
      CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Failed to create table:', createError);
      return;
    }
    
    console.log('✅ Companies table created successfully');
    
    // Step 2: Get data from Neon
    console.log('📊 Getting companies data from Neon...');
    
    const companiesResult = await neonClient.query(`
      SELECT 
        name, 
        domain, 
        industry, 
        size, 
        website, 
        address, 
        phone, 
        description, 
        linkedin_url,
        created_at,
        updated_at
      FROM companies 
      ORDER BY created_at DESC;
    `);
    
    console.log(`Found ${companiesResult.rows.length} companies to migrate`);
    
    // Step 3: Insert companies in batches
    console.log('📥 Inserting companies...');
    
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < companiesResult.rows.length; i += batchSize) {
      const batch = companiesResult.rows.slice(i, i + batchSize);
      
      const { error: batchError } = await supabase
        .from('companies')
        .insert(
          batch.map(company => ({
            name: company.name,
            domain: company.domain,
            industry: company.industry,
            size: company.size,
            website: company.website,
            address: company.address,
            phone: company.phone,
            description: company.description,
            linkedin_url: company.linkedin_url,
            created_at: company.created_at,
            updated_at: company.updated_at
          }))
        );
      
      if (batchError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} companies`);
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${successCount} companies`);
    console.log(`❌ Failed: ${errorCount} companies`);
    
    // Step 4: Verify the migration
    console.log('\n📊 Verifying migration...');
    
    const { data: verifyData, error: verifyError, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log(`✅ Verification successful: ${count} companies in Supabase`);
      console.table(verifyData);
    }
    
    console.log('\n🚀 Companies table is now ready for the React app!');
    console.log('   Navigate to http://localhost:5175/companies to test');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonClient.end();
  }
}

migrateCompaniesToSupabase(); 