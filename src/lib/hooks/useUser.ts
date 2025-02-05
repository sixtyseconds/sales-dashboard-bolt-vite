import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
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
  targets?: {
    revenue_target: number;
    outbound_target: number;
    meetings_target: number;
    proposal_target: number;
  } | null;
}

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  stage: string;
  targets?: {
    revenue_target: number;
    outbound_target: number;
    meetings_target: number;
    proposal_target: number;
  } | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function fetchUserProfile(retryCount = 0): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error loading user:', userError);
      throw userError;
    }

    if (!user) {
      return null;
    }

    // Get the user's complete profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        targets (
          revenue_target,
          outbound_target,
          meetings_target,
          proposal_target
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error loading user profile:', profileError);
      
      if (profileError.message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchUserProfile(retryCount + 1);
      }
      
      throw profileError;
    }

    return profile;
  } catch (error) {
    if (error.message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
      console.log(`Retrying user fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchUserProfile(retryCount + 1);
    }
    throw error;
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Query for user data with automatic revalidation
  const { data: userDataFromQuery, isLoading, error: queryError } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetchUserProfile(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    enabled: !!user, // Only run query when we have a user
  });

  useEffect(() => {
    let mounted = true;
    console.log('Setting up auth listener...');
    
    // Get initial session and check impersonation
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setError(sessionError);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error as Error);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setIsInitialized(true);
          // Clear all queries on sign out or sign in
          queryClient.invalidateQueries();
        }

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ['user'] });
        }
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (userDataFromQuery) {
      console.log('User profile loaded:', userDataFromQuery.id);
      setUserData(userDataFromQuery as UserData);
    } else if (!loading && user) {
      console.log('No user data found for authenticated user');
      setError(new Error('Failed to load user profile'));
    } else {
      console.log('No user, clearing user data');
      setUserData(null);
    }
  }, [userDataFromQuery, loading, user]);

  useEffect(() => {
    if (queryError) {
      console.error('Query error:', queryError);
      toast.error('Failed to load user profile. Please check your internet connection and try again.');
    }
  }, [queryError]);

  return {
    user,
    userData,
    loading: isLoading || !isInitialized,
    error: queryError
  };
}