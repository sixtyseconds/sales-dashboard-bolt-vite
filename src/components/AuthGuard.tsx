import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if this is a password reset flow
        const isResetPassword = location.pathname === '/auth/reset-password';
        const hasRecoveryToken = window.location.hash.includes('type=recovery') || 
                                window.location.search.includes('type=recovery');

        // For reset password, check if we have a recovery token in URL
        if (isResetPassword) {
          if (!hasRecoveryToken) {
            // No recovery token, redirect to forgot password
            toast.error('Invalid or expired password reset link');
            navigate('/auth/forgot-password');
            setIsLoading(false);
            return;
          }
          // Let the reset password page handle the session
          setIsLoading(false);
          return;
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If there's a session error, try to recover
        if (sessionError) {
          console.error('Session error:', sessionError);
          await supabase.auth.signOut();
        }
        
        const isPublicRoute = publicRoutes.includes(location.pathname);

        if (session) {
          // User is signed in
          if (isPublicRoute && !isResetPassword) {
            navigate('/');
          }
        } else {
          // User is signed out or session is invalid
          if (!isPublicRoute) {
            await queryClient.clear(); // Clear cache on sign out
            navigate('/auth/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error, sign out and redirect to login
        await supabase.auth.signOut();
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/auth/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event, session ? 'has session' : 'no session');
      
      const isPublicRoute = publicRoutes.includes(location.pathname);
      const isResetPassword = location.pathname === '/auth/reset-password';
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        await queryClient.clear();
        if (!isPublicRoute) {
          navigate('/auth/login');
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // User clicked reset password link - stay on reset password page
        if (!isResetPassword) {
          navigate('/auth/reset-password');
        }
      } else if (session && isPublicRoute && !isResetPassword) {
        // User signed in, redirect to dashboard
        navigate('/');
      } else if (!session && !isPublicRoute) {
        // No session and trying to access protected route
        navigate('/auth/login');
      }
      
      setIsLoading(false);
    });

    // Initial auth check
    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] pointer-events-none" />
        <Loader2 className="w-8 h-8 text-[#37bd7e] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}