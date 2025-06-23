import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEmptyDetails() {
  console.log('🔍 Starting to fix empty details in activities...');
  
  try {
    // Find all activities with empty or null details
    const { data: activitiesWithEmptyDetails, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .or('details.is.null,details.eq.')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Error fetching activities: ${fetchError.message}`);
    }

    console.log(`📊 Found ${activitiesWithEmptyDetails.length} activities with empty details`);

    if (activitiesWithEmptyDetails.length === 0) {
      console.log('✅ No activities need fixing!');
      return;
    }

    // Group activities by type
    const activitiesByType = activitiesWithEmptyDetails.reduce((acc, activity) => {
      if (!acc[activity.type]) acc[activity.type] = [];
      acc[activity.type].push(activity);
      return acc;
    }, {});

    console.log('📋 Activities by type:');
    Object.entries(activitiesByType).forEach(([type, activities]) => {
      console.log(`  ${type}: ${activities.length} activities`);
    });

    let totalUpdated = 0;

    // Update meeting activities with discovery details
    if (activitiesByType.meeting && activitiesByType.meeting.length > 0) {
      console.log(`\n🔄 Updating ${activitiesByType.meeting.length} meeting activities...`);
      
      for (const activity of activitiesByType.meeting) {
        // Set a default meeting type - you can customize this logic
        let newDetails = 'Discovery Call'; // Default to Discovery Call
        
        // You could add more sophisticated logic here based on:
        // - client_name patterns
        // - date ranges 
        // - other activity context
        
        console.log(`  Updating activity ${activity.id}: "${activity.client_name}" -> "${newDetails}"`);
        
        const { error: updateError } = await supabase
          .from('activities')
          .update({ details: newDetails })
          .eq('id', activity.id);
          
        if (updateError) {
          console.error(`    ❌ Error updating activity ${activity.id}:`, updateError.message);
        } else {
          console.log(`    ✅ Updated activity ${activity.id}`);
          totalUpdated++;
        }
      }
    }

    // Update outbound activities 
    if (activitiesByType.outbound && activitiesByType.outbound.length > 0) {
      console.log(`\n🔄 Updating ${activitiesByType.outbound.length} outbound activities...`);
      
      for (const activity of activitiesByType.outbound) {
        let newDetails = 'Call'; // Default to Call
        
        console.log(`  Updating activity ${activity.id}: "${activity.client_name}" -> "${newDetails}"`);
        
        const { error: updateError } = await supabase
          .from('activities')
          .update({ details: newDetails })
          .eq('id', activity.id);
          
        if (updateError) {
          console.error(`    ❌ Error updating activity ${activity.id}:`, updateError.message);
        } else {
          console.log(`    ✅ Updated activity ${activity.id}`);
          totalUpdated++;
        }
      }
    }

    // Update proposal activities
    if (activitiesByType.proposal && activitiesByType.proposal.length > 0) {
      console.log(`\n🔄 Updating ${activitiesByType.proposal.length} proposal activities...`);
      
      for (const activity of activitiesByType.proposal) {
        let newDetails = 'Proposal Sent'; // Default details
        
        console.log(`  Updating activity ${activity.id}: "${activity.client_name}" -> "${newDetails}"`);
        
        const { error: updateError } = await supabase
          .from('activities')
          .update({ details: newDetails })
          .eq('id', activity.id);
          
        if (updateError) {
          console.error(`    ❌ Error updating activity ${activity.id}:`, updateError.message);
        } else {
          console.log(`    ✅ Updated activity ${activity.id}`);
          totalUpdated++;
        }
      }
    }

    // Update sale activities
    if (activitiesByType.sale && activitiesByType.sale.length > 0) {
      console.log(`\n🔄 Updating ${activitiesByType.sale.length} sale activities...`);
      
      for (const activity of activitiesByType.sale) {
        let newDetails = 'One-off Sale'; // Default details
        
        console.log(`  Updating activity ${activity.id}: "${activity.client_name}" -> "${newDetails}"`);
        
        const { error: updateError } = await supabase
          .from('activities')
          .update({ details: newDetails })
          .eq('id', activity.id);
          
        if (updateError) {
          console.error(`    ❌ Error updating activity ${activity.id}:`, updateError.message);
        } else {
          console.log(`    ✅ Updated activity ${activity.id}`);
          totalUpdated++;
        }
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total activities updated: ${totalUpdated}/${activitiesWithEmptyDetails.length}`);
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const { data: remainingEmptyDetails, error: verifyError } = await supabase
      .from('activities')
      .select('id, type, details')
      .or('details.is.null,details.eq.');

    if (verifyError) {
      console.error('Error verifying fix:', verifyError.message);
    } else {
      console.log(`📊 Remaining activities with empty details: ${remainingEmptyDetails.length}`);
      if (remainingEmptyDetails.length === 0) {
        console.log('✅ All activities now have proper details!');
      } else {
        console.log('❌ Some activities still have empty details:');
        remainingEmptyDetails.forEach(activity => {
          console.log(`  - ${activity.id} (${activity.type}): "${activity.details}"`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
fixEmptyDetails()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }); 