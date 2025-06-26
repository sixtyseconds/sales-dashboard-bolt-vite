import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { apiCall } from '@/lib/utils/apiUtils';
import { supabase } from '@/lib/supabase/clientV2';
import { createClient } from '@supabase/supabase-js';

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
    const fetchStages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check authentication first
        console.log('🔍 Checking user authentication for stages...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('⚠️ No session found - skipping Edge Functions, going straight to service key fallback for stages...');
          
          // Skip Edge Functions entirely and go straight to service key fallback
          const serviceSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
          );
          
          console.log('🛡️ Stages service key fallback (no auth)...');
          const { data: serviceStagesData, error: serviceError } = await (serviceSupabase as any)
            .from('deal_stages')
            .select('*')
            .order('order_position');
            
          if (serviceError) {
            console.error('❌ Service key stages fallback failed:', serviceError);
            throw serviceError;
          }
          
          console.log(`✅ Service key stages fallback successful: Retrieved ${serviceStagesData?.length || 0} stages`);
          serviceStagesData?.forEach((stage: any) => console.log(`   📋 Stage: ${stage.name}`));
          
          setStages(serviceStagesData || []);
          setIsLoading(false);
          return;
        }

        // Try Edge Functions if authenticated
        console.log('🌐 User authenticated - trying Edge Functions for stages...');
        try {
          const response = await apiCall<DealStage[]>(`${API_BASE_URL}/stages`);
          setStages(response || []);
          setIsLoading(false);
          return;
        } catch (edgeFunctionError) {
          console.warn('Edge Function failed, falling back to direct Supabase client:', edgeFunctionError);
          
          // Fallback to direct Supabase client
          console.log('🛡️ Stages fallback: Using direct Supabase client...');
          const { data: stagesData, error: supabaseError } = await (supabase as any)
            .from('deal_stages')
            .select('*')
            .order('order_position');
          
          if (supabaseError) {
            console.error('❌ Stages fallback failed:', supabaseError);
            console.log('🔄 Trying stages with service role key...');
            
            // Last resort: try with service role key
            try {
              const serviceSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
              );
              
              const { data: serviceStagesData, error: serviceError } = await (serviceSupabase as any)
                .from('deal_stages')
                .select('*')
                .order('order_position');
                
              if (serviceError) {
                console.error('❌ Service key stages fallback also failed:', serviceError);
                throw serviceError;
              }
              
              console.log(`✅ Service key stages fallback successful: Retrieved ${serviceStagesData?.length || 0} stages`);
              serviceStagesData?.forEach((stage: any) => console.log(`   📋 Stage: ${stage.name}`));
              
              setStages(serviceStagesData || []);
              return;
              
            } catch (serviceError) {
              console.error('❌ All stages fallback methods failed:', serviceError);
              throw serviceError;
            }
          }
          
          console.log(`✅ Stages fallback successful: Retrieved ${stagesData?.length || 0} stages`);
          stagesData?.forEach((stage: any) => console.log(`   📋 Stage: ${stage.name}`));
          
          setStages(stagesData || []);
        }
      } catch (err) {
        console.error('Error fetching deal stages:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStages();
  }, []);

  const createStage = async (stageData: Omit<DealStage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      // Try Edge Function first, fallback to direct Supabase
      try {
        const result = await apiCall<DealStage>(
          `${API_BASE_URL}/stages`,
          {
            method: 'POST',
            body: JSON.stringify(stageData)
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );
        
        setStages(prevStages => [...prevStages, result as DealStage].sort((a, b) => a.order_position - b.order_position));
        return result;
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to direct Supabase client');
        
                 // Get next order position
         const { data: maxStage } = await (supabase as any)
           .from('deal_stages')
           .select('order_position')
           .order('order_position', { ascending: false })
           .limit(1)
           .single();
         
         const nextPosition = (maxStage?.order_position || 0) + 1;
         
         const { data: stage, error } = await (supabase as any)
           .from('deal_stages')
           .insert({
             ...stageData,
             order_position: nextPosition
           })
           .select()
           .single();
         
         if (error) throw error;
         
         setStages(prevStages => [...prevStages, stage].sort((a, b) => a.order_position - b.order_position));
        return stage;
      }
    } catch (err) {
      console.error('Error creating stage:', err);
      setError(err);
      return null;
    }
  };
  
  const updateStage = async (id: string, updates: Partial<DealStage>) => {
    try {
      setError(null);
      
      // Try Edge Function first, fallback to direct Supabase
      try {
        const result = await apiCall<DealStage>(
          `${API_BASE_URL}/stages/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(updates)
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );
        
        setStages(prevStages => 
          prevStages.map(s => s.id === id ? result as DealStage : s)
            .sort((a, b) => a.order_position - b.order_position)
        );
        return true;
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to direct Supabase client');
        
                 const { data: stage, error } = await (supabase as any)
           .from('deal_stages')
           .update(updates)
           .eq('id', id)
           .select()
           .single();
         
         if (error) throw error;
         
         setStages(prevStages => 
           prevStages.map(s => s.id === id ? stage : s)
             .sort((a, b) => a.order_position - b.order_position)
         );
        return true;
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteStage = async (id: string) => {
    try {
      setError(null);
      
      // Try Edge Function first, fallback to direct Supabase
      try {
        const result = await apiCall(
          `${API_BASE_URL}/stages/${id}`,
          {
            method: 'DELETE'
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );
        
        setStages(prevStages => prevStages.filter(s => s.id !== id));
        return true;
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to direct Supabase client');
        
                 // Check if stage has deals first
         const { data: deals } = await (supabase as any)
           .from('deals')
           .select('id')
           .eq('stage_id', id)
           .limit(1);
         
         if (deals && deals.length > 0) {
           throw new Error('Cannot delete stage with existing deals');
         }
         
         const { error } = await (supabase as any)
           .from('deal_stages')
           .delete()
           .eq('id', id);
        
        if (error) throw error;
        
        setStages(prevStages => prevStages.filter(s => s.id !== id));
        return true;
      }
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