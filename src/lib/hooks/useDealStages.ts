import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface DealStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order_position: number;
  default_probability: number;
  created_at: string;
  updated_at: string;
}

export function useDealStages() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchStages() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('deal_stages')
          .select('*')
          .order('order_position', { ascending: true });
          
        if (error) throw error;
        
        setStages(data);
      } catch (err) {
        console.error('Error fetching deal stages:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStages();
    
    // Setup realtime subscription
    const subscription = supabase
      .channel('stage_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'deal_stages' 
      }, () => {
        fetchStages();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createStage = async (stageData: Omit<DealStage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('deal_stages')
        .insert(stageData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Optimistic update
      setStages(prevStages => [...prevStages, data].sort((a, b) => a.order_position - b.order_position));
      
      return data;
    } catch (err) {
      console.error('Error creating stage:', err);
      setError(err);
      return null;
    }
  };
  
  const updateStage = async (id: string, updates: Partial<DealStage>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('deal_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Optimistic update
      setStages(prevStages => 
        prevStages.map(s => s.id === id ? data : s)
          .sort((a, b) => a.order_position - b.order_position)
      );
      
      return true;
    } catch (err) {
      console.error('Error updating stage:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteStage = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('deal_stages')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Optimistic update
      setStages(prevStages => prevStages.filter(s => s.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError(err);
      return false;
    }
  };

  return {
    stages,
    isLoading,
    error,
    createStage,
    updateStage,
    deleteStage
  };
} 