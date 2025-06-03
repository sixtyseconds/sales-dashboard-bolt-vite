import React, { useState } from 'react';
import { Search, Filter, PlusCircle, LayoutGrid, Table, X, DollarSign, Percent } from 'lucide-react';
import { usePipeline } from '@/lib/contexts/PipelineContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PipelineHeaderProps {
  onAddDealClick: () => void;
  view: 'kanban' | 'table';
  onViewChange: (view: 'kanban' | 'table') => void;
}

export function PipelineHeader({ onAddDealClick, view, onViewChange }: PipelineHeaderProps) {
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

  const hasActiveFilters = filterOptions.minValue || filterOptions.maxValue || filterOptions.probability || filterOptions.tags.length;
  
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
              ${hasActiveFilters
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30'
                : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50'}
            `}
          >
            <Filter className={`w-5 h-5 ${showFilters ? 'text-violet-400' : ''}`} />
            <span>
              {hasActiveFilters ? `Filters (${Object.values(filterOptions).filter(val => val !== null && val !== undefined && val.length !== 0).length})` : 'Filter'}
            </span>
          </button>
          
          <div className="border border-gray-700 rounded-xl overflow-hidden flex">
            <button 
              onClick={() => onViewChange('kanban')}
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${view === 'kanban' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <LayoutGrid className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button 
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${view === 'table' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <Table className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
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
      
      {/* Filter Panel with Animation */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/70 backdrop-blur-sm shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Filter Deals</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      Deal Value Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filterOptions.minValue || ''}
                          onChange={(e) => setFilterOptions({
                            ...filterOptions,
                            minValue: e.target.value ? Number(e.target.value) : null
                          })}
                          className="w-full p-3 pl-4 rounded-lg border border-gray-700 bg-gray-900/80 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                      <span className="text-gray-500">to</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="Max"
                          value={filterOptions.maxValue || ''}
                          onChange={(e) => setFilterOptions({
                            ...filterOptions,
                            maxValue: e.target.value ? Number(e.target.value) : null
                          })}
                          className="w-full p-3 pl-4 rounded-lg border border-gray-700 bg-gray-900/80 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                      <Percent className="w-4 h-4 mr-2 text-gray-400" />
                      Minimum Probability
                    </label>
                    <div className="px-1">
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
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">0%</span>
                        <span className="text-sm font-medium text-violet-400">
                          {filterOptions.probability || 0}%
                        </span>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end mt-6 gap-3">
                <button
                  onClick={() => setFilterOptions({
                    minValue: null,
                    maxValue: null,
                    probability: null,
                    tags: []
                  })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/70 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 