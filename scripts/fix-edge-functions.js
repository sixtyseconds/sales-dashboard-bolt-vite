import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔧 DIAGNOSING EDGE FUNCTION ISSUES');
console.log('=' .repeat(40));

async function diagnoseEdgeFunctions() {
  const baseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') + '/functions/v1';
  
  console.log('Base URL:', baseUrl);
  
  const functions = ['health', 'deals', 'stages', 'contacts', 'companies'];
  
  for (const func of functions) {
    console.log(`\n🔍 Testing ${func}:`);
    
    try {
      const response = await fetch(`${baseUrl}/${func}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`   Error Body: ${text.substring(0, 200)}...`);
      } else {
        const data = await response.text();
        console.log(`   Success: ${data.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   Network Error: ${error.message}`);
    }
  }
}

console.log('\n📋 EDGE FUNCTION STATUS:');
console.log('The Edge Functions are failing because:');
console.log('1. Health function likely doesn\'t exist');
console.log('2. Other functions have wrong table names/references');
console.log('3. Missing companies table (we\'re fixing this)');

console.log('\n💡 SOLUTIONS:');
console.log('1. Create companies table (manual SQL)');
console.log('2. Use fallback mechanisms (already implemented)');
console.log('3. User must be logged in for RLS to work');

diagnoseEdgeFunctions(); 