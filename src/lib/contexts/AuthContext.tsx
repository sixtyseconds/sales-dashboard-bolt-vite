import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, authUtils, type Session, type User, type AuthError } from '../supabase/clientV2';
import { toast } from 'sonner';

// Auth context types
interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  
  // Utilities
  isAuthenticated: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
            // Clear potentially corrupted session data
            authUtils.clearAuthStorage();
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          authUtils.clearAuthStorage();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Handle specific auth events
          switch (event) {
            case 'SIGNED_IN':
              toast.success('Successfully signed in!');
              // Invalidate all queries to refetch with new auth context
              queryClient.invalidateQueries();
              break;
              
            case 'SIGNED_OUT':
              toast.success('Successfully signed out!');
              // Clear all cached data
              queryClient.clear();
              authUtils.clearAuthStorage();
              break;
              
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed successfully');
              break;
              
            case 'PASSWORD_RECOVERY':
              console.log('Password recovery initiated');
              break;
              
            default:
              break;
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: { message: authUtils.formatAuthError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: authUtils.formatAuthError(error) } };
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, metadata?: { full_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        return { error: { message: authUtils.formatAuthError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: authUtils.formatAuthError(error) } };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: { message: authUtils.formatAuthError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: authUtils.formatAuthError(error) } };
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: { message: authUtils.formatAuthError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: authUtils.formatAuthError(error) } };
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: { message: authUtils.formatAuthError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: authUtils.formatAuthError(error) } };
    }
  }, []);

  // Computed values
  const isAuthenticated = authUtils.isAuthenticated(session);
  const userId = authUtils.getUserId(session);

  const value: AuthContextType = {
    // State
    user,
    session,
    loading,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    
    // Utilities
    isAuthenticated,
    userId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 