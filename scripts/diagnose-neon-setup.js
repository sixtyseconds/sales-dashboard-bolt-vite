import pkg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Your Neon connection
const neonClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

// Supabase client (if configured)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

async function diagnoseSetup() {
  console.log('🔧 Diagnosing Neon + Supabase Hybrid Setup');
  console.log('='.repeat(50));

  try {
    // Step 1: Test Neon connection
    console.log('\n📊 Step 1: Testing Direct Neon Connection');
    console.log('-'.repeat(30));
    
    await neonClient.connect();
    console.log('✅ Connected to Neon database');

    // Check tables in Neon
    const tablesResult = await neonClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📋 Found ${tablesResult.rows.length} tables in Neon:`);
    tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Step 2: Check contacts and companies data
    console.log('\n👥 Step 2: Checking Contacts & Companies Data');
    console.log('-'.repeat(30));
    
    const contactsCount = await neonClient.query('SELECT COUNT(*) FROM contacts');
    const companiesCount = await neonClient.query('SELECT COUNT(*) FROM companies');
    
    console.log(`📞 Contacts: ${contactsCount.rows[0].count}`);
    console.log(`🏢 Companies: ${companiesCount.rows[0].count}`);

    // Sample contact with company relationship
    const sampleContact = await neonClient.query(`
      SELECT 
        c.id, c.email, c.full_name, c.company_id,
        comp.name as company_name
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
      LIMIT 1
    `);

    if (sampleContact.rows.length > 0) {
      console.log('📋 Sample contact with company:');
      console.table(sampleContact.rows);
    }

    // Step 3: Check foreign key relationships
    console.log('\n🔗 Step 3: Checking Database Relationships');
    console.log('-'.repeat(30));
    
    const foreignKeys = await neonClient.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('contacts', 'deals', 'activities')
    `);

    if (foreignKeys.rows.length > 0) {
      console.log('✅ Foreign key relationships found:');
      console.table(foreignKeys.rows);
    } else {
      console.log('⚠️ No foreign key relationships found');
    }

    // Step 4: Test Express API endpoints
    console.log('\n🌐 Step 4: Testing Express API Endpoints');
    console.log('-'.repeat(30));
    
    try {
      const apiTests = [
        'http://localhost:8000/api/health',
        'http://localhost:8000/api/contacts?limit=1&includeCompany=true',
        'http://localhost:8000/api/companies?limit=1&includeStats=true'
      ];

      for (const url of apiTests) {
        try {
          const response = await fetch(url);
          const data = await response.json();
          console.log(`✅ ${url}: ${response.status} - ${data.data ? `${data.data.length} records` : 'OK'}`);
        } catch (err) {
          console.log(`❌ ${url}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('❌ API endpoints not accessible (server might not be running)');
    }

    // Step 5: Test Supabase connection (if configured)
    if (supabase) {
      console.log('\n🔄 Step 5: Testing Supabase Client');
      console.log('-'.repeat(30));
      
      try {
        const { data: supabaseContacts, error } = await supabase
          .from('contacts')
          .select('*')
          .limit(1);
        
        if (error) {
          console.log('❌ Supabase contacts fetch failed:', error.message);
        } else {
          console.log(`✅ Supabase returned ${supabaseContacts?.length || 0} contacts`);
        }
      } catch (err) {
        console.log('❌ Supabase client error:', err.message);
      }
    } else {
      console.log('\n⚠️ Step 5: Supabase client not configured');
    }

    // Step 6: Architecture Analysis
    console.log('\n🏗️ Step 6: Architecture Analysis');
    console.log('-'.repeat(30));
    
    console.log('Current Setup:');
    console.log('📊 Database: Neon PostgreSQL (working ✅)');
    console.log('🌐 API Server: Express on :8000 (check above)');
    console.log('⚛️ Frontend: React + Supabase client (mismatch ⚠️)');
    
    console.log('\n🔧 Recommendations:');
    console.log('1. Option A: Configure Supabase to use Neon as database');
    console.log('2. Option B: Update frontend to use Express API instead of Supabase client');
    console.log('3. Option C: Create direct Neon client for frontend');
    
    // Step 7: Provide specific contact record fix
    console.log('\n🎯 Step 7: Contact Record Page Fix');
    console.log('-'.repeat(30));
    
    console.log('Current issue: ContactService uses Supabase client, but data is in Neon');
    console.log('Solution: Create NeonContactService that uses Express API');
    console.log('Status: Manual join workaround implemented ✅');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  } finally {
    await neonClient.end();
  }
}

// Run the diagnostic
diagnoseSetup(); 