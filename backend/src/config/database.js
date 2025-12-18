// =====================================================
// FILE: backend/src/config/database.js
// Supabase Database Configuration
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not defined in environment variables');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is not defined in environment variables');
  process.exit(1);
}

// Initialize Supabase client
console.log('🔗 Initializing Supabase connection...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Supabase client initialized successfully');

// Export the client directly (NOT as an object)
module.exports = supabase;