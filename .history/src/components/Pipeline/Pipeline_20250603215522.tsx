import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  MeasuringStrategy,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { PipelineProvider, usePipeline } from '@/lib/contexts/PipelineContext';
import { PipelineHeader } from './PipelineHeader';
import { PipelineColumn } from './PipelineColumn';
import { DealCard } from './DealCard';
import { DealForm } from './DealForm';
import { PipelineTable } from './PipelineTable';
import { OwnerFilter } from '@/components/OwnerFilter';
import { Loader2, ArrowDownUp } from 'lucide-react';
import EditDealModal from '@/components/EditDealModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { ConfettiService } from '@/lib/services/confettiService';

console.log(
  'Pipeline component loaded with Supabase client:',
  supabase ? 'Supabase client loaded successfully' : 'Supabase client loading failed'
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl p-6 shadow-xl w-full max-w-xl border border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="space-y-6">
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
      <div className="flex gap-4 overflow-x-auto pb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="min-w-[320px] bg-gray-900/50 rounded-xl border border-gray-800/50 flex flex-col h-[600px]"
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

// --- DRAG AND DROP IMPROVEMENTS ---

function PipelineContent() {
  const {
    deals,
    stages,
    isLoading,
    error,
    dealsByStage: contextDealsByStage,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    forceUpdateDealStage,
    refreshDeals,
  } = usePipeline();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [localDealsByStage, setLocalDealsByStage] = useState<Record<string, any[]>>({});
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [initialStageId, setInitialStageId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'alpha' | 'none'>('none');
  const [refreshKey, setRefreshKey] = useState(0);

  // DnD state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFromStage, setDraggedFromStage] = useState<string | null>(null);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  // Keep a ref to the last valid over stage for drop fallback
  const lastValidOverStageRef = useRef<string | null>(null);

  // State for the complex EditDealModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Update local state when the context data changes
  useEffect(() => {
    setLocalDealsByStage(structuredClone(contextDealsByStage));
  }, [contextDealsByStage]);

  // Apply sorting to the local state
  useEffect(() => {
    if (sortBy === 'none') {
      setLocalDealsByStage(contextDealsByStage);
      return;
    }
    const sortedDeals = { ...localDealsByStage };
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
    setLocalDealsByStage(sortedDeals);
  }, [sortBy, contextDealsByStage]);

  useEffect(() => {
    return () => {
      setDraggedId(null);
      setDraggedFromStage(null);
      setDraggedOverStage(null);
      setDraggedOverIndex(null);
      lastValidOverStageRef.current = null;
      setActiveDeal(null);
    };
  }, []);

  // Configure sensors for drag operations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddDealClick = (stageId: string | null = null) => {
    setSelectedDeal(null);
    setInitialStageId(stageId);
    setShowDealForm(true);
  };

  const handleDealClick = (deal: any) => {
    // Find the deal in the current state (assuming 'deals' is the state from usePipeline)
    const foundDeal = deals.find(d => d.id === deal.id);

    // *** ADD THIS LOG ***
    console.log('>>> DEBUG: Deal object being passed to modal:', foundDeal);
 
    setSelectedDeal(foundDeal); // Or however you pass the deal data
    // Make sure this state setter corresponds to the EditDealModal if that's what's used
    setIsEditModalOpen(true); // Assuming setIsEditModalOpen controls EditDealModal
    setInitialStageId(null); // Clear initial stage ID when editing
  };

  const handleSaveDeal = async (formData: any) => {
    let success = false;
    let savedOrCreatedDeal = null; // To hold the result for logging

    if (selectedDeal) {
      // Update existing deal
      console.log("handleSaveDeal: Updating deal ID:", selectedDeal.id);
      success = await updateDeal(selectedDeal.id, formData);
      // If updateDeal doesn't return the updated deal, we might need to fetch it
      // For now, let's assume the 'deals' state will update via subscription/refetch
    } else {
      // Create new deal
      console.log("handleSaveDeal: Creating new deal");
      savedOrCreatedDeal = await createDeal(formData);
      success = !!savedOrCreatedDeal;
    }

    if (success) {
      // Access the 'deals' state from usePipeline right after the operation completes
      // NOTE: This might show state BEFORE the real-time subscription updates it fully.
      // A slight delay might be needed, or check state in a subsequent render cycle.
      console.log('>>> DEBUG: Deals state in Pipeline.tsx immediately after save operation:', deals);

      // Close the correct modal
      setShowDealForm(false); // Close the simple form modal if it was used
      setIsEditModalOpen(false); // Close the edit modal if it was used

    } else {
      console.error("handleSaveDeal: Save operation failed.");
      // Toast/error handling might already be in useDeals or EditDealModal
    }
    // Clear selection regardless of success/failure if appropriate
    // setSelectedDeal(null);
  };

  const toggleSorting = () => {
    const sortOptions: Array<'none' | 'value' | 'date' | 'alpha'> = [
      'none',
      'value',
      'date',
      'alpha',
    ];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'value':
        return 'Sort: Value ↓';
      case 'date':
        return 'Sort: Date ↓';
      case 'alpha':
        return 'Sort: A-Z';
      default:
        return 'Sort: Manual';
    }
  };

  // Find the stageId for a given dealId or stageId
  const findStageForId = (id: string): string | undefined => {
    if (id in localDealsByStage) return id;
    return Object.keys(localDealsByStage).find(stageId =>
      localDealsByStage[stageId].some(deal => deal.id === id)
    );
  };

  // --- DND HANDLERS ---

  // On drag start, set the draggedId and fromStage, and set activeDeal for overlay
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id);
    setDraggedId(id);
    const fromStage = findStageForId(id);
    setDraggedFromStage(fromStage || null);
    setDraggedOverStage(fromStage || null);
    setDraggedOverIndex(
      fromStage && localDealsByStage[fromStage]
        ? localDealsByStage[fromStage].findIndex(d => d.id === id)
        : null
    );
    // Set activeDeal for overlay
    let deal = null;
    for (const stageId in localDealsByStage) {
      deal = localDealsByStage[stageId].find(d => d.id === id);
      if (deal) break;
    }
    setActiveDeal(deal);
    // Disable sorting during drag
    if (sortBy !== 'none') setSortBy('none');
  };

  // On drag over, update the localDealsByStage for visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromStage = findStageForId(activeId);
    let toStage = findStageForId(overId);

    // If overId is a stageId (column), use it directly
    if (!toStage && stages.find(s => s.id === overId)) {
      toStage = overId;
    }
    if (!fromStage || !toStage) return;

    // If dropped on the same stage and same position, do nothing
    if (fromStage === toStage && overId === activeId) return;

    // Find the index in the target stage
    let toIndex = localDealsByStage[toStage].findIndex(d => d.id === overId);
    if (toIndex === -1 || overId === toStage) {
      // If dropped on the column itself or empty space, add to end
      toIndex = localDealsByStage[toStage].length;
    }

    // Prevent unnecessary updates
    if (
      draggedId === activeId &&
      draggedFromStage === fromStage &&
      draggedOverStage === toStage &&
      draggedOverIndex === toIndex
    ) {
      return;
    }

    // Store last valid over stage for drop fallback
    lastValidOverStageRef.current = toStage;

    // Optimistically update localDealsByStage for visual feedback
    setLocalDealsByStage(prev => {
      // Remove from old stage
      const fromDeals = [...prev[fromStage]];
      const dealIdx = fromDeals.findIndex(d => d.id === activeId);
      if (dealIdx === -1) return prev;
      const [deal] = fromDeals.splice(dealIdx, 1);

      // Insert into new stage
      const toDeals = [...prev[toStage]];
      // Prevent duplicate
      if (!toDeals.some(d => d.id === activeId)) {
        toDeals.splice(toIndex, 0, { ...deal, stage_id: toStage });
      }

      return {
        ...prev,
        [fromStage]: fromDeals,
        [toStage]: toDeals,
      };
    });

    setDraggedOverStage(toStage);
    setDraggedOverIndex(toIndex);
  };

  // On drag end, persist the change and clean up
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);

    // Determine the final stage
    let toStage = over ? findStageForId(String(over.id)) : null;
    if (!toStage && over && stages.find(s => s.id === String(over.id))) {
      toStage = String(over.id);
    }
    if (!toStage) {
      toStage = lastValidOverStageRef.current;
    }
    const fromStage = draggedFromStage;

    // If no move, cleanup and return
    if (!fromStage || !toStage || fromStage === toStage) {
      setDraggedId(null);
      setDraggedFromStage(null);
      setDraggedOverStage(null);
      setDraggedOverIndex(null);
      setActiveDeal(null);
      lastValidOverStageRef.current = null;
      return;
    }

    // Find the deal and its new index
    let toIndex = draggedOverIndex;
    if (over) {
      const overId = String(over.id);
      toIndex = localDealsByStage[toStage].findIndex(d => d.id === overId);
      if (toIndex === -1 || overId === toStage) {
        toIndex = localDealsByStage[toStage].length;
      }
    } else if (toIndex == null) {
      toIndex = localDealsByStage[toStage].length;
    }

    // Update localDealsByStage for final state
    setLocalDealsByStage(prev => {
      // Remove from old stage
      const fromDeals = [...prev[fromStage]];
      const dealIdx = fromDeals.findIndex(d => d.id === activeId);
      if (dealIdx === -1) return prev;
      const [deal] = fromDeals.splice(dealIdx, 1);

      // Insert into new stage
      const toDeals = [...prev[toStage]];
      // Remove if already present (shouldn't happen, but for safety)
      const existingIdx = toDeals.findIndex(d => d.id === activeId);
      if (existingIdx !== -1) toDeals.splice(existingIdx, 1);
      toDeals.splice(toIndex!, 0, { ...deal, stage_id: toStage });

      return {
        ...prev,
        [fromStage]: fromDeals,
        [toStage]: toDeals,
      };
    });

    // Persist to DB
    try {
      const updatePayload = {
        stage_id: toStage,
        stage_changed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('deals')
        .update(updatePayload)
        .eq('id', activeId)
        .select();
      if (error) throw error;

      // Celebrate if moved to Closed Won
      const closedWonStage = stages.find(
        stage => stage.name.toLowerCase() === 'closed won'
      );
      if (closedWonStage && toStage === closedWonStage.id) {
        ConfettiService.celebrate();
      }
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
    } catch (err) {
      // Optionally: rollback UI or show error
      toast.error('Failed to move deal. Please try again.');
    }

    // Cleanup
    setDraggedId(null);
    setDraggedFromStage(null);
    setDraggedOverStage(null);
    setDraggedOverIndex(null);
    setActiveDeal(null);
    lastValidOverStageRef.current = null;
  };

  const handleDeleteDeal = async (dealId: string) => {
    await deleteDeal(dealId);
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
                className="flex items-center gap-1.5 text-sm text-gray-400 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <ArrowDownUp className="w-4 h-4" />
                <span>{getSortLabel()}</span>
              </button>
            </div>
          </div>

          <DndContext
            key={`dnd-context-${refreshKey}`}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
            autoScroll={{
              threshold: {
                x: 0.2,
                y: 0.2,
              },
              interval: 10,
            }}
          >
            <div className="flex gap-4 overflow-x-auto pb-6">
              {stages.map(stage => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={localDealsByStage[stage.id] || []}
                  onAddDealClick={() => handleAddDealClick(stage.id)}
                  onDealClick={handleDealClick}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDeal && (
                <DealCard
                  key={`overlay-${activeDeal.id}`}
                  deal={activeDeal}
                  onClick={() => {}}
                  isDragOverlay={true}
                />
              )}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        <PipelineTable
          onDealClick={handleDealClick}
          onDeleteDeal={handleDeleteDeal}
        />
      )}

      <EditDealModal
        key={selectedDeal?.id}
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        deal={selectedDeal}
        onSave={handleSaveDeal}
        onDelete={handleDeleteDeal}
      />

      <Modal
        isOpen={showDealForm && !isEditModalOpen} // Ensure only one modal opens
        onClose={() => setShowDealForm(false)}
      >
        <DealForm
          key={initialStageId || 'new-deal'} // Add key for reset
          deal={null} // Ensure it's always null for new deals via this path
          onSave={handleSaveDeal}
          onCancel={() => setShowDealForm(false)}
          initialStageId={initialStageId}
        />
      </Modal>
    </>
  );
}

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