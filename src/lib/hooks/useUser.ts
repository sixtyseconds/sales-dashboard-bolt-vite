import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/clientV2';

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

export function useUser() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
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
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear user data even if signOut fails
      setUserData(null);
    }
  };

  return {
    userData,
    isLoading,
    error,
    signOut,
    isAuthenticated: !!userData
  };
}