import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing env.VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');
if (!supabaseServiceKey) throw new Error('Missing env.VITE_SUPABASE_SERVICE_ROLE_KEY');

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role for admin operations, configured to avoid auth conflicts
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // Don't persist admin sessions
    autoRefreshToken: false // Disable auto refresh for admin client
  }
});