import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { IdentifierType } from '@/components/IdentifierField';

export interface Activity {
  id: string;
  type: 'sale' | 'outbound' | 'meeting' | 'proposal';
  client_name: string;
  date: string;
  amount?: number;
  user_id: string;
  sales_rep: string;
  avatar_url?: string | null;
  status: 'completed' | 'pending' | 'cancelled' | 'no_show';
  details: string;
  priority: 'high' | 'medium' | 'low';
  quantity?: number;
  contactIdentifier?: string;
  contactIdentifierType?: IdentifierType;
}

async function fetchActivities() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;

  return data?.filter(activity => activity.user_id === user.id) || [];
}

async function createActivity(activity: { 
  type: Activity['type'];
  client_name: string;
  details?: string;
  amount?: number;
  priority?: Activity['priority'];
  date?: string;
  quantity?: number;
  contactIdentifier?: string;
  contactIdentifierType?: IdentifierType;
  status?: Activity['status'];
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
      client_name: activity.client_name,
      details: activity.details || '',
      amount: activity.amount,
      priority: activity.priority || 'medium',
      sales_rep: `${profile.first_name} ${profile.last_name}`,
      date: activity.date || new Date().toISOString(),
      status: activity.status || 'completed',
      quantity: activity.quantity || 1,
      contact_identifier: activity.contactIdentifier,
      contact_identifier_type: activity.contactIdentifierType
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

function fireConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    spread: 90,
    ticks: 400,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 45,
    colors: ['#37bd7e', '#34D399', '#6EE7B7', '#059669', '#047857']
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // Left side burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.2, y: 0.9 }
  });

  // Right side burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.8, y: 0.9 }
  });

  // Center burst
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    origin: { x: 0.5, y: 0.8 }
  });

  // Delayed follow-up bursts
  setTimeout(() => {
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      origin: { x: 0.3, y: 0.8 }
    });
  }, 200);

  setTimeout(() => {
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      origin: { x: 0.7, y: 0.8 }
    });
  }, 200);

  // Final celebratory burst
  setTimeout(() => {
    fire(0.2, {
      spread: 150,
      startVelocity: 45,
      decay: 0.91,
      origin: { x: 0.5, y: 0.9 }
    });
  }, 400);
}

async function createSale(sale: { 
  client_name: string;
  amount: number;
  details?: string;
  saleType: 'one-off' | 'subscription' | 'lifetime';
  date?: string;
  contactIdentifier?: string;
  contactIdentifierType?: IdentifierType;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const activityData = {
    user_id: user.id,
    type: 'sale',
    client_name: sale.client_name,
    details: sale.details || `${sale.saleType} Sale`,
    amount: sale.amount,
    priority: 'high',
    sales_rep: `${profile.first_name} ${profile.last_name}`,
    date: sale.date || new Date().toISOString(),
    status: 'completed',
    contact_identifier: sale.contactIdentifier,
    contact_identifier_type: sale.contactIdentifierType
  };

  const { data, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create sale');

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
    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscription = supabase
        .channel('activities_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
            filter: `user_id=eq.${user.id}`
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
    }

    setupSubscription();
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
      toast.error('Failed to add activity');
      console.error('[Activities]', error);
    },
  });

  // Add sale mutation with error handling and confetti
  const addSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Sale added successfully! 🎉');
      fireConfetti();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add sale: ${error.message}`);
    },
  });

  // Update activity mutation with error handling
  const updateActivityMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Activity> }) =>
      updateActivity(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Activity updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update activity');
    },
  });

  // Remove activity mutation with error handling
  const removeActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Activity deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete activity');
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