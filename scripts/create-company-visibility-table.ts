/**
 * Script om company_visibility tabel aan te maken via Supabase client
 * Run dit met: npx tsx scripts/create-company-visibility-table.ts
 * 
 * Let op: Dit vereist dat je SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY hebt ingesteld
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCompanyVisibilityTable() {
  console.log('Creating company_visibility table...');

  try {
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('company_visibility')
      .select('id')
      .limit(1);

    if (existingTable && !checkError) {
      console.log('✅ Table company_visibility already exists!');
      return;
    }

    // Create table via SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.company_visibility (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recruitee_company_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES auth.users(id),
        UNIQUE(recruitee_company_id, company_name)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      // Try direct SQL execution
      console.log('Trying alternative method...');
      throw createError;
    }

    console.log('✅ Table created successfully!');
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
    console.error('\n⚠️  This script requires direct database access.');
    console.error('Please create the table manually via Supabase Dashboard Table Editor.');
    console.error('See SUPABASE_TABLE_SETUP.md for instructions.');
    process.exit(1);
  }
}

createCompanyVisibilityTable();

