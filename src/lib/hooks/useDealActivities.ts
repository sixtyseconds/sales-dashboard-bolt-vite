import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';

interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  notes?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function useDealActivities(dealId?: string | null) {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { userData } = useUser();

  const fetchActivities = useCallback(async () => {
    if (!userData?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('deal_activities')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });
        
      // If dealId is provided, filter activities for just that deal
      if (dealId) {
        query = query.eq('deal_id', dealId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching deal activities:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id, dealId]);
  
  useEffect(() => {
    fetchActivities();
    
    // Setup realtime subscription
    let subscription;
    if (userData?.id) {
      subscription = supabase
        .channel('activity_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'deal_activities',
          filter: dealId ? `deal_id=eq.${dealId}` : undefined
        }, () => {
          fetchActivities();
        })
        .subscribe();
    }
      
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchActivities, userData?.id, dealId]);
  
  const createActivity = async (activityData: Omit<DealActivity, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profiles'>) => {
    if (!userData?.id) return null;
    
    try {
      setError(null);
      
      const newActivity = {
        ...activityData,
        user_id: userData.id
      };
      
      const { data, error } = await supabase
        .from('deal_activities')
        .insert(newActivity)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add user profile info for optimistic update
      const activityWithUser = {
        ...data,
        profiles: {
          id: userData.id,
          full_name: userData.first_name + ' ' + userData.last_name,
          avatar_url: userData.avatar_url
        }
      };
      
      // Optimistic update
      setActivities(prev => [activityWithUser, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err);
      return null;
    }
  };
  
  const updateActivity = async (id: string, updates: Partial<DealActivity>) => {
    if (!userData?.id) return false;
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('deal_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Optimistic update
      setActivities(prev => 
        prev.map(activity => {
          if (activity.id === id) {
            return { ...activity, ...data };
          }
          return activity;
        })
      );
      
      return true;
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteActivity = async (id: string) => {
    if (!userData?.id) return false;
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('deal_activities')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Optimistic update
      setActivities(prev => prev.filter(activity => activity.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError(err);
      return false;
    }
  };

  return {
    activities,
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refreshActivities: fetchActivities
  };
} 