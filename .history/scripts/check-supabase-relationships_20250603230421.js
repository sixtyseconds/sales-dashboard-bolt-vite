import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseRelationships() {
  try {
    console.log('🔧 Checking Supabase contact-company relationships...');
    
    // Step 1: Test basic contact fetch
    console.log('\n📱 Testing basic contact fetch...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(3);
    
    if (contactsError) {
      console.error('❌ Failed to fetch contacts:', contactsError.message);
      return;
    }
    
    console.log(`✅ Found ${contacts?.length || 0} contacts`);
    if (contacts && contacts.length > 0) {
      console.table(contacts.slice(0, 2).map(c => ({
        id: c.id?.substring(0, 8),
        email: c.email,
        company_id: c.company_id?.substring(0, 8) || 'null',
        full_name: c.full_name || 'null'
      })));
    }
    
    // Step 2: Test companies table
    console.log('\n🏢 Testing companies table...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(3);
    
    if (companiesError) {
      console.error('❌ Failed to fetch companies:', companiesError.message);
      console.log('💡 Companies table might not exist. This is expected for some setups.');
    } else {
      console.log(`✅ Found ${companies?.length || 0} companies`);
      if (companies && companies.length > 0) {
        console.table(companies.slice(0, 2).map(c => ({
          id: c.id?.substring(0, 8),
          name: c.name,
          domain: c.domain
        })));
      }
    }
    
    // Step 3: Test the problematic relationship query
    console.log('\n🔗 Testing contact with company relationship...');
    try {
      const { data: contactWithCompany, error: relationshipError } = await supabase
        .from('contacts')
        .select(`
          *,
          companies(*)
        `)
        .limit(1)
        .single();
      
      if (relationshipError) {
        console.error('❌ Relationship query failed:', relationshipError.message);
        console.log('🔧 This confirms the relationship issue we need to work around.');
      } else {
        console.log('✅ Relationship query succeeded!');
        console.log('Sample data:', {
          contact_email: contactWithCompany?.email,
          company_name: contactWithCompany?.companies?.name || 'No company'
        });
      }
    } catch (err) {
      console.error('❌ Relationship test error:', err.message);
    }
    
    // Step 4: Test the manual join approach (our workaround)
    console.log('\n🔧 Testing manual join approach...');
    if (contacts && contacts.length > 0) {
      const sampleContact = contacts[0];
      
      if (sampleContact.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', sampleContact.company_id)
          .single();
        
        if (companyError) {
          console.log('⚠️ Manual company fetch failed:', companyError.message);
        } else {
          console.log('✅ Manual join approach works!');
          console.log('Combined data:', {
            contact: sampleContact.email,
            company: company?.name || 'No company'
          });
        }
      } else {
        console.log('ℹ️ Sample contact has no company_id, trying to find one with company_id...');
        
        const { data: contactWithCompanyId, error: searchError } = await supabase
          .from('contacts')
          .select('*')
          .not('company_id', 'is', null)
          .limit(1)
          .single();
        
        if (!searchError && contactWithCompanyId) {
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', contactWithCompanyId.company_id)
            .single();
          
          if (!companyError && company) {
            console.log('✅ Manual join approach works with linked contact!');
            console.log('Combined data:', {
              contact: contactWithCompanyId.email,
              company: company.name
            });
          }
        } else {
          console.log('ℹ️ No contacts found with company_id. This is normal for new setups.');
        }
      }
    }
    
    // Step 5: Summary and recommendations
    console.log('\n📋 Summary:');
    console.log('✅ Basic contact fetching works');
    console.log(`${companies ? '✅' : '⚠️'} Companies table ${companies ? 'accessible' : 'needs setup'}`);
    console.log('✅ Manual join workaround implemented in ContactService');
    
    console.log('\n💡 Next steps:');
    console.log('1. The contact record page should now work with the manual join approach');
    console.log('2. If you need the automatic relationship, check Supabase dashboard for foreign keys');
    console.log('3. Try visiting a contact record page to test the fix');
    
  } catch (error) {
    console.error('❌ Check script failed:', error.message);
  }
}

// Run the check
checkSupabaseRelationships(); 