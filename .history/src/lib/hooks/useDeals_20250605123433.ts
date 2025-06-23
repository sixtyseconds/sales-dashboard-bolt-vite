import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

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
  
  // Joined relationship data from Supabase
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

  // Fetch deals from Supabase
  const fetchDeals = useCallback(async () => {
    if (!ownerId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch deals with relationships
      let query = supabase
        .from('deals')
        .select(`
          *,
          deal_stages (
            id,
            name,
            color,
            default_probability
          ),
          companies (
            id,
            name,
            domain,
            size,
            industry,
            website,
            linkedin_url
          ),
          contacts (
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            title,
            linkedin_url,
            is_primary
          )
        `)
        .eq('owner_id', ownerId)
        .order('updated_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Process the data to add computed fields
      const processedDeals = (data || []).map((deal: any) => {
        const now = new Date();
        const stageChangedAt = new Date(deal.stage_changed_at || deal.created_at);
        const daysInStage = Math.floor((now.getTime() - stageChangedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let timeStatus: 'normal' | 'warning' | 'danger' = 'normal';
        if (daysInStage > 30) timeStatus = 'danger';
        else if (daysInStage > 14) timeStatus = 'warning';
        
        return {
          ...deal,
          daysInStage,
          timeStatus
        };
      });
      
      setDeals(processedDeals);
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch deals');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  // Fetch stages from Supabase
  const fetchStages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deal_stages')
        .select('*')
        .order('order_position', { ascending: true });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setStages(data || []);
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
      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Deal created successfully');
      await fetchDeals(); // Refresh to get updated data
      return true;
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error(error.message || 'Failed to create deal');
      return false;
    }
  };

  const updateDeal = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

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

      if (error) {
        throw new Error(error.message);
      }

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
      const { data, error } = await supabase
        .from('deals')
        .update({ 
          stage_id: stageId,
          stage_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

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