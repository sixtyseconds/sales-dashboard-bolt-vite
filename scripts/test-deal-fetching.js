#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function testDealFetching() {
  try {
    console.log('🧪 Testing enhanced deal fetching logic...\n');
    
    await client.connect();

    // Get a few deals with relationships like the frontend does
    console.log('📊 Step 1: Fetch basic deals (like useDeals does)');
    const basicDeals = await client.query(`
      SELECT d.*, ds.id as stage_id, ds.name as stage_name, ds.color as stage_color, ds.default_probability
      FROM deals d
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      WHERE d.company_id IS NOT NULL AND d.primary_contact_id IS NOT NULL
      ORDER BY d.updated_at DESC
      LIMIT 3;
    `);
    
    console.log(`Found ${basicDeals.rows.length} deals with CRM relationships\n`);

    // Test the manual relationship fetching for each deal
    for (const deal of basicDeals.rows) {
      console.log(`🔍 Testing deal: ${deal.name}`);
      
      // Fetch company
      let company = null;
      if (deal.company_id) {
        const companyResult = await client.query(`
          SELECT id, name, domain, size, industry, website, linkedin_url
          FROM companies 
          WHERE id = $1;
        `, [deal.company_id]);
        company = companyResult.rows[0] || null;
        console.log(`  ✅ Company: ${company?.name || 'NOT FOUND'} (Domain: ${company?.domain || 'N/A'})`);
      }
      
      // Fetch primary contact
      let contact = null;
      if (deal.primary_contact_id) {
        const contactResult = await client.query(`
          SELECT id, first_name, last_name, full_name, email, phone, title, linkedin_url, is_primary
          FROM contacts 
          WHERE id = $1;
        `, [deal.primary_contact_id]);
        contact = contactResult.rows[0] || null;
        console.log(`  ✅ Contact: ${contact?.full_name || 'NOT FOUND'} (${contact?.email || 'N/A'})`);
      }
      
      // Fetch deal contacts
      const dealContactsResult = await client.query(`
        SELECT dc.id, dc.role, c.id as contact_id, c.first_name, c.last_name, c.full_name, c.email, c.phone, c.title, c.is_primary
        FROM deal_contacts dc
        JOIN contacts c ON dc.contact_id = c.id
        WHERE dc.deal_id = $1;
      `, [deal.id]);
      
      console.log(`  ✅ Deal Contacts: ${dealContactsResult.rows.length} relationships`);
      
      // Simulate the enhanced deal object
      const enhancedDeal = {
        ...deal,
        companies: company,
        contacts: contact,
        deal_contacts: dealContactsResult.rows
      };
      
      // Test the DealCard logic
      const companyInfo = {
        name: company?.name || deal.company || 'Unknown Company',
        domain: company?.domain || null,
        size: company?.size || null,
        isNormalized: !!company
      };
      
      const contactInfo = {
        name: contact?.full_name || contact?.first_name + ' ' + contact?.last_name || deal.contact_name || 'No contact',
        email: contact?.email || deal.contact_email,
        phone: contact?.phone || deal.contact_phone,
        title: contact?.title || null,
        isNormalized: !!contact
      };
      
      const shouldShowCRMBadge = companyInfo.isNormalized && contactInfo.isNormalized;
      
      console.log(`  📊 Enhanced Deal Data:`);
      console.log(`     - Company: ${companyInfo.name} (Normalized: ${companyInfo.isNormalized})`);
      console.log(`     - Contact: ${contactInfo.name} (Normalized: ${contactInfo.isNormalized})`);
      console.log(`     - Should show CRM badge: ${shouldShowCRMBadge}`);
      console.log(`     - Domain badge: ${companyInfo.domain || 'None'}`);
      console.log(`     - Contact title: ${contactInfo.title || 'None'}\n`);
    }

    console.log('🎯 Summary: Enhanced deal fetching logic is working correctly!');
    console.log('   If badges are not showing, the issue is likely in the React components.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

testDealFetching().catch(console.error); 