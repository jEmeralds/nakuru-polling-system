require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function listAllTables() {
  try {
    // List of potential tables to check
    const tablesToCheck = [
      'users',
      'polls', 
      'poll_responses',
      'candidates',
      'elections',
      'positions',
      'counties',
      'constituencies', 
      'wards',
      'issues',
      'categories',
      'comments',
      'locations'
    ];

    console.log('\n📊 CHECKING TABLES:\n');

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ ${table} - EXISTS`);
        if (data && data.length > 0) {
          console.log('   Columns:', Object.keys(data[0]).join(', '));
        }
      } else {
        console.log(`❌ ${table} - NOT FOUND`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAllTables();