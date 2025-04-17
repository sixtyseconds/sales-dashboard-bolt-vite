import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent, pointerWithin, rectIntersection, MeasuringStrategy } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { PipelineProvider, usePipeline } from '@/lib/contexts/PipelineContext';
import { PipelineHeader } from './PipelineHeader';
import { PipelineColumn } from './PipelineColumn';
import { DealCard } from './DealCard';
import { DealForm } from './DealForm';
import { PipelineTable } from './PipelineTable';
import { Loader2, ArrowDownUp } from 'lucide-react';
import EditDealModal from '@/components/EditDealModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { ConfettiService } from '@/lib/services/confettiService';

// Add a debug log to confirm Supabase is imported correctly
console.log("Pipeline component loaded with Supabase client:",
  supabase ? "Supabase client loaded successfully" : "Supabase client loading failed");

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
    refreshDeals
  } = usePipeline();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [localDealsByStage, setLocalDealsByStage] = useState<Record<string, any[]>>({});
  const [activeContainer, setActiveContainer] = useState<string | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [initialStageId, setInitialStageId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'alpha' | 'none'>('none');
  const lastValidOverContainerIdRef = React.useRef<string | null>(null); // Use ref instead of state
  const [refreshKey, setRefreshKey] = useState(0);

  // Update local state when the context data changes
  React.useEffect(() => {
    console.log("Context dealsByStage changed:",
      Object.keys(contextDealsByStage).map(stageId => ({
        stageId,
        dealCount: contextDealsByStage[stageId].length,
        deals: contextDealsByStage[stageId].map(d => ({ id: d.id, stage_id: d.stage_id }))
      }))
    );

    // Always update from context to ensure database changes are reflected in UI
    console.log("Updating localDealsByStage from context");
    setLocalDealsByStage(structuredClone(contextDealsByStage));

  }, [contextDealsByStage]);

  // Apply sorting to the local state
  React.useEffect(() => {
    if (sortBy === 'none') {
      // When sorting is off, ensure local state matches context state
      setLocalDealsByStage(contextDealsByStage);
      return;
    }

    const sortedDeals = {...localDealsByStage};

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

  // Ajout d'un effect pour réinitialiser les états de drag & drop
  React.useEffect(() => {
    return () => {
      // Réinitialiser les états à la destruction du composant
      setActiveContainer(null);
      setActiveDeal(null);
      lastValidOverContainerIdRef.current = null;
    };
  }, []);

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
    if (id in localDealsByStage) {
      return id;
    }

    return Object.keys(localDealsByStage).find(key =>
      localDealsByStage[key].some(item => item.id === id)
    );
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const { id } = active;

    console.log("Drag start with ID:", id);

    const activeContainer = findContainer(id);
    if (!activeContainer) return;

    setActiveContainer(activeContainer);

    // Find the deal across all stages in the local state
    for (const stageId in localDealsByStage) {
      const deal = localDealsByStage[stageId].find(d => d.id === id);
      if (deal) {
        console.log("Found deal to drag:", deal.company);
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

    if (!over) return;

    const { id: overId } = over;

    console.log("Dragging over:", overId);

    // Convertir les identifiants en chaînes
    const activeId = String(id);
    const overIdString = String(overId);

    const activeContainer = findContainer(activeId);
    let overContainer = findContainer(overIdString);

    // If dropping onto the column itself, overContainer might be undefined.
    // Check if overId is a stage ID.
    if (!overContainer && stages.find(s => s.id === overIdString)) {
        overContainer = overIdString;
    }

    // Toujours stocker la dernière cible valide, même si c'est la même colonne
    // Cela permet de pouvoir revenir à la colonne d'origine si nécessaire
    if (overContainer) {
      console.log(`Setting lastValidOverContainerIdRef to: ${overContainer}`);
      lastValidOverContainerIdRef.current = overContainer;
    }

    // Si on est sur la même colonne, ne pas faire de mise à jour
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Optimistic UI update during drag is handled here
    setLocalDealsByStage(prev => {
      const activeItems = prev[activeContainer] ? [...prev[activeContainer]] : [];
      const overItems = prev[overContainer] ? [...prev[overContainer]] : [];

      const activeIndex = activeItems.findIndex(item => item.id === activeId);
      if (activeIndex === -1) return prev; // Item not found

      const [movedItem] = activeItems.splice(activeIndex, 1);

      // Update the stage_id property of the moved item to match its new container
      movedItem.stage_id = overContainer;

      // Mettre à jour le deal_stages avec les informations du nouveau stage
      const newStage = stages.find(s => s.id === overContainer);
      if (newStage) {
        movedItem.deal_stages = {
          id: newStage.id,
          name: newStage.name,
          color: newStage.color,
          default_probability: newStage.default_probability
        };
      }

      let overIndex = overItems.findIndex(item => item.id === overIdString);

      // If dropping onto the column (container) itself
      if (overIdString === overContainer) {
          overIndex = overItems.length;
      }

      // If dropping onto another item
      if (overIndex !== -1) {
          overItems.splice(overIndex, 0, movedItem);
      } else {
          // If overIndex is -1 (likely dropping on container or empty space), add to end
          overItems.push(movedItem);
      }

      return {
          ...prev,
          [activeContainer]: activeItems,
          [overContainer]: overItems
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event; // Destructure active and over first
    const storedOverId = lastValidOverContainerIdRef.current; // Get value from ref

    // Add requested diagnostic logs
    console.log("Dragged card ID:", active.id);
    console.log("Dropped on column ID (from event):", over?.id);
    console.log("Dropped on column ID (from ref):", storedOverId);

    console.log("Drag end event:", event); // Existing log

    if (active.id && event?.active?.data.current?.stage_id) {
      await updateDeal(String(active.id), { stage_id: event?.active?.data.current?.stage_id });
    }

    // Explicitly reset all states related to dragging
    setActiveContainer(null);
    setActiveDeal(null);
    lastValidOverContainerIdRef.current = null;

    // Force a refresh of the component state after drag
    setTimeout(() => {
      setLocalDealsByStage(prev => ({...prev}));
    }, 50);

    // Prioritize the ID stored in the ref
    const finalOverId = storedOverId || over?.id;

    if (!finalOverId) {
      console.log("No valid over target found from ref or event");
      return;
    }

    const { id } = active;
    const eventOverId = over?.id; // Keep for logging comparison if needed
    console.log("Drag ID:", id, "Final Over ID (used for logic):", finalOverId, "Event Over ID:", eventOverId);

    // Convertir les identifiants en chaînes de caractères
    const activeId = String(id);
    const finalOverIdString = finalOverId ? String(finalOverId) : undefined;

    const activeContainer = findContainer(activeId);

    // Determine the target container using the finalOverId
    let targetContainer = finalOverIdString ? findContainer(finalOverIdString) : undefined;
    if (!targetContainer && finalOverIdString && stages.find(s => s.id === finalOverIdString)) {
        targetContainer = finalOverIdString;
    }

    // Find the deal being moved
    let dealBeingMoved: any = null;
    for (const stageId in localDealsByStage) {
      const foundDeal = localDealsByStage[stageId].find(d => d.id === activeId);
      if (foundDeal) {
        dealBeingMoved = foundDeal;
        break;
      }
    }

    if (!dealBeingMoved) {
      console.error("Could not find deal to move");
      return;
    }

    // Check if the deal's stage_id has already been updated in the local state during drag
    if (dealBeingMoved.stage_id !== targetContainer) {
      console.log("Updating dealBeingMoved.stage_id from", dealBeingMoved.stage_id, "to", targetContainer);
      dealBeingMoved.stage_id = targetContainer;
    }

    console.log("Deal being moved:", {
      id: dealBeingMoved.id,
      company: dealBeingMoved.company,
      oldStageId: activeContainer,
      newStageId: targetContainer // Use targetContainer here
    });

    // Keep a snapshot of the state before the optimistic update for potential rollback
    const previousLocalDealsByStage = structuredClone(localDealsByStage);

    console.log("Moving deal from", activeContainer, "to", targetContainer);

    // Optimistically update local UI state immediately
    setLocalDealsByStage(prev => {
      const activeItems = prev[activeContainer] ? [...prev[activeContainer]] : [];
      const overItems = prev[targetContainer] ? [...prev[targetContainer]] : [];
      const activeIndex = activeItems.findIndex(item => item.id === activeId);

      if (activeIndex === -1) return prev;

      const [movedItem] = activeItems.splice(activeIndex, 1);

      // Important: Update the stage_id property of the moved item
      movedItem.stage_id = targetContainer;

      // Mettre à jour le deal_stages avec les informations du nouveau stage
      const newStage = stages.find(s => s.id === targetContainer);
      if (newStage) {
        movedItem.deal_stages = {
          id: newStage.id,
          name: newStage.name,
          color: newStage.color,
          default_probability: newStage.default_probability
        };
      }

      console.log("Updated stage_id on moved item:", movedItem.stage_id);

      let overIndex = overItems.findIndex(item => item.id === finalOverId); // Check against finalOverId for positioning
      if (finalOverId === targetContainer) { // If dropped directly on container
          overIndex = overItems.length;
      }

      if (overIndex !== -1) {
         overItems.splice(overIndex, 0, movedItem);
      } else {
         overItems.push(movedItem);
      }

      console.log("Updated local state - moved item:", movedItem);

      const newState = {
          ...prev,
          [activeContainer]: activeItems,
          [targetContainer]: overItems
      };

      console.log("New localDealsByStage state:",
        Object.keys(newState).map(stageId => ({
          stageId,
          deals: newState[stageId].map(d => ({ id: d.id, stage_id: d.stage_id }))
        }))
      );

      return newState;
    });

    try {
        // Mise à jour du stage_id
        const updatePayload = {
            stage_id: targetContainer,
            stage_changed_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('deals')
            .update(updatePayload)
            .eq('id', activeId)
            .select();

        if (error) {
            throw error;
        }

        // Vérifier si le deal est déplacé vers "Closed Won"
        const closedWonStage = stages.find(stage => stage.name.toLowerCase() === 'closed won');
        if (closedWonStage && targetContainer === closedWonStage.id) {
            ConfettiService.celebrate();
            // toast.success("Deal won! 🎉");
        } /*else {
            toast.success("Deal moved successfully");
        }*/

        // Force un remontage complet du composant après l'opération
        setTimeout(() => {
          setRefreshKey(prev => prev + 1);
        }, 100);

        // ... rest of the existing code ...
    } catch (err) {
        // ... existing error handling ...
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    await deleteDeal(dealId);
    // Ignore le booléen retourné
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
            key={`dnd-context-${refreshKey}`}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always
              }
            }}
            autoScroll={{
              threshold: {
                x: 0.2,
                y: 0.2,
              },
              speed: {
                x: 10,
                y: 10
              },
              interval: 10
            }}
          >
            <div className="flex gap-4 overflow-x-auto pb-6">
              {stages.map(stage => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={localDealsByStage[stage.id] || []}
                  // deals={deals?.filter(deal => deal.stage_id === stage.id) || []}
                  onAddDealClick={() => handleAddDealClick(stage.id)}
                  onDealClick={handleDealClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDeal && (
                <DealCard
                  key={`overlay-${activeDeal.id}-${Date.now()}`}
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
        open={showDealForm}
        setOpen={setShowDealForm}
        deal={selectedDeal}
        onSave={handleSaveDeal}
        onDelete={handleDeleteDeal}
      />
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