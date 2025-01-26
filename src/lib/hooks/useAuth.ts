import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        toast.success('Welcome back!');
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        toast.success('Signed out successfully');
        navigate('/auth/login');
      }
      setIsLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(() => {
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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