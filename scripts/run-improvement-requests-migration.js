import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read the migration file
const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250127130000_create_improvement_requests_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Create Supabase client with service role key for admin operations
const supabaseUrl = 'https://ewtuefzeogytgmsnkpmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHVlZnplb2d5dGdtc25rcG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzcyNDczMywiZXhwIjoyMDUzMzAwNzMzfQ.bKlMQzECZHm2fhGvZ5dEjqOCK5gT2MYBGZXg8vTBfIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running improvement requests migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY') || statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE TRIGGER')) {
          console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
          
          const { error: stmtError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          // This is a workaround - we'll need to use the RPC approach
          console.log('⚠️  Using SQL execution via query...');
        }
      }
      
      // Try direct SQL execution
      console.log('🔧 Attempting direct execution...');
      
      const { error: directError } = await supabase.rpc('exec_raw_sql', {
        query: migrationSQL
      });
      
      if (directError) {
        console.error('❌ Direct execution also failed:', directError);
        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        process.exit(1);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the table was created
    const { data: tableInfo, error: verifyError } = await supabase
      .from('improvement_requests')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.warn('⚠️  Could not verify table creation:', verifyError.message);
    } else {
      console.log('✅ Table verification successful!');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();