#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkContactsStructure() {
  try {
    console.log('🔍 Checking existing contacts table structure...\n');
    
    await client.connect();

    // Check contacts table structure
    console.log('📊 Current contacts table structure:');
    const contactsColumns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.table(contactsColumns.rows);

    // Check if there's data in contacts
    const contactsCount = await client.query('SELECT COUNT(*) as count FROM contacts');
    console.log(`\n📈 Current contacts count: ${contactsCount.rows[0].count}`);

    // Sample a few contacts to see the data structure
    if (parseInt(contactsCount.rows[0].count) > 0) {
      console.log('\n📋 Sample contacts data:');
      const sampleContacts = await client.query('SELECT * FROM contacts LIMIT 3');
      console.table(sampleContacts.rows);
    }

    // Check existing companies table if it exists
    console.log('\n🔍 Checking if companies table exists...');
    const companiesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
      );
    `);
    
    if (companiesExists.rows[0].exists) {
      console.log('✅ Companies table exists');
      const companiesColumns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
          AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      console.table(companiesColumns.rows);
    } else {
      console.log('❌ Companies table does not exist - need to create it');
    }

    // Check for foreign key relationships
    console.log('\n🔗 Checking foreign key constraints on deals table:');
    const dealsFkeys = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'deals';
    `);
    
    if (dealsFkeys.rows.length > 0) {
      console.table(dealsFkeys.rows);
    } else {
      console.log('No foreign key constraints found on deals table');
    }

    // Check if deals has company_id or primary_contact_id columns
    console.log('\n🔍 Checking deals table for CRM relationship columns:');
    const dealsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'deals' 
        AND table_schema = 'public'
        AND column_name IN ('company_id', 'primary_contact_id')
      ORDER BY column_name;
    `);
    
    if (dealsColumns.rows.length > 0) {
      console.table(dealsColumns.rows);
    } else {
      console.log('❌ deals table missing company_id and primary_contact_id columns');
    }

    // Check activities table for relationship columns  
    console.log('\n🔍 Checking activities table for CRM relationship columns:');
    const activitiesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
        AND table_schema = 'public'
        AND column_name IN ('company_id', 'contact_id', 'deal_id', 'auto_matched')
      ORDER BY column_name;
    `);
    
    if (activitiesColumns.rows.length > 0) {
      console.table(activitiesColumns.rows);
    } else {
      console.log('❌ activities table missing CRM relationship columns');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkContactsStructure().catch(console.error); 