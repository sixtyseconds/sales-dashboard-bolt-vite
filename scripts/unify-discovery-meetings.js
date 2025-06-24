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

async function unifyDiscoveryMeetings() {
  console.log('🔍 Searching for meeting activities with inconsistent discovery details...');

  const { data: meetings, error } = await supabase
    .from('activities')
    .select('id, details')
    .eq('type', 'meeting')
    .ilike('details', '%discovery%');

  if (error) {
    console.error('Error fetching meetings:', error.message);
    process.exit(1);
  }

  if (!meetings || meetings.length === 0) {
    console.log('✅ No inconsistent discovery meetings found.');
    return;
  }

  console.log(`📊 Found ${meetings.length} activities to update.`);

  const ids = meetings.map((m) => m.id);

  const { error: updateError } = await supabase
    .from('activities')
    .update({ details: 'Discovery Call' })
    .in('id', ids);

  if (updateError) {
    console.error('Error updating meetings:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Updated ${ids.length} meeting activities to "Discovery Call".`);
}

unifyDiscoveryMeetings()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  }); 