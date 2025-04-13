import React, { useState } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { PipelineProvider, usePipeline } from '@/lib/contexts/PipelineContext';
import { PipelineHeader } from './PipelineHeader';
import { PipelineColumn } from './PipelineColumn';
import { DealCard } from './DealCard';
import { DealForm } from './DealForm';
import { PipelineTable } from './PipelineTable';
import { Loader2, ArrowDownUp } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Modal component for deal form
function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
        flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl p-6 shadow-xl w-full max-w-xl
          border border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Loading skeleton for pipeline
function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="mb-6 space-y-4">
        <div className="h-8 bg-gray-800 rounded-lg w-48" />
        <div className="h-4 bg-gray-800 rounded-lg w-80" />
        
        <div className="flex justify-between mt-4">
          <div className="flex gap-2">
            <div className="h-10 bg-gray-800 rounded-lg w-32" />
            <div className="h-10 bg-gray-800 rounded-lg w-24" />
          </div>
          <div className="h-10 bg-gray-800 rounded-lg w-64" />
        </div>
      </div>
      
      {/* Pipeline columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="min-w-[320px] bg-gray-900/50 rounded-xl
            border border-gray-800/50 flex flex-col h-[600px]"
          >
            <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md bg-gray-800" />
                <div className="h-5 bg-gray-800 rounded-lg w-20" />
              </div>
              <div className="bg-gray-800/50 rounded-full w-8 h-5" />
            </div>
            
            <div className="p-4 space-y-3 flex-1">
              {[1, 2, 3].map(j => (
                <div key={j} className="bg-gray-800/50 rounded-xl p-4 h-32" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pipeline content component - uses the context
function PipelineContent() {
  const { 
    stages, 
    dealsByStage: initialDealsByStage, 
    isLoading, 
    error, 
    moveDealToStage,
    createDeal,
    updateDeal,
    deleteDeal
  } = usePipeline();
  
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dealsByStage, setDealsByStage] = useState<Record<string, any[]>>({});
  const [activeContainer, setActiveContainer] = useState<string | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [initialStageId, setInitialStageId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'alpha' | 'none'>('none');
  
  // Update local state when pipeline data changes
  React.useEffect(() => {
    setDealsByStage(initialDealsByStage);
  }, [initialDealsByStage]);
  
  // Apply sorting to deals
  React.useEffect(() => {
    if (sortBy === 'none') return;
    
    const sortedDeals = {...dealsByStage};
    
    Object.keys(sortedDeals).forEach(stageId => {
      sortedDeals[stageId] = [...sortedDeals[stageId]].sort((a, b) => {
        switch (sortBy) {
          case 'value':
            return b.value - a.value;
          case 'date':
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case 'alpha':
            return (a.company || '').localeCompare(b.company || '');
          default:
            return 0;
        }
      });
    });
    
    setDealsByStage(sortedDeals);
  }, [sortBy, initialDealsByStage]);
  
  // Configure sensors for drag operations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );
  
  const handleAddDealClick = (stageId: string | null = null) => {
    setSelectedDeal(null);
    setInitialStageId(stageId);
    setShowDealForm(true);
  };
  
  const handleDealClick = (deal: any) => {
    setSelectedDeal(deal);
    setInitialStageId(null);
    setShowDealForm(true);
  };
  
  const handleSaveDeal = async (formData: any) => {
    if (selectedDeal) {
      await updateDeal(selectedDeal.id, formData);
    } else {
      await createDeal(formData);
    }
    setShowDealForm(false);
  };
  
  const toggleSorting = () => {
    const sortOptions: Array<'value' | 'date' | 'alpha' | 'none'> = ['none', 'value', 'date', 'alpha'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };
  
  const getSortLabel = () => {
    switch (sortBy) {
      case 'value': return 'Sort: Value ↓';
      case 'date': return 'Sort: Date ↓';
      case 'alpha': return 'Sort: A-Z';
      default: return 'Sort: Manual';
    }
  };
  
  const findContainer = (id: string) => {
    if (id in dealsByStage) {
      return id;
    }
    
    return Object.keys(dealsByStage).find(key => 
      dealsByStage[key].some(item => item.id === id)
    );
  };
  
  const handleDragStart = (event: any) => {
    const { active } = event;
    const { id } = active;
    
    const activeContainer = findContainer(id);
    if (!activeContainer) return;
    
    setActiveContainer(activeContainer);
    
    // Find the deal across all stages
    for (const stageId in dealsByStage) {
      const deal = dealsByStage[stageId].find(d => d.id === id);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
    
    // When dragging starts, disable any automatic sorting
    if (sortBy !== 'none') {
      setSortBy('none');
    }
  };
  
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    const { id } = active;
    
    // Do nothing if not over anything
    if (!over) return;
    
    const { id: overId } = over;
    
    // Find the containers
    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);
    
    if (!activeContainer || !overContainer) {
      return;
    }
    
    // If we're hovering over a different container
    if (activeContainer !== overContainer) {
      setDealsByStage(prev => {
        const activeItems = [...prev[activeContainer]];
        const overItems = [...prev[overContainer]];
        
        // Find the indexes
        const activeIndex = activeItems.findIndex(item => item.id === id);
        
        // Check if we're over a container or an item
        if (overId === overContainer) {
          // If hovering over the container itself, place at the end
          return {
            ...prev,
            [activeContainer]: prev[activeContainer].filter(item => item.id !== id),
            [overContainer]: [...overItems, activeItems[activeIndex]]
          };
        } else {
          // If hovering over an item, find the closest position
          const overIndex = overItems.findIndex(item => item.id === overId);
          
          if (overIndex !== -1) {
            return {
              ...prev,
              [activeContainer]: prev[activeContainer].filter(item => item.id !== id),
              [overContainer]: [
                ...overItems.slice(0, overIndex),
                activeItems[activeIndex],
                ...overItems.slice(overIndex)
              ]
            };
          }
          
          return prev;
        }
      });
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset active states
    setActiveContainer(null);
    setActiveDeal(null);
    
    // Exit if we're not over anything
    if (!over) return;
    
    const { id } = active;
    const { id: overId } = over;
    
    // Find the containers
    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);
    
    if (!activeContainer || !overContainer) {
      return;
    }
    
    // If the item was dropped in a different container or position has changed
    if (activeContainer !== overContainer) {
      setDealsByStage(prev => {
        const activeItems = [...prev[activeContainer]];
        const overItems = [...prev[overContainer]];
        
        // Find the indexes
        const activeIndex = activeItems.findIndex(item => item.id === id);
        
        if (activeIndex === -1) {
          return prev;
        }
        
        // Save the active item
        const activeItem = activeItems[activeIndex];
        
        // Update the deal's stage in the backend
        const updatedDeal = { ...activeItem, stage_id: overContainer };
        
        // Attempt to move the deal
        moveDealToStage(id, overContainer);
        
        return prev;
      });
    }
  };
  
  if (isLoading) {
    return <PipelineSkeleton />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 mb-4">Error loading pipeline data</div>
        <div className="text-gray-400">{error.message}</div>
      </div>
    );
  }
  
  return (
    <>
      <PipelineHeader 
        onAddDealClick={() => handleAddDealClick()} 
        view={view}
        onViewChange={setView}
      />
      
      {view === 'kanban' ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleSorting}
                className="flex items-center gap-1.5 text-sm text-gray-400
                  px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50
                  hover:bg-gray-800 transition-colors"
              >
                <ArrowDownUp className="w-4 h-4" />
                <span>{getSortLabel()}</span>
              </button>
            </div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-6">
              {stages.map(stage => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={dealsByStage[stage.id] || []}
                  onAddDealClick={() => handleAddDealClick(stage.id)}
                  onDealClick={handleDealClick}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeDeal && <DealCard deal={activeDeal} index={0} />}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        <PipelineTable 
          onDealClick={handleDealClick} 
          onDeleteDeal={(id) => deleteDeal(id)} 
        />
      )}

      <Modal
        isOpen={showDealForm}
        onClose={() => setShowDealForm(false)}
      >
        <DealForm
          deal={selectedDeal}
          initialStageId={initialStageId}
          onSave={handleSaveDeal}
          onCancel={() => setShowDealForm(false)}
        />
      </Modal>
    </>
  );
}

// Main pipeline component with provider wrapper
export function Pipeline() {
  return (
    <PipelineProvider>
      <div className="max-w-full w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="px-4 sm:px-6 py-8 overflow-hidden">
          <div className="relative">
            <PipelineContent />
          </div>
        </div>
      </div>
    </PipelineProvider>
  );
} 