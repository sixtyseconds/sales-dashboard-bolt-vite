import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing env.VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');
if (!supabaseServiceKey) throw new Error('Missing env.VITE_SUPABASE_SERVICE_ROLE_KEY');

// Create singleton instances to prevent multiple client warnings
let supabaseInstance: any = null;
let supabaseAdminInstance: any = null;

// Regular client for normal operations
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'supabase.auth.token', // Unique storage key
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
})();

// Admin client with service role for admin operations, configured to avoid auth conflicts
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false, // Don't persist admin sessions
        autoRefreshToken: false, // Disable auto refresh for admin client
        storageKey: 'supabase.auth.admin.token' // Different storage key
      }
    });
  }
  return supabaseAdminInstance;
})();