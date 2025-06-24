import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If no session but we have tokens in localStorage, try to recover
        if (!session && !sessionError) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError && userError.message.includes('session')) {
            // Session is invalid, clear it and redirect to login
            await supabase.auth.signOut();
          }
        }
        
        const isPublicRoute = publicRoutes.includes(location.pathname);

        if (!session && !isPublicRoute) {
          navigate('/auth/login');
        } else if (session && isPublicRoute) {
          if (location.pathname !== '/auth/reset-password') {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error, sign out and redirect to login
        await supabase.auth.signOut();
        const isPublicRoute = publicRoutes.includes(location.pathname);
        if (!isPublicRoute) {
          navigate('/auth/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      const isPublicRoute = publicRoutes.includes(location.pathname);

      if (event === 'SIGNED_OUT' || (!session && !isPublicRoute)) {
        navigate('/auth/login');
      } else if (session && isPublicRoute) {
        if (location.pathname !== '/auth/reset-password') {
          navigate('/');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Add session refresh strategy
  useEffect(() => {
    const refreshSession = async () => {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        // Don't automatically sign out here as it might be a temporary network issue
      }
    };

    // Refresh session every 30 minutes
    const interval = setInterval(refreshSession, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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