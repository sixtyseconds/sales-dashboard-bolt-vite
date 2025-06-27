import { createClient } from '@supabase/supabase-js';

// Check the actual schema of the deals table
async function checkDealsSchema() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking deals table schema...\n');

  try {
    // Get a sample deal to see what columns exist
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching deals:', error.message);
      return;
    }
    
    if (deals && deals.length > 0) {
      console.log('📋 Available columns in deals table:');
      const columns = Object.keys(deals[0]).sort();
             columns.forEach((column, index) => {
         console.log(`${(index + 1).toString().padStart(2)}. ${column}`);
       });
      
      console.log('\n🔍 Checking for expected_close_date specifically:');
      if (columns.includes('expected_close_date')) {
        console.log('✅ expected_close_date column EXISTS');
        console.log('Value:', deals[0].expected_close_date);
      } else {
        console.log('❌ expected_close_date column DOES NOT EXIST');
        
        // Check for similar columns
        const dateColumns = columns.filter(col => 
          col.includes('date') || col.includes('close')
        );
        if (dateColumns.length > 0) {
          console.log('\n📅 Related date/close columns found:');
          dateColumns.forEach(col => {
            console.log(`   - ${col}: ${deals[0][col]}`);
          });
        }
      }
    } else {
      console.log('ℹ️ No deals found in the table');
    }

    // Try to get table info using raw SQL query if possible
    console.log('\n🔍 Attempting to get table structure via information_schema...');
    try {
      const { data: columns, error: schemaError } = await supabase
        .rpc('sql', {
          query: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'deals' 
            ORDER BY ordinal_position;
          `
        });
      
      if (schemaError) {
        console.log('⚠️ Could not query information_schema (this is normal for security reasons)');
      } else if (columns) {
        console.log('📋 Table structure from information_schema:');
        columns.forEach(col => {
          console.log(`   ${col.column_name} (${col.data_type})`);
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC query not available (this is normal)');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkDealsSchema(); 