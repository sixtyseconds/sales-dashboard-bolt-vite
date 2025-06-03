#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function debugSpecificDeals() {
  try {
    console.log('🔍 Debugging specific deals...\n');
    
    await client.connect();

    // Get the specific deals that are failing
    const targetDeals = ['Founder Benefits', 'Empauher', 'Marticulate'];
    
    for (const dealName of targetDeals) {
      console.log(`🔍 Debugging deal: ${dealName}`);
      
      // Get the deal with its primary_contact_id
      const dealResult = await client.query(`
        SELECT id, name, primary_contact_id, contact_email, company_id
        FROM deals 
        WHERE name ILIKE $1
        LIMIT 1;
      `, [`%${dealName}%`]);
      
      if (dealResult.rows.length === 0) {
        console.log(`  ❌ Deal not found: ${dealName}\n`);
        continue;
      }
      
      const deal = dealResult.rows[0];
      console.log(`  📋 Deal ID: ${deal.id}`);
      console.log(`  📋 Primary Contact ID: ${deal.primary_contact_id}`);
      console.log(`  📋 Contact Email: ${deal.contact_email}`);
      console.log(`  📋 Company ID: ${deal.company_id}`);
      
      // Try to find the contact by primary_contact_id
      if (deal.primary_contact_id) {
        const contactResult = await client.query(`
          SELECT id, first_name, last_name, full_name, email, phone, title
          FROM contacts 
          WHERE id = $1;
        `, [deal.primary_contact_id]);
        
        if (contactResult.rows.length > 0) {
          console.log(`  ✅ Contact FOUND:`, contactResult.rows[0]);
        } else {
          console.log(`  ❌ Contact NOT FOUND with ID: ${deal.primary_contact_id}`);
          
          // Try to find contacts with matching email
          const emailContactResult = await client.query(`
            SELECT id, first_name, last_name, full_name, email, phone, title
            FROM contacts 
            WHERE email = $1;
          `, [deal.contact_email]);
          
          if (emailContactResult.rows.length > 0) {
            console.log(`  💡 Found contact with matching email:`, emailContactResult.rows[0]);
            console.log(`  🔧 We should update the deal to link to this contact!`);
          } else {
            console.log(`  ❌ No contact found with email: ${deal.contact_email}`);
          }
        }
      }
      
      console.log(''); // Empty line for readability
    }

    // Quick fix: Update deals to link to contacts with matching emails
    console.log('🔧 Attempting to fix contact links by email matching...');
    
    const fixResult = await client.query(`
      UPDATE deals 
      SET primary_contact_id = c.id
      FROM contacts c
      WHERE deals.contact_email = c.email 
        AND deals.primary_contact_id != c.id
        AND deals.contact_email IS NOT NULL
        AND c.email IS NOT NULL;
    `);
    
    console.log(`✅ Fixed ${fixResult.rowCount} deal-contact links!`);

    // Test one more time
    console.log('\n🧪 Testing after fix...');
    const testDeal = await client.query(`
      SELECT d.name, d.primary_contact_id, c.full_name, c.email
      FROM deals d
      JOIN contacts c ON d.primary_contact_id = c.id
      WHERE d.name ILIKE '%Founder Benefits%'
      LIMIT 1;
    `);
    
    if (testDeal.rows.length > 0) {
      console.log('✅ Test successful:', testDeal.rows[0]);
    } else {
      console.log('❌ Test still failing');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

debugSpecificDeals().catch(console.error); 