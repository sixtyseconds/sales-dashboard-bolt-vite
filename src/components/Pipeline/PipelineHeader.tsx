import React, { useState } from 'react';
import { Search, Filter, PlusCircle } from 'lucide-react';
import { usePipeline } from '@/lib/contexts/PipelineContext';

interface PipelineHeaderProps {
  onAddDealClick: () => void;
}

export function PipelineHeader({ onAddDealClick }: PipelineHeaderProps) {
  const { 
    searchTerm, 
    setSearchTerm, 
    filterOptions, 
    setFilterOptions,
    pipelineValue,
    weightedPipelineValue
  } = usePipeline();
  
  const [showFilters, setShowFilters] = useState(false);
  
  const formattedPipelineValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(pipelineValue);
  
  const formattedWeightedValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(weightedPipelineValue);
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Tracker</h1>
          <p className="text-gray-400 mt-1">
            Manage and track your sales opportunities through each stage
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-sm text-gray-400">Pipeline Value</div>
            <div className="text-xl font-bold text-emerald-400">
              {formattedPipelineValue}
            </div>
            <div className="text-xs text-gray-500">
              Weighted: {formattedWeightedValue}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onAddDealClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
              hover:bg-emerald-500/20 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>New Deal</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              border transition-colors
              ${filterOptions.minValue || filterOptions.maxValue || filterOptions.probability || filterOptions.tags.length
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                : 'bg-gray-800/50 text-gray-400 border-gray-700'}
            `}
          >
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="flex items-center px-3 py-2 rounded-xl border border-gray-700
          bg-gray-800/50 w-full sm:w-auto max-w-md"
        >
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deals..."
            className="ml-2 bg-transparent border-none outline-none text-white w-full
              placeholder:text-gray-500"
          />
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div
          className="p-4 rounded-xl border border-gray-700 bg-gray-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Deal Value
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterOptions.minValue || ''}
                  onChange={(e) => setFilterOptions({
                    ...filterOptions,
                    minValue: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full p-2 rounded-lg border border-gray-700 bg-gray-900/80 text-white"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filterOptions.maxValue || ''}
                  onChange={(e) => setFilterOptions({
                    ...filterOptions,
                    maxValue: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full p-2 rounded-lg border border-gray-700 bg-gray-900/80 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Min Probability (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filterOptions.probability || 0}
                onChange={(e) => setFilterOptions({
                  ...filterOptions,
                  probability: Number(e.target.value) || null
                })}
                className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{filterOptions.probability || 0}%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilterOptions({
                  minValue: null,
                  maxValue: null,
                  probability: null,
                  tags: []
                })}
                className="w-full p-2 rounded-lg border border-gray-700 
                  bg-gray-900/80 text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 