import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useDeals } from '@/lib/hooks/useDeals';
import { useDealStages } from '@/lib/hooks/useDealStages';
import { useUser } from '@/lib/hooks/useUser';

interface FilterOptions {
  minValue: number | null;
  maxValue: number | null;
  probability: number | null;
  tags: string[];
  dateRange: {
    field: 'created_at' | 'expected_close_date' | 'stage_changed_at' | null;
    from: string | null;
    to: string | null;
  };
  stages: string[];
  priorities: string[];
  dealSizes: string[];
  leadSources: {
    types: string[];
    channels: string[];
  };
  daysInStage: {
    min: number | null;
    max: number | null;
  };
  timeStatus: Array<'normal' | 'warning' | 'danger'>;
  quickFilter: 'all' | 'my_deals' | 'hot_deals' | 'closing_soon' | 'stale_deals' | 'recent' | null;
}

interface StageMetric {
  stageId: string;
  stageName: string;
  count: number;
  value: number;
  weightedValue: number;
}

interface PipelineContextType {
  deals: any[];
  stages: any[];
  isLoading: boolean;
  error: any;
  createDeal: (dealData: any) => Promise<any>;
  updateDeal: (id: string, updates: any) => Promise<boolean>;
  deleteDeal: (id: string) => Promise<boolean>;
  moveDealToStage: (dealId: string, newStageId: string) => Promise<boolean>;
  forceUpdateDealStage: (dealId: string, stageId: string) => Promise<boolean>;
  refreshDeals: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  dealsByStage: Record<string, any[]>;
  pipelineValue: number;
  weightedPipelineValue: number;
  stageMetrics: StageMetric[];
  selectedOwnerId: string | undefined;
  setSelectedOwnerId: (ownerId: string | undefined) => void;
}

export const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

interface PipelineProviderProps {
  children: ReactNode;
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  // Get current user to use as default owner
  const { userData } = useUser();
  
  // Use current user's ID as default owner if available
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(userData?.id);
  
  // Update selectedOwnerId when user data loads
  useEffect(() => {
    if (userData?.id && !selectedOwnerId) {
      setSelectedOwnerId(userData.id);
    }
  }, [userData?.id, selectedOwnerId]);
  
  // Get the stages first
  const {
    stages,
    isLoading: isLoadingStages,
    error: stagesError
  } = useDealStages();
  
