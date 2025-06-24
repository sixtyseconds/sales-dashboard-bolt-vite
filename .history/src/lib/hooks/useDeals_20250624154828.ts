import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/config';
import { fetchWithRetry, apiCall } from '@/lib/utils/apiUtils';

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
      
      // Fetch deals with relationships
      const dealsParams = new URLSearchParams({
        ownerId,
        includeRelationships: 'true'
      });
      
      const dealsResult = await apiCall<DealWithRelationships[]>(
        `${API_BASE_URL}/deals?${dealsParams}`,
        {},
        { maxRetries: 2, retryDelay: 1500 }
      );
      
      setDeals(dealsResult || []);
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch deals');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  // Fetch stages from API
  const fetchStages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stages: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error || 'Failed to fetch stages');
      }
      
      setStages(result.data || []);
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
      const response = await fetch(`${API_BASE_URL}/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create deal: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error || 'Failed to create deal');
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
      const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update deal: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error || 'Failed to update deal');
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
      const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete deal: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error || 'Failed to delete deal');
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
      const response = await fetch(`${API_BASE_URL}/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stage_id: stageId,
          stage_changed_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to move deal: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error || 'Failed to move deal');
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