import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = (import.meta as any).env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Better error handling for missing environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️ VITE_SUPABASE_URL not configured. Please set up your .env.local file with actual Supabase credentials.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY not configured. Please set up your .env.local file with actual Supabase credentials.');
}
if (!supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not configured. Please set up your .env.local file with actual Supabase credentials.');
}

// Create singleton instances to prevent multiple client warnings
let supabaseInstance: any = null;
let supabaseAdminInstance: any = null;

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

// Regular client for normal operations
export const supabase = (() => {
  if (!supabaseInstance) {
    if (hasValidCredentials) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token', // Unique storage key
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce' // Enable PKCE flow for better security and reset password support
        }
      });
    } else {
      // Create a mock client for development
      console.log('🔧 Using mock Supabase client - configure .env.local for real functionality');
      supabaseInstance = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: () => Promise.resolve({ error: null }),
          resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'No credentials configured' } }),
          updateUser: () => Promise.resolve({ data: null, error: { message: 'No credentials configured' } })
        },
        from: (table: string) => ({
          select: () => ({ 
            eq: () => ({ 
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No credentials configured' } }),
              limit: () => Promise.resolve({ data: [], error: null })
            }),
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          insert: () => ({ 
            select: () => ({ 
              single: () => Promise.resolve({ data: null, error: { message: 'No credentials configured' } })
            })
          }),
          update: () => ({ 
            eq: () => Promise.resolve({ data: null, error: { message: 'No credentials configured' } })
          }),
          delete: () => ({ 
            eq: () => Promise.resolve({ data: null, error: { message: 'No credentials configured' } })
          })
        })
      };
    }
  }
  return supabaseInstance;
})();

// Admin client with service role for admin operations, configured to avoid auth conflicts
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    if (hasValidCredentials && supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false, // Don't persist admin sessions
          autoRefreshToken: false, // Disable auto refresh for admin client
          storageKey: 'supabase.auth.admin.token' // Different storage key
        }
      });
    } else {
      // Use the same mock client for admin operations in development
      supabaseAdminInstance = supabase;
    }
  }
  return supabaseAdminInstance;
})();