import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
}

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

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
  const { data: { session }, error } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Check if current user is admin
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!currentUser?.is_admin) {
    throw new Error('Unauthorized');
  }

  // Get impersonation token
  const { data: token, error: tokenError } = await supabase.functions.invoke('impersonate-user', {
    body: { userId }
  });

  if (tokenError) throw tokenError;

  // Store original user ID for restoring later
  localStorage.setItem('originalUserId', session.user.id);

  // Sign in as impersonated user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: token.email,
    password: token.password
  });

  if (signInError) throw signInError;

  // Clear any cached queries to ensure fresh data load for impersonated user
  if (window.queryClient) {
    window.queryClient.invalidateQueries();
  }
}

async function stopImpersonating() {
  const originalUserId = localStorage.getItem('originalUserId');
  if (!originalUserId) return;

  try {
    // Get original user's login token
    const { data: token, error: tokenError } = await supabase.functions.invoke('restore-user', {
      body: { userId: originalUserId }
    });

    if (tokenError) throw tokenError;

    // Remove the impersonation flag BEFORE signing back in
    // This ensures the auth state change listener will detect the flag is already gone
    localStorage.removeItem('originalUserId');

    // Sign back in as original user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: token.email,
      password: token.password
    });

    if (signInError) throw signInError;

    // Clear any cached queries to ensure fresh data load for original user
    if (window.queryClient) {
      window.queryClient.invalidateQueries();
    }
  } catch (error) {
    console.error('[Auth]', error);
    // If there's an error, still try to clear the localStorage to avoid being stuck
    localStorage.removeItem('originalUserId');
    throw error;
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, [user]);

  const startImpersonating = async (userId: string) => {
    try {
      await impersonateUser(userId);
      toast.success('Successfully impersonating user');
    } catch (error) {
      toast.error('Failed to impersonate user');
      console.error('[Impersonation]', error);
    }
  };

  const endImpersonating = async () => {
    try {
      await stopImpersonating();
      
      // Force UI update immediately
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