import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function mergeDiscoveryTypes() {
  console.log('🔍 Starting migration to merge Discovery Call and Discovery Meeting into Discovery...');

  try {
    // First, let's see how many records we need to update
    const { data: discoveryCallCount, error: callCountError } = await supabase
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('type', 'meeting')
      .eq('details', 'Discovery Call');

    const { data: discoveryMeetingCount, error: meetingCountError } = await supabase
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('type', 'meeting')
      .eq('details', 'Discovery Meeting');

    if (callCountError || meetingCountError) {
      console.error('Error counting records:', callCountError || meetingCountError);
      process.exit(1);
    }

    const totalToUpdate = (discoveryCallCount?.length || 0) + (discoveryMeetingCount?.length || 0);
    console.log(`📊 Found ${discoveryCallCount?.length || 0} "Discovery Call" records`);
    console.log(`📊 Found ${discoveryMeetingCount?.length || 0} "Discovery Meeting" records`);
    console.log(`📊 Total records to update: ${totalToUpdate}`);

    if (totalToUpdate === 0) {
      console.log('✅ No records need updating. Migration complete!');
      return;
    }

    // Update Discovery Call to Discovery
    if (discoveryCallCount && discoveryCallCount.length > 0) {
      console.log('🔄 Updating "Discovery Call" records...');
      const { error: updateCallError } = await supabase
        .from('activities')
        .update({ details: 'Discovery' })
        .eq('type', 'meeting')
        .eq('details', 'Discovery Call');

      if (updateCallError) {
        console.error('Error updating Discovery Call records:', updateCallError);
        process.exit(1);
      }
      console.log(`✅ Updated ${discoveryCallCount.length} "Discovery Call" records to "Discovery"`);
    }

    // Update Discovery Meeting to Discovery
    if (discoveryMeetingCount && discoveryMeetingCount.length > 0) {
      console.log('🔄 Updating "Discovery Meeting" records...');
      const { error: updateMeetingError } = await supabase
        .from('activities')
        .update({ details: 'Discovery' })
        .eq('type', 'meeting')
        .eq('details', 'Discovery Meeting');

      if (updateMeetingError) {
        console.error('Error updating Discovery Meeting records:', updateMeetingError);
        process.exit(1);
      }
      console.log(`✅ Updated ${discoveryMeetingCount.length} "Discovery Meeting" records to "Discovery"`);
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('activities')
      .select('details', { count: 'exact' })
      .eq('type', 'meeting')
      .in('details', ['Discovery', 'Discovery Call', 'Discovery Meeting']);

    if (verifyError) {
      console.error('Error verifying migration:', verifyError);
      process.exit(1);
    }

    const groupedResults = verifyData?.reduce((acc, item) => {
      acc[item.details] = (acc[item.details] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Final meeting type distribution:');
    Object.entries(groupedResults || {}).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    if (groupedResults?.['Discovery Call'] || groupedResults?.['Discovery Meeting']) {
      console.warn('⚠️  Warning: Some records may not have been updated');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log(`   All discovery-related meetings are now unified as "Discovery"`);
    }

  } catch (error) {
    console.error('Unexpected error during migration:', error);
    process.exit(1);
  }
}

// Add a safety check
async function confirmMigration() {
  console.log('\n⚠️  This script will merge "Discovery Call" and "Discovery Meeting" into "Discovery".');
  console.log('This action cannot be easily undone without a backup.');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
}

// Run the migration
confirmMigration()
  .then(() => mergeDiscoveryTypes())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  });