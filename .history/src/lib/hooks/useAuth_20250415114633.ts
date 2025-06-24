import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Clear all queries from cache when signing in
        await queryClient.resetQueries();
        await queryClient.clear();
        // Prefetch initial data for the new user
        await queryClient.prefetchQuery({
          queryKey: ['activities'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data } = await supabase
              .from('activities')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false });
            return data || [];
          }
        });
        toast.success('Welcome back!');
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        // Clear all queries from cache when signing out
        await queryClient.resetQueries();
        await queryClient.clear();
        toast.success('Signed out successfully');
        navigate('/auth/login');
      }
      setIsLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session }}) => {
      // Clear cache on initial load too
      await queryClient.resetQueries();
      await queryClient.clear();
      if (session?.user) {
        // Prefetch initial data
        await queryClient.prefetchQuery({
          queryKey: ['activities'],
          queryFn: async () => {
            const { data } = await supabase
              .from('activities')
              .select('*')
              .eq('user_id', session.user.id)
              .order('date', { ascending: false });
            return data || [];
          }
        });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, queryClient]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    isLoading,
    signOut,
  };
}