require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function showStructures() {
  try {
    console.log('\n📊 CANDIDATES TABLE:');
    const { data: candidates } = await supabase.from('candidates').select('*').limit(1);
    if (candidates && candidates.length > 0) {
      console.log(JSON.stringify(candidates[0], null, 2));
    }

    console.log('\n📊 POLLS TABLE:');
    const { data: polls } = await supabase.from('polls').select('*').limit(1);
    if (polls && polls.length > 0) {
      console.log(JSON.stringify(polls[0], null, 2));
    }

    console.log('\n📊 POLL_RESPONSES TABLE:');
    const { data: responses } = await supabase.from('poll_responses').select('*').limit(1);
    if (responses && responses.length > 0) {
      console.log(JSON.stringify(responses[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

showStructures();