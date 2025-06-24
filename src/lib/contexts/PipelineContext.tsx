import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useDeals } from '@/lib/hooks/useDeals';
import { useDealStages } from '@/lib/hooks/useDealStages';

interface FilterOptions {
  minValue: number | null;
  maxValue: number | null;
  probability: number | null;
  tags: string[];
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
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>();
  
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
    tags: []
  });
  
  // Group deals by stage
  const dealsByStage = useMemo(() => {
    console.log("Computing dealsByStage");
    const groupedDeals: Record<string, any[]> = {};
    
    // Initialize with empty arrays for all stages
    if (stages) {
      stages.forEach(stage => {
        groupedDeals[stage.id] = [];
      });
    }
    
    // Filter and group deals
    if (deals) {
      deals.forEach(deal => {
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
        
        // Add deal to its stage group
        if (groupedDeals[deal.stage_id]) {
          groupedDeals[deal.stage_id].push(deal);
        }
      });
    }
    
    return groupedDeals;
  }, [deals, stages, searchTerm, filterOptions]);
  
  // Helper for search matching
  const matchesSearch = (deal: any, term: string) => {
    const searchLower = term.toLowerCase();
    return (
      deal.name?.toLowerCase().includes(searchLower) ||
      deal.company?.toLowerCase().includes(searchLower) ||
      deal.contact_name?.toLowerCase().includes(searchLower) ||
      deal.value?.toString().includes(searchLower)
    );
  };
  
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
<<<<<<< HEAD
      const value = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
=======
      const value = stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value), 0);
      const weightedValue = stageDeals.reduce((sum, deal) => {
        const probability = deal.probability || deal.deal_stages?.default_probability || stage.default_probability || 0;
        return sum + (parseFloat(deal.value) * (probability / 100));
      }, 0);
>>>>>>> 35ad7d57db901d22563e8e963ab9cd9326307a8f
      
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