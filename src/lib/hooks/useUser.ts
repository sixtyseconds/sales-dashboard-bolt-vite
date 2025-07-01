import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/clientV2';
import { toast } from 'sonner';

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

export const stopImpersonating = async () => {
  try {
    const originalUserId = localStorage.getItem('originalUserId');
    if (!originalUserId) {
      throw new Error('No impersonation session found');
    }

    // Call the restore-user edge function
    const { data, error } = await supabase.functions.invoke('restore-user', {
      body: { userId: originalUserId }
    });

    if (error) {
      throw error;
    }

    // Clear the original user ID from localStorage
    localStorage.removeItem('originalUserId');

    if (data?.email && data?.password) {
      // Sign in as original user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        throw signInError;
      }

      toast.success('Stopped impersonating successfully');
      window.location.reload();
    } else {
      throw new Error('Invalid restore response');
    }
  } catch (error: any) {
    console.error('Stop impersonation error:', error);
    // Clear localStorage even if there's an error to prevent user from being stuck
    localStorage.removeItem('originalUserId');
    toast.error('Failed to stop impersonation: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

export const impersonateUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('impersonate-user', {
      body: { userId }
    });

    if (error) {
      throw error;
    }

    if (data?.email && data?.password) {
      // Store original user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        localStorage.setItem('originalUserId', currentUser.id);
      }

      // Sign in as target user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        throw signInError;
      }

      toast.success('Impersonation started successfully');
      window.location.reload();
    } else {
      throw new Error('Invalid impersonation response');
    }
  } catch (error: any) {
    console.error('Impersonation error:', error);
    toast.error('Failed to impersonate user: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

export function useUser() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUserData, setOriginalUserData] = useState<any>(null);

  useEffect(() => {
    // Check if we're in an impersonation session
    const originalUserId = localStorage.getItem('originalUserId');
    setIsImpersonating(!!originalUserId);

    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        // Get the current user session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          // User is authenticated
          const user = session.user;
          
          // Get or create user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is fine for new users
            throw profileError;
          }

          // If no profile exists, create a default one
          if (!profile) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || 'User',
                last_name: user.user_metadata?.last_name || '',
                avatar_url: user.user_metadata?.avatar_url,
                role: 'Junior',
                department: 'Sales'
              })
              .select()
              .single();

            if (createError) {
              console.warn('Could not create profile, using basic user data:', createError);
              // Fall back to basic user data
              setUserData({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || 'User',
                last_name: user.user_metadata?.last_name || '',
                avatar_url: user.user_metadata?.avatar_url,
                role: 'Junior',
                department: 'Sales'
              });
            } else {
              setUserData(newProfile);
            }
          } else {
            setUserData(profile);
          }

          // If we're impersonating, also get the original user data
          if (originalUserId && originalUserId !== user.id) {
            try {
              const { data: originalProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', originalUserId)
                .single();
              setOriginalUserData(originalProfile);
            } catch (error) {
              console.warn('Could not fetch original user data:', error);
            }
          }
        } else {
          // No user session - create a mock user for development
          console.log('No authenticated user, creating mock user for development');
          setUserData({
            id: 'mock-user-id',
            email: 'demo@example.com',
            first_name: 'Demo',
            last_name: 'User',
            avatar_url: null,
            role: 'Senior',
            department: 'Sales'
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err);
        
        // Fall back to mock user in case of errors
        setUserData({
          id: 'mock-user-id',
          email: 'demo@example.com',
          first_name: 'Demo',
          last_name: 'User',
          avatar_url: null,
          role: 'Senior',
          department: 'Sales'
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && session) {
          // User signed in, fetch their profile
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          setUserData(null);
          setOriginalUserData(null);
          setIsImpersonating(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserData(null);
      setOriginalUserData(null);
      setIsImpersonating(false);
      // Clear impersonation data
      localStorage.removeItem('originalUserId');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear user data even if signOut fails
      setUserData(null);
      setOriginalUserData(null);
      setIsImpersonating(false);
      localStorage.removeItem('originalUserId');
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonating();
    } catch (error) {
      console.error('Error stopping impersonation:', error);
    }
  };

  return {
    userData,
    originalUserData,
    isLoading,
    error,
    signOut,
    isAuthenticated: !!userData,
    isImpersonating,
    stopImpersonating: handleStopImpersonation
  };
}