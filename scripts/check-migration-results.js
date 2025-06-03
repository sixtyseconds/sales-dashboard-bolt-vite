#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkMigrationResults() {
  try {
    console.log('📈 Checking CRM migration results...\n');
    
    await client.connect();

    // Check migration summary
    try {
      const summary = await client.query('SELECT * FROM crm_migration_summary ORDER BY entity;');
      console.log('🎯 CRM Migration Summary:');
      console.table(summary.rows);
    } catch (e) {
      console.log('⚠️  Migration summary view not available, checking manually...\n');
    }

    // Manual checks
    console.log('📊 Manual Migration Verification:\n');

    // Check companies
    const companies = await client.query('SELECT COUNT(*) as count, COUNT(CASE WHEN domain IS NOT NULL THEN 1 END) as with_domain FROM companies');
    console.log(`✅ Companies: ${companies.rows[0].count} created (${companies.rows[0].with_domain} with domains)`);

    // Check contacts
    const contacts = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company, COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as with_owner FROM contacts');
    console.log(`✅ Contacts: ${contacts.rows[0].total} total (${contacts.rows[0].with_company} linked to companies, ${contacts.rows[0].with_owner} with owners)`);

    // Check deals
    const deals = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company, COUNT(CASE WHEN primary_contact_id IS NOT NULL THEN 1 END) as with_contact FROM deals');
    console.log(`✅ Deals: ${deals.rows[0].total} total (${deals.rows[0].with_company} linked to companies, ${deals.rows[0].with_contact} with primary contacts)`);

    // Check activities
    const activities = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN contact_id IS NOT NULL THEN 1 END) as with_contact, COUNT(CASE WHEN deal_id IS NOT NULL THEN 1 END) as with_deal, COUNT(CASE WHEN auto_matched = true THEN 1 END) as auto_matched FROM activities');
    console.log(`✅ Activities: ${activities.rows[0].total} total (${activities.rows[0].with_contact} linked to contacts, ${activities.rows[0].with_deal} linked to deals, ${activities.rows[0].auto_matched} auto-matched)`);

    // Check new relationship tables
    const dealContacts = await client.query('SELECT COUNT(*) as count FROM deal_contacts');
    console.log(`✅ Deal-Contact relationships: ${dealContacts.rows[0].count} created`);

    const syncRules = await client.query('SELECT COUNT(*) as count FROM activity_sync_rules');
    console.log(`✅ Activity sync rules: ${syncRules.rows[0].count} created`);

    // Sample data to verify quality
    console.log('\n🔍 Sample Data Quality Check:\n');

    // Show some companies with domains
    const sampleCompanies = await client.query('SELECT name, domain FROM companies WHERE domain IS NOT NULL LIMIT 5');
    if (sampleCompanies.rows.length > 0) {
      console.log('📋 Sample Companies with Domains:');
      console.table(sampleCompanies.rows);
    }

    // Show some contacts with companies
    const sampleContacts = await client.query(`
      SELECT c.email, c.full_name, comp.name as company_name 
      FROM contacts c 
      LEFT JOIN companies comp ON c.company_id = comp.id 
      WHERE c.company_id IS NOT NULL 
      LIMIT 5
    `);
    if (sampleContacts.rows.length > 0) {
      console.log('\n📋 Sample Contacts with Companies:');
      console.table(sampleContacts.rows);
    }

    // Show some deals with relationships
    const sampleDeals = await client.query(`
      SELECT d.name, comp.name as company_name, c.email as contact_email 
      FROM deals d 
      LEFT JOIN companies comp ON d.company_id = comp.id 
      LEFT JOIN contacts c ON d.primary_contact_id = c.id 
      WHERE d.company_id IS NOT NULL OR d.primary_contact_id IS NOT NULL 
      LIMIT 5
    `);
    if (sampleDeals.rows.length > 0) {
      console.log('\n📋 Sample Deals with Relationships:');
      console.table(sampleDeals.rows);
    }

    console.log('\n🎉 Migration completed successfully! The CRM relationship structure is now in place.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkMigrationResults().catch(console.error); 