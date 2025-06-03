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

async function simpleCompaniesMigration() {
  try {
    console.log('🔧 Simple companies migration to Supabase...');
    
    // Connect to Neon
    await neonClient.connect();
    
    // Get a small sample of companies data from Neon first
    console.log('📊 Getting sample companies data from Neon...');
    
    const companiesResult = await neonClient.query(`
      SELECT 
        name, 
        domain, 
        industry, 
        size, 
        website, 
        description
      FROM companies 
      WHERE name IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${companiesResult.rows.length} companies to test with`);
    
    // Try to insert a single company first to see what happens
    console.log('\n🧪 Testing with single company insert...');
    
    const testCompany = companiesResult.rows[0];
    console.log('Test company:', testCompany.name);
    
    const { data: insertData, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: testCompany.name,
        domain: testCompany.domain,
        industry: testCompany.industry,
        size: testCompany.size,
        website: testCompany.website,
        description: testCompany.description
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      
      // Let's see what tables DO exist and if we can create companies manually
      console.log('\n🔍 Let me check what we can do...');
      
      // Check if we can at least query existing tables
      const { data: dealsTest, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .limit(1);
      
      if (dealsError) {
        console.error('❌ Cannot even access deals table:', dealsError);
      } else {
        console.log('✅ Deals table accessible, but companies table missing');
        console.log('💡 Solution: You need to manually create the companies table in Supabase');
        console.log('   Go to your Supabase dashboard SQL editor and run:');
        console.log(`
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  industry TEXT,
  size TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_name ON companies(name);
        `);
      }
      
    } else {
      console.log('✅ Successfully inserted test company!');
      console.table(insertData);
      
      // If successful, insert more companies
      console.log('\n📥 Inserting more companies...');
      
      let successCount = 1; // Already inserted one
      for (let i = 1; i < Math.min(5, companiesResult.rows.length); i++) {
        const company = companiesResult.rows[i];
        
        const { error: batchError } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            domain: company.domain,
            industry: company.industry,
            size: company.size,
            website: company.website,
            description: company.description
          });
        
        if (batchError) {
          console.log(`❌ Failed to insert ${company.name}: ${batchError.message}`);
        } else {
          console.log(`✅ Inserted: ${company.name}`);
          successCount++;
        }
      }
      
      console.log(`\n🎉 Successfully inserted ${successCount} companies`);
      
      // Test the companies page
      const { data: finalTest, error: finalError, count } = await supabase
        .from('companies')
        .select('*', { count: 'exact' });
      
      if (finalError) {
        console.error('❌ Final test failed:', finalError);
      } else {
        console.log(`\n✅ Companies table working! Total count: ${count}`);
        console.log('🚀 Navigate to http://localhost:5175/companies to test the CRM page');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonClient.end();
  }
}

simpleCompaniesMigration(); 