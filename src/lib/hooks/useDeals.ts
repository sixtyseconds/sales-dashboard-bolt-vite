import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/config';
import { fetchWithRetry, apiCall } from '@/lib/utils/apiUtils';
import { supabase } from '@/lib/supabase/clientV2';
import { createClient } from '@supabase/supabase-js';

export interface DealWithRelationships {
  id: string;
  name: string;
  company: string;
  contact_name: string;
  value: number;
  status: string;
  stage_id: string;
  created_at: string;
  updated_at: string;
  stage_changed_at: string;
  probability: number;
  close_date: string;
  notes: string;
  owner_id: string;
  company_id?: string;
  primary_contact_id?: string;
  
  // Computed fields
  daysInStage: number;
  timeStatus: 'normal' | 'warning' | 'danger';
  
  // Joined relationship data from Neon (CRM)
  deal_stages?: {
    id: string;
    name: string;
    color: string;
    default_probability: number;
  };
  companies?: {
    id: string;
    name: string;
    domain: string;
    size: string;
    industry: string;
    website: string;
    linkedin_url: string;
  };
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    title: string;
    linkedin_url: string;
    is_primary: boolean;
  };
  deal_contacts?: Array<{
    contact_id: string;
    contact: {
      id: string;
      full_name: string;
      email: string;
      title: string;
    };
  }>;
}

export interface DealStage {
  id: string;
  name: string;
  color: string;
  order_position: number;
  default_probability: number;
}

