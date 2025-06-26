#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Supabase client with service role (admin permissions)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Neon client (where our data is)
const neonClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function importMissingData() {
  try {
    console.log('🚀 IMPORTING MISSING DATA TO SUPABASE');
    console.log('=' + '='.repeat(40));
    
    // Connect to Neon
    await neonClient.connect();
    
    // Step 1: Import Companies with missing details
    console.log('\n🏢 Step 1: Importing company data...');
    await importCompanyData();
    
    // Step 2: Import Contacts with missing details  
    console.log('\n📞 Step 2: Importing contact data...');
    await importContactData();
    
    // Step 3: Create missing contacts from activities
    console.log('\n👥 Step 3: Creating contacts from activity data...');
    await createContactsFromActivities();
    
    // Step 4: Update deal relationships
    console.log('\n💼 Step 4: Fixing deal relationships...');
    await fixDealRelationships();
    
    // Step 5: Populate missing contact details from deals
    console.log('\n📋 Step 5: Populating contact details from deals...');
    await populateContactDetailsFromDeals();
    
    console.log('\n✅ MIGRATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonClient.end();
  }
}

async function importCompanyData() {
  try {
    // Get companies from Neon
    const companiesResult = await neonClient.query(`
      SELECT 
        id,
        name,
        domain,
        industry,
        size,
        website,
        address,
        phone,
        description,
        linkedin_url,
        owner_id,
        created_at,
        updated_at
      FROM companies
      ORDER BY created_at
    `);
    
    console.log(`Found ${companiesResult.rows.length} companies in Neon`);
    
    // Insert companies to Supabase in batches
    const batchSize = 50;
    let importedCount = 0;
    let errors = 0;
    
    for (let i = 0; i < companiesResult.rows.length; i += batchSize) {
      const batch = companiesResult.rows.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('companies')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        errors++;
      } else {
        importedCount += batch.length;
        console.log(`✅ Imported companies batch ${Math.floor(i/batchSize) + 1}`);
      }
    }
    
    console.log(`📊 Companies: ${importedCount} imported, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Company import failed:', error.message);
  }
}

async function importContactData() {
  try {
    // Get contacts from Neon
    const contactsResult = await neonClient.query(`
      SELECT 
        id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        title,
        company_id,
        owner_id,
        linkedin_url,
        is_primary,
        notes,
        created_at,
        updated_at
      FROM contacts
      ORDER BY created_at
    `);
    
    console.log(`Found ${contactsResult.rows.length} contacts in Neon`);
    
    // Insert contacts to Supabase in batches
    const batchSize = 50;
    let importedCount = 0;
    let errors = 0;
    
    for (let i = 0; i < contactsResult.rows.length; i += batchSize) {
      const batch = contactsResult.rows.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('contacts')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Contacts batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        errors++;
      } else {
        importedCount += batch.length;
        console.log(`✅ Imported contacts batch ${Math.floor(i/batchSize) + 1}`);
      }
    }
    
    console.log(`📊 Contacts: ${importedCount} imported, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Contact import failed:', error.message);
  }
}

async function createContactsFromActivities() {
  try {
    // Get unmapped activities with client names and contact identifiers
    const unmappedActivities = await neonClient.query(`
      SELECT DISTINCT
        client_name,
        contact_identifier,
        contact_identifier_type,
        user_id as owner_id
      FROM activities 
      WHERE client_name IS NOT NULL 
        AND client_name != ''
        AND client_name != 'Unknown'
        AND contact_id IS NULL
        AND contact_identifier IS NOT NULL
        AND contact_identifier != ''
      ORDER BY client_name
    `);
    
    console.log(`Found ${unmappedActivities.rows.length} potential contacts from activities`);
    
    let createdCount = 0;
    let errors = 0;
    
    for (const activity of unmappedActivities.rows) {
      try {
        // Check if contact already exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', activity.contact_identifier)
          .single();
        
        if (existingContact) {
          continue; // Contact already exists
        }
        
        // Extract first/last name from client_name
        const nameParts = activity.client_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create new contact
        const newContact = {
          first_name: firstName,
          last_name: lastName,
          full_name: activity.client_name.trim(),
          email: activity.contact_identifier,
          owner_id: activity.owner_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('contacts')
          .insert(newContact)
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Failed to create contact for ${activity.client_name}:`, error.message);
          errors++;
        } else {
          createdCount++;
          console.log(`✅ Created contact: ${activity.client_name} (${activity.contact_identifier})`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${activity.client_name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`📊 New contacts: ${createdCount} created, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Create contacts from activities failed:', error.message);
  }
}

async function fixDealRelationships() {
  try {
    // Get deals from Neon with missing relationships but with contact info
    const dealsWithContactInfo = await neonClient.query(`
      SELECT 
        id,
        name,
        company,
        contact_name,
        contact_email,
        contact_phone,
        company_id,
        primary_contact_id
      FROM deals 
      WHERE (company_id IS NULL OR primary_contact_id IS NULL)
        AND contact_email IS NOT NULL
        AND contact_email != ''
    `);
    
    console.log(`Found ${dealsWithContactInfo.rows.length} deals needing relationship fixes`);
    
    let fixedCount = 0;
    let errors = 0;
    
    for (const deal of dealsWithContactInfo.rows) {
      try {
        // Find matching contact in Supabase
        const { data: contact } = await supabase
          .from('contacts')
          .select('id, company_id')
          .eq('email', deal.contact_email)
          .single();
        
        if (contact) {
          // Update deal in Supabase with proper relationships
          const updateData = {};
          
          if (!deal.primary_contact_id) {
            updateData.primary_contact_id = contact.id;
          }
          
          if (!deal.company_id && contact.company_id) {
            updateData.company_id = contact.company_id;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from('deals')
              .update(updateData)
              .eq('id', deal.id);
            
            if (error) {
              console.error(`❌ Failed to update deal ${deal.name}:`, error.message);
              errors++;
            } else {
              fixedCount++;
              console.log(`✅ Fixed relationships for deal: ${deal.name}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing deal ${deal.name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`📊 Deal relationships: ${fixedCount} fixed, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Fix deal relationships failed:', error.message);
  }
}

async function populateContactDetailsFromDeals() {
  try {
    // Get deals with contact details that could populate missing contact info
    const dealsWithDetails = await neonClient.query(`
      SELECT DISTINCT
        contact_email,
        contact_name,
        contact_phone,
        company
      FROM deals 
      WHERE contact_email IS NOT NULL
        AND contact_email != ''
        AND (contact_name IS NOT NULL OR contact_phone IS NOT NULL)
    `);
    
    console.log(`Found ${dealsWithDetails.rows.length} deals with contact details to populate`);
    
    let updatedCount = 0;
    let errors = 0;
    
    for (const dealContact of dealsWithDetails.rows) {
      try {
        // Find matching contact in Supabase
        const { data: contact } = await supabase
          .from('contacts')
          .select('id, phone, first_name, last_name')
          .eq('email', dealContact.contact_email)
          .single();
        
        if (contact) {
          const updateData = {};
          
          // Populate phone if missing
          if (!contact.phone && dealContact.contact_phone) {
            updateData.phone = dealContact.contact_phone;
          }
          
          // Populate names if missing and available from deal
          if (dealContact.contact_name && (!contact.first_name || !contact.last_name)) {
            const nameParts = dealContact.contact_name.trim().split(' ');
            if (!contact.first_name && nameParts[0]) {
              updateData.first_name = nameParts[0];
            }
            if (!contact.last_name && nameParts.length > 1) {
              updateData.last_name = nameParts.slice(1).join(' ');
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from('contacts')
              .update(updateData)
              .eq('id', contact.id);
            
            if (error) {
              console.error(`❌ Failed to update contact ${dealContact.contact_email}:`, error.message);
              errors++;
            } else {
              updatedCount++;
              console.log(`✅ Updated contact details: ${dealContact.contact_email}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing contact ${dealContact.contact_email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`📊 Contact details: ${updatedCount} updated, ${errors} errors`);
    
  } catch (error) {
    console.error('❌ Populate contact details failed:', error.message);
  }
}

importMissingData(); 