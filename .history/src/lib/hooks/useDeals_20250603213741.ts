import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8000/api';

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

export function useDeals() {
  const [deals, setDeals] = useState<DealWithRelationships[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch deals from Neon API with full CRM relationships
  const fetchDealsFromNeon = useCallback(async (): Promise<DealWithRelationships[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/deals`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching deals from Neon:', error);
      return [];
    }
  }, []);

  // Fetch stages from Neon API (consistent with deals)
  const fetchStages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stages`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching stages:', error);
      return [];
    }
  }, []);

  // Main fetch function
  const fetchDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both deals (from Neon) and stages (from Neon) in parallel
      const [neonDeals, stagesData] = await Promise.all([
        fetchDealsFromNeon(),
        fetchStages()
      ]);

      console.log('✅ Neon deals with CRM relationships:', neonDeals.length);
      console.log('✅ Neon stages:', stagesData.length);

      setDeals(neonDeals);
      setStages(stagesData);
    } catch (err) {
      console.error('❌ Error in fetchDeals:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchDealsFromNeon, fetchStages]);

  // Group deals by stage
  const dealsByStage = deals.reduce((acc, deal) => {
    if (!acc[deal.stage_id]) {
      acc[deal.stage_id] = [];
    }
    acc[deal.stage_id].push(deal);
    return acc;
  }, {} as Record<string, DealWithRelationships[]>);

  // Ensure all stages have empty arrays if no deals
  stages.forEach(stage => {
    if (!dealsByStage[stage.id]) {
      dealsByStage[stage.id] = [];
    }
  });

  // Initial load
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // CRUD operations (still using Supabase for deal mutations)
  const createDeal = async (dealData: any) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([dealData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal created successfully');
      await fetchDeals(); // Refresh to get updated data
      return data;
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error(error.message || 'Failed to create deal');
      return null;
    }
  };

  const updateDeal = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal updated successfully');
      await fetchDeals(); // Refresh to get updated data
      return true;
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error(error.message || 'Failed to update deal');
      return false;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Deal deleted successfully');
      await fetchDeals(); // Refresh data
      return true;
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error(error.message || 'Failed to delete deal');
      return false;
    }
  };

  const moveDealToStage = async (dealId: string, stageId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          stage_id: stageId,
          stage_changed_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;

      await fetchDeals(); // Refresh data
      return true;
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