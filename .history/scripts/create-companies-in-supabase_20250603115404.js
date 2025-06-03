#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Neon client (where our data is)
const neonClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function createCompaniesInSupabase() {
  try {
    console.log('🔧 Creating companies table in Supabase...');
    
    // Connect to Neon to get data
    await neonClient.connect();
    
    // Get companies data from Neon
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
    
    console.log(`📊 Found ${companiesResult.rows.length} companies in Neon database`);
    
    // Get a profile ID to use as owner (required field)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found in Supabase. Need a profile to assign as owner.');
      return;
    }
    
    const ownerId = profiles[0].id;
    console.log(`👤 Using profile ${ownerId} as owner`);
    
    // First, check if companies table exists and create if not
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
          owner_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
        CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
        CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      `
    });
    
    if (createError) {
      console.log('⚠️ Could not create table via RPC, trying manual insert...');
    } else {
      console.log('✅ Companies table created in Supabase');
    }
    
    // Insert companies one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const company of companiesResult.rows) {
      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          size: company.size,
          website: company.website,
          address: company.address,
          phone: company.phone,
          description: company.description,
          linkedin_url: company.linkedin_url,
          owner_id: ownerId,
          created_at: company.created_at,
          updated_at: company.updated_at
        });
      
      if (insertError) {
        console.log(`❌ Failed to insert ${company.name}: ${insertError.message}`);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`📈 Inserted ${successCount} companies...`);
        }
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Successfully inserted: ${successCount} companies`);
    console.log(`❌ Failed: ${errorCount} companies`);
    
    // Test the final result
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log(`\n📊 Final verification: ${testData.length} companies accessible via Supabase`);
      console.table(testData);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonClient.end();
  }
}

createCompaniesInSupabase(); 