  // Get deals with owner filtering
  const { 
    deals, 
    isLoading: isLoadingDeals, 
    error: dealsError,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    forceUpdateDealStage,
    refreshDeals
  } = useDeals(selectedOwnerId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minValue: null,
    maxValue: null,
    probability: null,
    tags: [],
    dateRange: {
      field: null,
      from: null,
      to: null
    },
    stages: [],
    priorities: [],
    dealSizes: [],
    leadSources: {
      types: [],
      channels: []
    },
    daysInStage: {
      min: null,
      max: null
    },
    timeStatus: [],
    quickFilter: null
  });

  // Helper functions using useCallback to stabilize references
  const matchesSearch = useCallback((deal: any, term: string) => {
    const searchLower = term.toLowerCase();
    return (
      deal.name?.toLowerCase().includes(searchLower) ||
      deal.company?.toLowerCase().includes(searchLower) ||
      deal.contact_name?.toLowerCase().includes(searchLower) ||
      deal.value?.toString().includes(searchLower)
    );
  }, []);

  const applyQuickFilter = useCallback((deals: any[], quickFilter: string, currentUserId?: string) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    switch (quickFilter) {
      case 'my_deals':
        return deals.filter(deal => deal.owner_id === currentUserId);
      case 'hot_deals':
        // More realistic criteria: probability >= 50% OR value >= £5,000
        return deals.filter(deal => {
          const probability = deal.probability || 0;
          const value = deal.value || 0;
          return probability >= 50 || value >= 5000;
        });
      case 'closing_soon':
        // Extended to 30 days for better results
        return deals.filter(deal => {
          if (!deal.expected_close_date && !deal.close_date) return false;
          const closeDate = new Date(deal.expected_close_date || deal.close_date);
          return closeDate <= thirtyDaysFromNow && closeDate >= now;
        });
      case 'stale_deals':
        return deals.filter(deal => {
          const stageChangedAt = new Date(deal.stage_changed_at || deal.created_at);
          return stageChangedAt <= thirtyDaysAgo;
        });
      case 'recent':
        return deals.filter(deal => {
          const createdAt = new Date(deal.created_at);
          return createdAt >= thirtyDaysAgo;
        });
      default:
        return deals;
    }
  }, []);

  const matchesDateRange = useCallback((deal: any, dateRange: FilterOptions['dateRange']) => {
    if (!dateRange.field) return true;
    
    const dateValue = deal[dateRange.field];
    if (!dateValue) return false;
    
    const dealDate = new Date(dateValue);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    if (fromDate && dealDate < fromDate) return false;
    if (toDate && dealDate > toDate) return false;
    
    return true;
  }, []);

  const matchesLeadSource = useCallback((deal: any, leadSources: FilterOptions['leadSources']) => {
    const dealType = deal.lead_source_type || deal.leadSource?.type || 'unknown';
    const dealChannel = deal.lead_source_channel || deal.leadSource?.channel || 'unknown';
    
    let typeMatch = leadSources.types.length === 0 || leadSources.types.includes(dealType);
    let channelMatch = leadSources.channels.length === 0 || leadSources.channels.includes(dealChannel);
    
    return typeMatch && channelMatch;
  }, []);

  const getTimeStatus = useCallback((deal: any): 'normal' | 'warning' | 'danger' => {
    const daysInStage = deal.daysInStage || 0;
    
    if (daysInStage > 30) return 'danger';
    if (daysInStage > 14) return 'warning';
    return 'normal';
  }, []);
  
  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const groupedDeals: Record<string, any[]> = {};
    
    // Initialize with empty arrays for all stages
    if (stages) {
      stages.forEach(stage => {
        groupedDeals[stage.id] = [];
      });
    }
    
    // Filter and group deals
    if (deals) {
      let filteredDeals = [...deals];
      
      // Apply quick filters first
      if (filterOptions.quickFilter) {
        filteredDeals = applyQuickFilter(filteredDeals, filterOptions.quickFilter, userData?.id);
      }
      
      filteredDeals.forEach(deal => {
        // Apply search filter
        if (searchTerm && !matchesSearch(deal, searchTerm)) {
          return;
        }
        
        // Apply value filter
        if (filterOptions.minValue && Number(deal.value || 0) < filterOptions.minValue) {
          return;
        }
        if (filterOptions.maxValue && Number(deal.value || 0) > filterOptions.maxValue) {
          return;
        }
        
        // Apply probability filter
        if (filterOptions.probability && Number(deal.probability || 0) < filterOptions.probability) {
          return;
        }
        
        // Apply date range filter
        if (filterOptions.dateRange.field && (filterOptions.dateRange.from || filterOptions.dateRange.to)) {
          if (!matchesDateRange(deal, filterOptions.dateRange)) {
            return;
          }
        }
        
        // Apply stage filter
        if (filterOptions.stages.length > 0 && !filterOptions.stages.includes(deal.stage_id)) {
          return;
        }
        
        // Apply priority filter
        if (filterOptions.priorities.length > 0 && !filterOptions.priorities.includes((deal as any).priority || 'medium')) {
          return;
        }
        
        // Apply deal size filter
        if (filterOptions.dealSizes.length > 0 && !filterOptions.dealSizes.includes((deal as any).deal_size || 'medium')) {
          return;
        }
        
        // Apply lead source filter
        if (filterOptions.leadSources.types.length > 0 || filterOptions.leadSources.channels.length > 0) {
          if (!matchesLeadSource(deal, filterOptions.leadSources)) {
            return;
          }
        }
        
        // Apply days in stage filter
        if (filterOptions.daysInStage.min || filterOptions.daysInStage.max) {
          const daysInStage = deal.daysInStage || 0;
          if (filterOptions.daysInStage.min && daysInStage < filterOptions.daysInStage.min) {
            return;
          }
          if (filterOptions.daysInStage.max && daysInStage > filterOptions.daysInStage.max) {
            return;
          }
        }
        
        // Apply time status filter
        if (filterOptions.timeStatus.length > 0) {
          const timeStatus = getTimeStatus(deal);
          if (!filterOptions.timeStatus.includes(timeStatus)) {
            return;
          }
        }
        
        // Add deal to its stage group
        if (groupedDeals[deal.stage_id]) {
          groupedDeals[deal.stage_id].push(deal);
        }
      });
    }
    
    return groupedDeals;
  }, [deals, stages, searchTerm, filterOptions, userData?.id, applyQuickFilter, matchesSearch, matchesDateRange, matchesLeadSource, getTimeStatus]);
  
  // Calculate pipeline value (total of all deals)
  const pipelineValue = useMemo(() => {
    if (!deals) return 0;
    return deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  }, [deals]);
  
  // Calculate weighted pipeline value (based on probability)
  const weightedPipelineValue = useMemo(() => {
    if (!deals) return 0;
    return deals.reduce((sum, deal) => {
      const probability = deal.probability || deal.deal_stages?.default_probability || 0;
      return sum + (Number(deal.value || 0) * (Number(probability) / 100));
    }, 0);
  }, [deals]);
  
  // Calculate total count and value by stage
  const stageMetrics = useMemo(() => {
    if (!deals || !stages) return [];
    
    const metrics = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      const weightedValue = stageDeals.reduce((sum, deal) => {
        const probability = deal.probability || deal.deal_stages?.default_probability || stage.default_probability || 0;
        return sum + (Number(deal.value || 0) * (probability / 100));
      }, 0);
      
      return {
        stageId: stage.id,
        stageName: stage.name,
        count,
        value,
        weightedValue
      };
    });
    
    return metrics;
  }, [deals, stages]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    deals,
    stages,
    isLoading: isLoadingDeals || isLoadingStages,
    error: dealsError || stagesError,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    forceUpdateDealStage,
    refreshDeals,
    searchTerm,
    setSearchTerm,
    filterOptions,
    setFilterOptions,
    dealsByStage,
    pipelineValue,
    weightedPipelineValue,
    stageMetrics,
    selectedOwnerId,
    setSelectedOwnerId
  }), [
    deals, 
    stages, 
    isLoadingDeals, 
    isLoadingStages, 
    dealsError, 
    stagesError, 
    createDeal, 
    updateDeal, 
    deleteDeal, 
    moveDealToStage, 
    forceUpdateDealStage,
    refreshDeals, 
    searchTerm, 
    filterOptions, 
    dealsByStage, 
    pipelineValue, 
    weightedPipelineValue, 
    stageMetrics,
    selectedOwnerId,
    setSelectedOwnerId
  ]);
  
  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
} 