export function useDeals(ownerId?: string) {
  const [deals, setDeals] = useState<DealWithRelationships[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch deals from API
  const fetchDeals = useCallback(async () => {
    if (!ownerId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check authentication first
      console.log('🔍 Checking user authentication for deals...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('⚠️ No session found - skipping Edge Functions, going straight to service key fallback...');
        
        // Skip Edge Functions entirely and go straight to service key fallback
        const serviceSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        );
        
        console.log('🛡️ Using service key fallback for deals (no auth)...');
        const { data: serviceDealsData, error: serviceError } = await (serviceSupabase as any)
          .from('deals')
          .select(`
            *,
            deal_stages:deal_stages(id, name, color, order_position, default_probability)
          `)
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });
          
        if (serviceError) {
          console.error('❌ Service key fallback failed:', serviceError);
          throw serviceError;
        }
        
        console.log(`✅ Service key fallback successful: Retrieved ${serviceDealsData?.length || 0} deals`);
        
        const processedDeals = serviceDealsData?.map((deal: any) => ({
          ...deal,
          company: deal.company || '', 
          contact_name: deal.contact_name || '', 
          daysInStage: deal.stage_changed_at 
            ? Math.floor((new Date().getTime() - new Date(deal.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          timeStatus: 'normal' as const
        })) || [];
        
        setDeals(processedDeals);
        setIsLoading(false);
        return;
      }

      // Try Edge Functions if authenticated
      console.log('🌐 User authenticated - trying Edge Functions...');
      try {
        const response = await apiCall<{ data: DealWithRelationships[] }>(
          `${API_BASE_URL}/deals?owner_id=${ownerId}&includeRelationships=true`
        );
        
        const processedDeals = response.data?.map((deal: any) => ({
          ...deal,
          company: deal.company || deal.companies?.name || '',
          contact_name: deal.contact_name || deal.contacts?.full_name || deal.contacts?.name || `${deal.contacts?.first_name || ''} ${deal.contacts?.last_name || ''}`.trim(),
          daysInStage: deal.stage_changed_at 
            ? Math.floor((new Date().getTime() - new Date(deal.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          timeStatus: 'normal' as const
        })) || [];
        
        setDeals(processedDeals);
        setIsLoading(false);
        return;
      } catch (edgeFunctionError) {
        console.log('Deals Edge Function failed, falling back to direct Supabase client:', edgeFunctionError);
        
        // Fallback to direct Supabase client
        console.log('🛡️ Using fallback: Direct Supabase client query...');
        const { data: dealsData, error: supabaseError } = await (supabase as any)
          .from('deals')
          .select(`
            *,
            deal_stages:deal_stages(id, name, color, order_position, default_probability)
          `)
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error('❌ Fallback query failed:', supabaseError);
          console.log('🔄 Trying with service role key...');
          
          // Last resort: try with service role key
          try {
            const serviceSupabase = createClient(
              import.meta.env.VITE_SUPABASE_URL,
              import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
            );
            
            const { data: serviceDealsData, error: serviceError } = await (serviceSupabase as any)
              .from('deals')
              .select(`
                *,
                deal_stages:deal_stages(id, name, color, order_position, default_probability)
              `)
              .eq('owner_id', ownerId)
              .order('created_at', { ascending: false });
              
            if (serviceError) {
              console.error('❌ Service key fallback also failed:', serviceError);
              throw serviceError;
            }
            
            console.log(`✅ Service key fallback successful: Retrieved ${serviceDealsData?.length || 0} deals`);
            
            // Process deals to match expected format
            const processedDeals = serviceDealsData?.map((deal: any) => ({
              ...deal,
              company: deal.company || '', 
              contact_name: deal.contact_name || '', 
              daysInStage: deal.stage_changed_at 
                ? Math.floor((new Date().getTime() - new Date(deal.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              timeStatus: 'normal' as const
            })) || [];
            
            setDeals(processedDeals);
            setIsLoading(false);
            return;
            
          } catch (serviceError) {
            console.error('❌ All fallback methods failed:', serviceError);
            throw serviceError;
          }
        }
        
        console.log(`✅ Fallback successful: Retrieved ${dealsData?.length || 0} deals`);
        
        // Process deals to match expected format
        const processedDeals = dealsData?.map((deal: any) => ({
          ...deal,
          company: deal.company || '', // Use existing company field from deals table
          contact_name: deal.contact_name || '', // Use existing contact_name field
          daysInStage: deal.stage_changed_at 
            ? Math.floor((new Date().getTime() - new Date(deal.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          timeStatus: 'normal' as const
        })) || [];
        
        setDeals(processedDeals);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch deals');
    }
  }, [ownerId]);

  // Fetch stages from API
  const fetchStages = useCallback(async () => {
    try {
      // Try Edge Function first
      try {
        const result = await apiCall<DealStage[]>(
          `${API_BASE_URL}/stages`,
          {},
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );
        
        setStages(result || []);
        return;
      } catch (edgeFunctionError) {
        console.warn('Stages Edge Function failed, falling back to direct Supabase client:', edgeFunctionError);
        
        // Fallback to direct Supabase client
        const { data: stagesData, error: supabaseError } = await (supabase as any)
          .from('deal_stages')
          .select('*')
          .order('order_position', { ascending: true });
        
        if (supabaseError) {
          throw supabaseError;
        }
        
        setStages(stagesData || []);
      }
    } catch (err: any) {
      console.error('Error fetching stages:', err);
      setError(err.message);
    }
  }, []);

  // Load data on mount and when ownerId changes
  useEffect(() => {
    fetchStages();
    if (ownerId) {
      fetchDeals();
    }
  }, [ownerId, fetchDeals, fetchStages]);

  // Group deals by stage for pipeline display
  const dealsByStage = deals.reduce((acc, deal) => {
    const stageId = deal.stage_id;
    if (!acc[stageId]) {
      acc[stageId] = [];
    }
    acc[stageId].push(deal);
    return acc;
  }, {} as Record<string, DealWithRelationships[]>);

  const createDeal = async (dealData: any) => {
    try {
      // Try Edge Function first
      try {
        const result = await apiCall(
          `${API_BASE_URL}/deals`,
          {
            method: 'POST',
            body: JSON.stringify(dealData),
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );

        toast.success('Deal created successfully');
        await fetchDeals(); // Refresh to get updated data
        return true;
      } catch (edgeFunctionError) {
        console.warn('Create deal Edge Function failed, falling back to direct Supabase client');
        
        // Fallback to direct Supabase client
        const { data: deal, error } = await (supabase as any)
          .from('deals')
          .insert({
            ...dealData,
            stage_changed_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        toast.success('Deal created successfully');
        await fetchDeals(); // Refresh to get updated data
        return true;
      }
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error(error.message || 'Failed to create deal');
      return false;
    }
  };

  const updateDeal = async (id: string, updates: any) => {
    try {
      // Try Edge Function first
      try {
        const result = await apiCall(
          `${API_BASE_URL}/deals/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(updates),
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );

        toast.success('Deal updated successfully');
        await fetchDeals(); // Refresh to get updated data
        return true;
      } catch (edgeFunctionError) {
        console.warn('Update deal Edge Function failed, falling back to direct Supabase client');
        
        // Fallback to direct Supabase client
        const updateData = { ...updates };
        if (updates.stage_id) {
          // Get current deal to check if stage is actually changing
          const { data: currentDeal } = await (supabase as any)
            .from('deals')
            .select('stage_id')
            .eq('id', id)
            .single();

          if (currentDeal && currentDeal.stage_id !== updates.stage_id) {
            updateData.stage_changed_at = new Date().toISOString();
          }
        }
        
        const { data: deal, error } = await (supabase as any)
          .from('deals')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        toast.success('Deal updated successfully');
        await fetchDeals(); // Refresh to get updated data
        return true;
      }
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error(error.message || 'Failed to update deal');
      return false;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      // Try Edge Function first
      try {
        const result = await apiCall(
          `${API_BASE_URL}/deals/${id}`,
          {
            method: 'DELETE',
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );

        toast.success('Deal deleted successfully');
        await fetchDeals(); // Refresh data
        return true;
      } catch (edgeFunctionError) {
        console.warn('Delete deal Edge Function failed, falling back to direct Supabase client');
        
        // Fallback to direct Supabase client
        const { error } = await (supabase as any)
          .from('deals')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast.success('Deal deleted successfully');
        await fetchDeals(); // Refresh data
        return true;
      }
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error(error.message || 'Failed to delete deal');
      return false;
    }
  };

  const moveDealToStage = async (dealId: string, stageId: string) => {
    try {
      // Try Edge Function first
      try {
        const result = await apiCall(
          `${API_BASE_URL}/deals/${dealId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ 
              stage_id: stageId,
              stage_changed_at: new Date().toISOString()
            }),
          },
          { maxRetries: 1, retryDelay: 1000, showToast: false }
        );

        await fetchDeals(); // Refresh data
        return true;
      } catch (edgeFunctionError) {
        console.warn('Move deal Edge Function failed, falling back to direct Supabase client');
        
        // Fallback to direct Supabase client
        const { data: deal, error } = await (supabase as any)
          .from('deals')
          .update({ 
            stage_id: stageId,
            stage_changed_at: new Date().toISOString()
          })
          .eq('id', dealId)
          .select()
          .single();
        
        if (error) throw error;
        
        await fetchDeals(); // Refresh data
        return true;
      }
    } catch (error: any) {
      console.error('Error moving deal:', error);
      toast.error(error.message || 'Failed to move deal');
      return false;
    }
  };

  const forceUpdateDealStage = async (dealId: string, stageId: string) => {
    return await moveDealToStage(dealId, stageId);
  };

  const refreshDeals = fetchDeals;

  return {
    deals,
    stages,
    dealsByStage,
    isLoading,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    forceUpdateDealStage,
    refreshDeals
  };
} 