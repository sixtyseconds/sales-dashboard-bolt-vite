#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client with service role (admin permissions)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabaseImport() {
  try {
    console.log('🔍 VERIFYING SUPABASE IMPORT STATUS');
    console.log('=' + '='.repeat(40));
    
    // Check companies
    console.log('\n🏢 COMPANIES:');
    const { data: companies, error: companiesError, count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    if (companiesError) {
      console.error('❌ Companies table error:', companiesError.message);
    } else {
      console.log(`✅ Companies: ${companiesCount || 0} records`);
      
      // Check sample data
      const { data: sampleCompanies } = await supabase
        .from('companies')
        .select('name, domain, industry, phone')
        .limit(3);
      
      if (sampleCompanies && sampleCompanies.length > 0) {
        console.log('📋 Sample companies:');
        console.table(sampleCompanies);
      }
    }
    
    // Check contacts
    console.log('\n📞 CONTACTS:');
    const { data: contacts, error: contactsError, count: contactsCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
    
    if (contactsError) {
      console.error('❌ Contacts table error:', contactsError.message);
    } else {
      console.log(`✅ Contacts: ${contactsCount || 0} records`);
      
      // Check sample data
      const { data: sampleContacts } = await supabase
        .from('contacts')
        .select('full_name, email, phone, title')
        .limit(3);
      
      if (sampleContacts && sampleContacts.length > 0) {
        console.log('📋 Sample contacts:');
        console.table(sampleContacts);
      }
    }
    
    // Check deal stages
    console.log('\n🎯 DEAL STAGES:');
    const { data: stages, error: stagesError, count: stagesCount } = await supabase
      .from('deal_stages')
      .select('*', { count: 'exact', head: true });
    
    if (stagesError) {
      console.error('❌ Deal stages table error:', stagesError.message);
    } else {
      console.log(`✅ Deal stages: ${stagesCount || 0} records`);
      
      // Show all stages
      const { data: allStages } = await supabase
        .from('deal_stages')
        .select('name, position, is_closed')
        .order('position');
      
      if (allStages && allStages.length > 0) {
        console.log('📋 Deal stages:');
        console.table(allStages);
      }
    }
    
    // Check deals
    console.log('\n💼 DEALS:');
    const { data: deals, error: dealsError, count: dealsCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });
    
    if (dealsError) {
      console.error('❌ Deals table error:', dealsError.message);
    } else {
      console.log(`✅ Deals: ${dealsCount || 0} records`);
      
      // Check relationships
      const { data: dealsWithRelationships } = await supabase
        .from('deals')
        .select(`
          name,
          value,
          companies(name),
          contacts(full_name, email)
        `)
        .limit(3);
      
      if (dealsWithRelationships && dealsWithRelationships.length > 0) {
        console.log('📋 Sample deals with relationships:');
        console.table(dealsWithRelationships);
      }
    }
    
    // Check activities
    console.log('\n📊 ACTIVITIES:');
    const { data: activities, error: activitiesError, count: activitiesCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });
    
    if (activitiesError) {
      console.error('❌ Activities table error:', activitiesError.message);
    } else {
      console.log(`✅ Activities: ${activitiesCount || 0} records`);
      
      // Check activity relationships
      const { data: activitiesWithRelationships } = await supabase
        .from('activities')
        .select(`
          client_name,
          type,
          status,
          contacts(full_name, email),
          deals(name)
        `)
        .not('contact_id', 'is', null)
        .limit(3);
      
      if (activitiesWithRelationships && activitiesWithRelationships.length > 0) {
        console.log('📋 Sample activities with relationships:');
        console.table(activitiesWithRelationships);
      }
    }
    
    // Summary
    console.log('\n📊 IMPORT SUMMARY:');
    const summary = {
      companies: companiesCount || 0,
      contacts: contactsCount || 0,
      deal_stages: stagesCount || 0,
      deals: dealsCount || 0,
      activities: activitiesCount || 0
    };
    console.table(summary);
    
    // Check for missing relationships
    console.log('\n🔍 RELATIONSHIP HEALTH CHECK:');
    
    // Contacts without companies
    const { count: contactsWithoutCompanies } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .is('company_id', null);
    
    // Deals without contacts
    const { count: dealsWithoutContacts } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .is('primary_contact_id', null);
    
    // Activities without contacts
    const { count: activitiesWithoutContacts } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .is('contact_id', null);
    
    const healthCheck = {
      'Contacts without companies': contactsWithoutCompanies || 0,
      'Deals without primary contacts': dealsWithoutContacts || 0,
      'Activities without contact links': activitiesWithoutContacts || 0
    };
    console.table(healthCheck);
    
    console.log('\n✅ VERIFICATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifySupabaseImport(); 