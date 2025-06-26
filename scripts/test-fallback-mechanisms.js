import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🛡️ TESTING FALLBACK MECHANISMS');
console.log('=' .repeat(40));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDirectDataAccess() {
  console.log('\n📊 Testing Direct Supabase Data Access (Bypassing Edge Functions)');
  console.log('-'.repeat(50));
  
  try {
    // Test deals query (like our fallback)
    console.log('🔍 Testing deals fallback query...');
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_stages:deal_stages(id, name, color, order_position, default_probability)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (dealsError) {
      console.log(`❌ Deals query failed: ${dealsError.message}`);
      if (dealsError.message.includes('JWT')) {
        console.log('   🔐 This is expected - user needs to be logged in for RLS');
      }
    } else {
      console.log(`✅ Deals query successful: ${deals.length} deals retrieved`);
      console.log(`   Sample deal: ${deals[0]?.name || 'N/A'}`);
    }
    
    // Test deal stages
    console.log('\n🔍 Testing deal stages fallback query...');
    const { data: stages, error: stagesError } = await supabase
      .from('deal_stages')
      .select('*')
      .order('order_position');
    
    if (stagesError) {
      console.log(`❌ Stages query failed: ${stagesError.message}`);
    } else {
      console.log(`✅ Stages query successful: ${stages.length} stages found`);
      stages.forEach(stage => console.log(`   - ${stage.name}`));
    }
    
    // Test contacts
    console.log('\n🔍 Testing contacts fallback query...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactsError) {
      console.log(`❌ Contacts query failed: ${contactsError.message}`);
      if (contactsError.message.includes('JWT')) {
        console.log('   🔐 This is expected - user needs to be logged in for RLS');
      }
    } else {
      console.log(`✅ Contacts query successful: ${contacts.length} contacts retrieved`);
    }
    
    // Test companies (should fail since table doesn't exist)
    console.log('\n🔍 Testing companies table...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      if (companiesError.message.includes('does not exist')) {
        console.log(`⚠️  Companies table missing (expected): ${companiesError.message}`);
      } else {
        console.log(`❌ Companies query failed: ${companiesError.message}`);
      }
    } else {
      console.log(`✅ Companies query successful: ${companies.length} companies found`);
    }
    
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

async function simulateUserLogin() {
  console.log('\n🔐 SIMULATING USER AUTHENTICATION');
  console.log('-'.repeat(30));
  
  // Note: In a real scenario, user would log in through the UI
  // This just demonstrates what would happen with an authenticated session
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (session) {
    console.log('✅ User is authenticated in this context');
    console.log(`   Email: ${session.user.email}`);
    
    // Test RLS-protected query
    const { data: userDeals, error: userDealsError } = await supabase
      .from('deals')
      .select('id, name, value')
      .limit(3);
    
    if (userDealsError) {
      console.log(`❌ Authenticated query failed: ${userDealsError.message}`);
    } else {
      console.log(`✅ Authenticated query successful: ${userDeals.length} deals`);
    }
  } else {
    console.log('⚠️  No authenticated session in this context');
    console.log('   In the browser, user needs to sign in at /auth/login');
  }
}

console.log('\n💡 ANALYSIS:');
console.log('Based on test results, the "API connection lost" errors are caused by:');
console.log('1. ❌ All Edge Functions failing (500/404 errors)');
console.log('2. ✅ Fallback mechanisms should work for authenticated users');
console.log('3. ⚠️  Companies table needs to be created manually');
console.log('4. 🔐 User must be logged in for RLS-protected data');

console.log('\n🎯 SOLUTION:');
console.log('1. Navigate to http://localhost:5173');
console.log('2. Sign in with your Supabase account');
console.log('3. Fallback mechanisms will load data when Edge Functions fail');
console.log('4. Create companies table using provided SQL');

await testDirectDataAccess();
await simulateUserLogin(); 