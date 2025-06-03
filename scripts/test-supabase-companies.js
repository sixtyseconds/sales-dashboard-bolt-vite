#!/usr/bin/env node

// Test Supabase connection using the same config as the React app
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompaniesAccess() {
  try {
    console.log('\n📊 Testing companies table access via Supabase...');
    
    // Test basic query
    const { data, error, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.error('❌ Supabase Error:', error);
      return;
    }
    
    console.log('✅ Successfully fetched companies via Supabase');
    console.log('📈 Total count:', count);
    console.log('📋 Sample data:');
    console.table(data);
    
    // Test the exact query the useCompanies hook uses
    console.log('\n🔍 Testing useCompanies hook query...');
    const { data: companiesWithStats, error: statsError } = await supabase
      .from('companies')
      .select(`
        *,
        contacts:contacts(count),
        deals:deals(count, value)
      `);
    
    if (statsError) {
      console.error('❌ Stats Query Error:', statsError);
    } else {
      console.log('✅ Successfully fetched companies with stats');
      console.log('📊 Companies with stats count:', companiesWithStats.length);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testCompaniesAccess(); 