import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  TestTube, 
  XCircle, 
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  User,
  Lightbulb,
  Bug,
  ArrowUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoadmap, RoadmapSuggestion } from '@/lib/hooks/useRoadmap';
import { useUser } from '@/lib/hooks/useUser';
import { RoadmapColumn } from './RoadmapColumn';
import { SuggestionCard } from './SuggestionCard';
import { format } from 'date-fns';

const STATUSES = {
  submitted: {
    title: 'Submitted',
    icon: Eye,
    color: 'gray',
    description: 'New suggestions awaiting review'
  },
  under_review: {
    title: 'Under Review',
    icon: Clock,
    color: 'yellow',
    description: 'Being evaluated by the team'
  },
  in_progress: {
    title: 'In Progress',
    icon: PlayCircle,
    color: 'blue',
    description: 'Currently being developed'
  },
  testing: {
    title: 'Testing',
    icon: TestTube,
    color: 'purple',
    description: 'In quality assurance testing'
  },
  completed: {
    title: 'Completed',
    icon: CheckCircle2,
    color: 'green',
    description: 'Successfully implemented'
  },
  rejected: {
    title: 'Rejected',
    icon: XCircle,
    color: 'red',
    description: 'Not proceeding with implementation'
  }
} as const;

interface RoadmapKanbanProps {
  suggestions: RoadmapSuggestion[];
}

export function RoadmapKanban({ suggestions }: RoadmapKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { updateSuggestion, voteForSuggestion, removeVote } = useRoadmap();
  const { userData } = useUser();
  const isAdmin = userData?.is_admin || false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group suggestions by status
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, RoadmapSuggestion[]> = {};
    
    Object.keys(STATUSES).forEach(status => {
      groups[status] = suggestions.filter(s => s.status === status);
    });
    
    return groups;
  }, [suggestions]);

  const activeSuggestion = activeId ? suggestions.find(s => s.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !isAdmin) return;

    const suggestionId = active.id as string;
    const newStatus = over.id as RoadmapSuggestion['status'];
    const suggestion = suggestions.find(s => s.id === suggestionId);

    if (!suggestion || suggestion.status === newStatus) return;

    try {
      const updates: Partial<RoadmapSuggestion> = { status: newStatus };
      
      // Auto-set completion date when moved to completed
      if (newStatus === 'completed' && !suggestion.completion_date) {
        updates.completion_date = new Date().toISOString();
      }

      await updateSuggestion(suggestionId, updates);
      
      toast.success(`Moved suggestion to ${STATUSES[newStatus].title}`);
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      toast.error('Failed to update suggestion status');
    }
  };

  const handleVote = async (suggestionId: string, hasVoted: boolean) => {
    try {
      if (hasVoted) {
        await removeVote(suggestionId);
        toast.success('Vote removed');
      } else {
        await voteForSuggestion(suggestionId);
        toast.success('Vote added');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to update vote');
    }
  };

  const getTypeIcon = (type: RoadmapSuggestion['type']) => {
    switch (type) {
      case 'feature':
        return Lightbulb;
      case 'bug':
        return Bug;
      case 'improvement':
        return ArrowUp;
      case 'other':
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const priorityColorClasses = {
    critical: 'text-red-500 bg-red-500/10 border-red-500/20',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    low: 'text-green-500 bg-green-500/10 border-green-500/20'
  } as const;

  const getPriorityColor = (priority: RoadmapSuggestion['priority']) => {
    return priorityColorClasses[priority] || 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          <SortableContext
            items={Object.keys(STATUSES)}
            strategy={horizontalListSortingStrategy}
          >
            {Object.entries(STATUSES).map(([statusKey, statusConfig]) => (
              <RoadmapColumn
                key={statusKey}
                id={statusKey}
                title={statusConfig.title}
                icon={statusConfig.icon}
                color={statusConfig.color}
                description={statusConfig.description}
                count={groupedSuggestions[statusKey]?.length || 0}
                isAdmin={isAdmin}
              >
                <div className="space-y-3">
                  {groupedSuggestions[statusKey]?.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onVote={handleVote}
                      isAdmin={isAdmin}
                      isDragging={activeId === suggestion.id}
                    />
                  ))}
                </div>
              </RoadmapColumn>
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeSuggestion && (
            <SuggestionCard
              suggestion={activeSuggestion}
              onVote={handleVote}
              isAdmin={isAdmin}
              isDragging={true}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}