import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
  // This would typically involve creating a temporary token or session
  // For now, we'll just simulate it
  toast.success('Impersonation not implemented in demo');
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
    impersonateUser: impersonateUserMutation.mutate,
  };
}