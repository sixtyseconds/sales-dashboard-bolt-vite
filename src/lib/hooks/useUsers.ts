import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/clientV2';

// Mock implementation - temporarily disabled Supabase calls to avoid 400 errors
// TODO: Implement with Neon API when user management functionality is needed

export interface Target {
  id?: string;
  user_id?: string;
  revenue_target: number | null;
  outbound_target: number | null;
  meetings_target: number | null;
  proposal_target: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  stage: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  targets: Target[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get current user first
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.log('No authenticated user');
        setUsers([]);
        return;
      }

      // Simple profiles query with type assertion
      const { data: profiles, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data to match expected User interface
      const usersData = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || 'unknown@example.com',
        first_name: profile.first_name,
        last_name: profile.last_name,
        stage: profile.stage || 'Trainee',
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin || false,
        created_at: profile.created_at || new Date().toISOString(),
        last_sign_in_at: profile.last_sign_in_at || null,
        targets: [] // Will be loaded separately if needed
      }));

      setUsers(usersData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. User management may be disabled.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    if (!userId) {
      toast.error("Cannot update user: User ID missing.");
      return;
    }
    
    try {
      // Extract targets and profile updates
      const { targets, ...profileUpdates } = updates;
      
      // Update profile
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          throw profileError;
        }
      }

      toast.success('User updated successfully');
      await fetchUsers();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Failed to update user: ' + (error.message || 'Unknown error'));
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete user: ' + (error.message || 'Unknown error'));
    }
  };

  const impersonateUser = async (userId: string) => {
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
    }
  };

  return {
    users,
    isLoading,
    updateUser,
    deleteUser,
    impersonateUser,
  };
}