import { createClient } from '@supabase/supabase-js';

// Test script to verify expected_close_date column functionality
async function testExpectedCloseDate() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Testing expected_close_date column functionality...\n');

  try {
    // 1. Check if the column exists in the schema
    console.log('1. Checking deals table schema...');
    const { data: tableInfo, error: schemaError } = await supabase
      .from('deals')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }
    
    console.log('✅ Deals table accessible');

    // 2. Try to fetch deals with expected_close_date
    console.log('\n2. Fetching deals with expected_close_date field...');
    const { data: deals, error: fetchError } = await supabase
      .from('deals')
      .select('id, name, expected_close_date')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Fetch with expected_close_date failed:', fetchError.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${deals?.length || 0} deals with expected_close_date`);
    if (deals && deals.length > 0) {
      console.log('Sample deal:', {
        id: deals[0].id,
        name: deals[0].name,
        expected_close_date: deals[0].expected_close_date
      });
    }

    // 3. Try to create a test deal with expected_close_date
    console.log('\n3. Testing deal creation with expected_close_date...');
    const testDeal = {
      name: 'Test Deal - Expected Close Date',
      company: 'Test Company',
      value: 1000,
      stage_id: '550e8400-e29b-41d4-a716-446655440000', // You may need to adjust this
      owner_id: '550e8400-e29b-41d4-a716-446655440001', // You may need to adjust this
      expected_close_date: '2024-12-31',
      status: 'active'
    };

    const { data: newDeal, error: createError } = await supabase
      .from('deals')
      .insert(testDeal)
      .select()
      .single();
    
    if (createError) {
      console.warn('⚠️ Test deal creation failed (this might be expected):', createError.message);
    } else {
      console.log('✅ Test deal created successfully with expected_close_date');
      
      // 4. Try to update the expected_close_date
      console.log('\n4. Testing expected_close_date update...');
      const { data: updatedDeal, error: updateError } = await supabase
        .from('deals')
        .update({ expected_close_date: '2025-01-15' })
        .eq('id', newDeal.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Update expected_close_date failed:', updateError.message);
      } else {
        console.log('✅ Expected close date updated successfully');
        console.log('Updated deal:', {
          id: updatedDeal.id,
          name: updatedDeal.name,
          expected_close_date: updatedDeal.expected_close_date
        });
      }
      
      // Clean up: delete the test deal
      console.log('\n5. Cleaning up test deal...');
      const { error: deleteError } = await supabase
        .from('deals')
        .delete()
        .eq('id', newDeal.id);
      
      if (deleteError) {
        console.warn('⚠️ Failed to delete test deal:', deleteError.message);
      } else {
        console.log('✅ Test deal cleaned up successfully');
      }
    }

    console.log('\n🎉 Expected close date column test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

// Run the test
testExpectedCloseDate(); 