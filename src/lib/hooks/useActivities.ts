import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export interface Activity {
  id: string;
  type: 'sale' | 'outbound' | 'meeting' | 'proposal';
  client_name: string;
  date: string;
  amount?: number;
  user_id: string;
  sales_rep: string;
  status: 'completed' | 'pending' | 'cancelled';
  details: string;
  priority: 'high' | 'medium' | 'low';
}

async function fetchActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

async function createActivity(activity: { 
  type: Activity['type'];
  clientName: string;
  details?: string;
  amount?: number;
  priority?: Activity['priority'];
  date?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      type: activity.type,
      client_name: activity.clientName,
      details: activity.details || '',
      amount: activity.amount,
      priority: activity.priority || 'medium',
      sales_rep: `${profile.first_name} ${profile.last_name}`,
      date: activity.date || new Date().toISOString(),
      status: 'completed'
    })
    .select()
    .single();

  if (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }

  return data;
}

async function createSale(sale: { 
  clientName: string;
  amount: number;
  details?: string;
  saleType: 'one-off' | 'subscription' | 'lifetime';
  date?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      type: 'sale',
      client_name: sale.clientName,
      details: sale.details || `${sale.saleType} Sale`,
      amount: sale.amount,
      priority: 'high',
      sales_rep: `${profile.first_name} ${profile.last_name}`,
      date: sale.date || new Date().toISOString(),
      status: 'completed'
    })
    .select()
    .single();

  if (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }

  return data;
}

async function updateActivity(id: string, updates: Partial<Activity>) {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteActivity(id: string) {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useActivities() {
  const queryClient = useQueryClient();

  // Set up real-time subscription for live updates
  useEffect(() => {
    const subscription = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          // Invalidate all relevant queries
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          queryClient.invalidateQueries({ queryKey: ['salesData'] });
          queryClient.invalidateQueries({ queryKey: ['targets'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
  });

  // Add activity mutation with error handling
  const addActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Activity added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error('Failed to add activity:', error);
    },
  });

  // Add sale mutation with error handling and confetti
  const addSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Sale added successfully! 🎉');
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error('Failed to add sale:', error);
    },
  });

  // Update activity mutation with error handling
  const updateActivityMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Activity> }) =>
      updateActivity(id, updates),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Activity updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update activity');
      console.error('Failed to update activity:', error);
    },
  });

  // Remove activity mutation with error handling
  const removeActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Activity deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete activity');
      console.error('Failed to delete activity:', error);
    },
  });

  // Return all mutations and data
  return {
    activities,
    isLoading,
    addActivity: addActivityMutation.mutate,
    addSale: addSaleMutation.mutate,
    updateActivity: updateActivityMutation.mutate,
    removeActivity: removeActivityMutation.mutate,
  };
}