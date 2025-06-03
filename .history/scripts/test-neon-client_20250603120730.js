#!/usr/bin/env node

// Test the new Neon client to make sure it works before testing the React app
import { neonClient } from '../src/lib/database/neonClient.js';

async function testNeonClient() {
  try {
    console.log('🧪 Testing Neon client...');
    
    // Test 1: Mock user
    console.log('\n👤 Testing mock user:');
    const mockUser = neonClient.getMockUser();
    console.table(mockUser);
    
    // Test 2: Companies
    console.log('\n🏢 Testing companies query:');
    const companiesResult = await neonClient.getCompanies({
      includeStats: true,
      limit: 3
    });
    
    console.log(`✅ Found ${companiesResult.data.length} companies`);
    console.table(companiesResult.data);
    
    // Test 3: Deals with relationships
    console.log('\n📊 Testing deals with CRM relationships:');
    const dealsResult = await neonClient.getDealsWithRelationships('dev-user-123');
    
    console.log(`✅ Found ${dealsResult.data.length} deals`);
    console.table(dealsResult.data.slice(0, 3).map(deal => ({
      id: deal.id.slice(0, 8) + '...',
      name: deal.name,
      value: deal.value,
      company: deal.companies ? deal.companies.name : deal.company,
      contact: deal.contacts ? deal.contacts.full_name : deal.contact_name,
      stage: deal.deal_stages ? deal.deal_stages.name : 'Unknown',
      daysInStage: deal.daysInStage
    })));
    
    console.log('\n🎉 All tests passed! Neon client is working correctly.');
    console.log('✅ Ready to test the React app at http://localhost:5175');
    console.log('✅ CRM Companies page should work at http://localhost:5175/companies');
    
  } catch (error) {
    console.error('❌ Neon client test failed:', error);
  } finally {
    await neonClient.disconnect();
  }
}

testNeonClient(); 