import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  stage: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  targets?: {
    revenue_target: number;
    outbound_target: number;
    meetings_target: number;
    proposal_target: number;
  };
}

async function fetchUsers() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      *,
      targets (
        revenue_target,
        outbound_target,
        meetings_target,
        proposal_target
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return users;
}

async function updateUser(userId: string, updates: any) {
  // If updating targets, handle separately
  if (updates.targets) {
    const { error: targetError } = await supabase
      .from('targets')
      .upsert({
        user_id: userId,
        ...updates.targets,
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });

    if (targetError) throw targetError;
    delete updates.targets;
  }

  // Update other user data
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }
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

async function deleteUser(userId: string) {
  try {
    // Delete user's activities
    const { error: activitiesError } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId);
    
    if (activitiesError) {
      console.error('Error deleting activities:', activitiesError);
      throw activitiesError;
    }

    // Delete user's targets
    const { error: targetsError } = await supabase
      .from('targets')
      .delete()
      .eq('user_id', userId);
    
    if (targetsError) {
      console.error('Error deleting targets:', targetsError);
      throw targetsError;
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }

    // Delete auth user using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }
    
    toast.success('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Failed to delete user');
    throw error;
  }
}

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      updateUser(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update user');
      console.error('Update error:', error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete user');
      console.error('Delete error:', error);
    },
  });

  const impersonateUserMutation = useMutation({
    mutationFn: impersonateUser,
    onSuccess: () => {
      toast.success('Impersonation started');
    },
    onError: (error: Error) => {
      toast.error('Failed to impersonate user');
      console.error('Impersonation error:', error);
    },
  });

  return {
    users,
    isLoading,
    updateUser: (userId: string, updates: any) =>
      updateUserMutation.mutate({ userId, updates }),
    deleteUser: (userId: string) => deleteUserMutation.mutate(userId),
    impersonateUser: (userId: string) => impersonateUserMutation.mutate(userId),
  };
}