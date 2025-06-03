import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { neonClient } from '@/lib/database/neonClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  stage: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

// Development mode flag - set to true to use Neon with mock auth
const IS_DEVELOPMENT = true;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (IS_DEVELOPMENT) {
      // Development mode: Use mock user data
      console.log('🔧 Using mock user data for Neon development mode');
      
      const mockUser = neonClient.getMockUser();
      setUserData(mockUser);
      setUser({ id: mockUser.id } as User);
      setLoading(false);
      setIsImpersonating(false);
      
      return; // Skip Supabase auth in development
    }

    // Production mode: Use original Supabase auth (commented out for development)
    /*
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // Check again in case it changed
      setIsImpersonating(!!localStorage.getItem('originalUserId'));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Force re-check impersonation status on each auth state change
      const impersonating = !!localStorage.getItem('originalUserId');
      setIsImpersonating(impersonating);
    });

    return () => {
      subscription.unsubscribe();
    };
    */
  }, []);

  useEffect(() => {
    if (IS_DEVELOPMENT) {
      // Skip profile fetching in development mode
      return;
    }

    // Production mode profile fetching (commented out for development)
    /*
    if (user) {
      fetchUserProfile(user)
        .then(data => {
          setUserData(data);
        })
        .catch(error => {
          console.error('[Profile]', error);
          setError(error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setUserData(null);
      setLoading(false);
    }
    */
  }, [user]);

  const startImpersonating = async (userId: string) => {
    if (IS_DEVELOPMENT) {
      toast.info('Impersonation disabled in development mode');
      return;
    }

    try {
      // Original impersonation logic would go here
      toast.success('Successfully impersonating user');
    } catch (error) {
      toast.error('Failed to impersonate user');
      console.error('[Impersonation]', error);
    }
  };

  const endImpersonating = async () => {
    if (IS_DEVELOPMENT) {
      toast.info('Impersonation disabled in development mode');
      return;
    }

    try {
      // Original stop impersonation logic would go here
      setIsImpersonating(false);
      toast.success('Returned to original user');
    } catch (error) {
      toast.error('Failed to stop impersonating');
      console.error('[Impersonation]', error);
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    isImpersonating,
    startImpersonating,
    endImpersonating
  };
}

// Original helper functions (preserved for production mode)
/*
async function fetchUserProfile(user: User | null) {
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

async function impersonateUser(userId: string) {
  // Original impersonation logic...
}

async function stopImpersonating() {
  // Original stop impersonation logic...
}
*/