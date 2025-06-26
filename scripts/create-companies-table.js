import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function createCompaniesTable() {
  console.log('🚀 Creating companies table in Supabase...');
  
  try {
    // Try to query the companies table to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ Companies table already exists!');
      console.log(`Found ${testData?.length || 0} records in companies table`);
      return;
    }

    if (testError && !testError.message.includes('does not exist')) {
      console.error('❌ Unexpected error checking companies table:', testError);
      return;
    }

    console.log('📋 Companies table does not exist. Creating...');

    // Create the companies table using raw SQL
    const { error: createError } = await supabase
      .from('_supabase_migrations')
      .upsert({
        version: '20250127120000',
        name: 'create_companies_table',
        statements: [
          `CREATE TABLE companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            domain TEXT UNIQUE,
            industry TEXT,
            size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
            website TEXT,
            address TEXT,
            phone TEXT,
            description TEXT,
            linkedin_url TEXT,
            owner_id UUID REFERENCES profiles(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          `CREATE INDEX idx_companies_domain ON companies(domain);`,
          `CREATE INDEX idx_companies_owner_id ON companies(owner_id);`,
          `CREATE INDEX idx_companies_name ON companies(name);`,
          `CREATE OR REPLACE FUNCTION update_updated_at_column()
           RETURNS TRIGGER AS $$
           BEGIN
             NEW.updated_at = NOW();
             RETURN NEW;
           END;
           $$ language 'plpgsql';`,
          `CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
          `ALTER TABLE companies ENABLE ROW LEVEL SECURITY;`,
          `CREATE POLICY "Users can view their own companies" ON companies
           FOR SELECT USING (auth.uid() = owner_id);`,
          `CREATE POLICY "Users can insert their own companies" ON companies
           FOR INSERT WITH CHECK (auth.uid() = owner_id);`,
          `CREATE POLICY "Users can update their own companies" ON companies
           FOR UPDATE USING (auth.uid() = owner_id);`,
          `CREATE POLICY "Users can delete their own companies" ON companies
           FOR DELETE USING (auth.uid() = owner_id);`
        ]
      });

    // Try direct SQL approach instead
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        domain TEXT UNIQUE,
        industry TEXT,
        size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
        website TEXT,
        address TEXT,
        phone TEXT,
        description TEXT,
        linkedin_url TEXT,
        owner_id UUID REFERENCES profiles(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
      CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
      CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
      CREATE POLICY "Users can view their own companies" ON companies
        FOR SELECT USING (auth.uid() = owner_id);

      DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
      CREATE POLICY "Users can insert their own companies" ON companies
        FOR INSERT WITH CHECK (auth.uid() = owner_id);

      DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
      CREATE POLICY "Users can update their own companies" ON companies
        FOR UPDATE USING (auth.uid() = owner_id);

      DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;
      CREATE POLICY "Users can delete their own companies" ON companies
        FOR DELETE USING (auth.uid() = owner_id);
    `;

    console.log('📝 Executing SQL to create companies table...');
    
    // Execute the SQL directly using the SQL editor approach
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (sqlError) {
      console.error('❌ Error creating companies table via RPC:', sqlError);
      console.log('💡 Please run this SQL manually in the Supabase SQL editor:');
      console.log('---');
      console.log(createTableSQL);
      console.log('---');
      return;
    }

    console.log('✅ Companies table created successfully!');
    
    // Test the table
    const { data: finalTestData, error: finalTestError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (finalTestError) {
      console.error('❌ Error testing companies table:', finalTestError);
    } else {
      console.log('✅ Companies table test successful!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('💡 Please create the companies table manually in Supabase SQL editor.');
  }
}

createCompaniesTable(); 