#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseProfiles() {
  try {
    console.log('👤 Checking profiles in Supabase database...');
    
    // Check profiles table
    const { data: profiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`📊 Found ${count} profiles in Supabase`);
      if (profiles && profiles.length > 0) {
        console.table(profiles);
      }
    }
    
    // Check if we can create companies without owner_id requirement
    console.log('\n🔧 Testing companies table creation without owner_id...');
    
    const { error: testInsert } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company',
        domain: 'test.com'
      });
    
    if (testInsert) {
      console.log('❌ Cannot insert without owner_id:', testInsert.message);
      
      // Try creating a dummy profile first
      console.log('\n👤 Attempting to create a dummy profile...');
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          first_name: 'System',
          last_name: 'User',
          email: 'system@example.com'
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Cannot create profile:', createProfileError);
      } else {
        console.log('✅ Created dummy profile:', newProfile);
      }
    } else {
      console.log('✅ Companies can be created without owner_id');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSupabaseProfiles(); 