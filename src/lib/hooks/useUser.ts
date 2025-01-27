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
}

async function stopImpersonating() {
  const originalUserId = localStorage.getItem('originalUserId');
  if (!originalUserId) return;

  // Get original user's login token
  const { data: token, error: tokenError } = await supabase.functions.invoke('restore-user', {
    body: { userId: originalUserId }
  });

  if (tokenError) throw tokenError;

  // Sign back in as original user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: token.email,
    password: token.password
  });

  if (signInError) throw signInError;

  localStorage.removeItem('originalUserId');
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    console.log('Setting up auth listener...');
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setUser(session?.user ?? null);
      setIsImpersonating(!!localStorage.getItem('originalUserId'));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, userId: session?.user?.id });
      setUser(session?.user ?? null);
      setIsImpersonating(!!localStorage.getItem('originalUserId'));
    });

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Fetching user profile for:', user.id);
      fetchUserProfile(user)
        .then(data => {
          console.log('User profile loaded:', data?.id);
          setUserData(data);
        })
        .catch(error => {
          console.error('Error loading user profile:', error);
          setError(error);
        })
        .finally(() => {
          console.log('Finished loading user profile');
          setLoading(false);
        });
    } else {
      console.log('No user, clearing user data');
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
      console.error('Impersonation error:', error);
    }
  };

  const endImpersonating = async () => {
    try {
      await stopImpersonating();
      toast.success('Returned to original user');
    } catch (error) {
      toast.error('Failed to stop impersonating');
      console.error('Stop impersonation error:', error);
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