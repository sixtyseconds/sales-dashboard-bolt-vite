import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  dealsByStage: Record<string, any[]>;
  pipelineValue: number;
  weightedPipelineValue: number;
  stageMetrics: StageMetric[];
}

export const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

interface PipelineProviderProps {
  children: ReactNode;
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  const { 
    deals, 
    isLoading: isLoadingDeals, 
    error: dealsError,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage 
  } = useDeals();
  
  const {
    stages,
    isLoading: isLoadingStages,
    error: stagesError
  } = useDealStages();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minValue: null,
    maxValue: null,
    probability: null,
    tags: []
  });
  
  // Group deals by stage
  const dealsByStage = useCallback(() => {
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
        if (filterOptions.minValue && deal.value < filterOptions.minValue) {
          return;
        }
        if (filterOptions.maxValue && deal.value > filterOptions.maxValue) {
          return;
        }
        
        // Apply probability filter
        if (filterOptions.probability && deal.probability < filterOptions.probability) {
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
  const calculatePipelineValue = useCallback(() => {
    if (!deals) return 0;
    return deals.reduce((sum, deal) => sum + parseFloat(deal.value), 0);
  }, [deals]);
  
  // Calculate weighted pipeline value (based on probability)
  const calculateWeightedPipelineValue = useCallback(() => {
    if (!deals) return 0;
    return deals.reduce((sum, deal) => {
      const probability = deal.probability || deal.deal_stages?.default_probability || 0;
      return sum + (parseFloat(deal.value) * (probability / 100));
    }, 0);
  }, [deals]);
  
  // Calculate total count and value by stage
  const calculateStageMetrics = useCallback(() => {
    if (!deals || !stages) return [];
    
    const metrics = stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value), 0);
      
      return {
        stageId: stage.id,
        stageName: stage.name,
        count,
        value
      };
    });
    
    return metrics;
  }, [deals, stages]);
  
  const value = {
    deals,
    stages,
    isLoading: isLoadingDeals || isLoadingStages,
    error: dealsError || stagesError,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    searchTerm,
    setSearchTerm,
    filterOptions,
    setFilterOptions,
    dealsByStage: dealsByStage(),
    pipelineValue: calculatePipelineValue(),
    weightedPipelineValue: calculateWeightedPipelineValue(),
    stageMetrics: calculateStageMetrics()
  };
  
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