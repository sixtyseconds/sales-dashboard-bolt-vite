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
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Beaker,
  Rocket,
  Edit,
  Trash2,
  User,
  Calendar,
  Flag,
  Lightbulb,
  Zap,
  Target,
  BarChart
} from 'lucide-react';

import { useImprovementRequests } from '@/lib/hooks/useImprovementRequests';
import { useUser } from '@/lib/hooks/useUser';
import { ImprovementRequest, ImprovementRequestStatus } from '@/types/improvementRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ImprovementRequestKanbanProps {
  onEditRequest?: (request: ImprovementRequest) => void;
  onCreateRequest?: (status?: ImprovementRequestStatus) => void;
}

interface RequestStage {
  id: ImprovementRequestStatus;
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const requestStages: RequestStage[] = [
  {
    id: 'suggested',
    name: 'Suggested',
    color: '#6B7280',
    icon: <Lightbulb className="w-4 h-4" />,
    description: 'New suggestions awaiting review'
  },
  {
    id: 'planned',
    name: 'Planned',
    color: '#3B82F6',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Approved and scheduled for development'
  },
  {
    id: 'in_progress',
    name: 'In Progress',
    color: '#F59E0B',
    icon: <PlayCircle className="w-4 h-4" />,
    description: 'Currently being worked on'
  },
  {
    id: 'testing',
    name: 'Testing',
    color: '#8B5CF6',
    icon: <Beaker className="w-4 h-4" />,
    description: 'Under review and testing'
  },
  {
    id: 'deployed',
    name: 'Deployed',
    color: '#10B981',
    icon: <Rocket className="w-4 h-4" />,
    description: 'Completed and live'
  }
];

const ImprovementRequestKanban: React.FC<ImprovementRequestKanbanProps> = ({
  onEditRequest,
  onCreateRequest
}) => {
  const { userData } = useUser();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    requestId: string;
    requestTitle: string;
  }>({
    isOpen: false,
    requestId: '',
    requestTitle: ''
  });

  const { requests, isLoading, error, updateRequest, deleteRequest, moveToStatus } = useImprovementRequests();

  // Group requests by status
  const requestsByStage = useMemo(() => {
    const grouped: Record<ImprovementRequestStatus, ImprovementRequest[]> = {
      suggested: [],
      planned: [],
      in_progress: [],
      testing: [],
      deployed: [],
      cancelled: [] // Not displayed in kanban but needed for type safety
    };

    requests.forEach(request => {
      if (request.status !== 'cancelled') {
        grouped[request.status].push(request);
      }
    });

    return grouped;
  }, [requests]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const requestId = String(active.id);
    const newStatus = String(over.id) as ImprovementRequestStatus;
    const request = requests.find(r => r.id === requestId);

    if (!request) return;

    try {
      await moveToStatus(requestId, newStatus);
      
      const stageName = requestStages.find(s => s.id === newStatus)?.name;
      toast.success(`Request moved to ${stageName}`);
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequest(requestId);
      setDeleteConfirm({ isOpen: false, requestId: '', requestTitle: '' });
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const handleCreateRequest = (stageId?: ImprovementRequestStatus) => {
    if (onCreateRequest) {
      onCreateRequest(stageId || 'suggested');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6 space-y-4">
          <div className="h-8 bg-gray-800 rounded-lg w-48" />
          <div className="h-4 bg-gray-800 rounded-lg w-80" />
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error loading requests</h3>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const activeDragRequest = activeDragId ? requests.find(r => r.id === activeDragId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Improvement Requests</h1>
          <p className="text-gray-400 mt-1">Track and manage dashboard improvement suggestions</p>
        </div>
        <Button 
          onClick={() => handleCreateRequest()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {requestStages.map(stage => (
            <RequestColumn
              key={stage.id}
              stage={stage}
              requests={requestsByStage[stage.id] || []}
              onEditRequest={onEditRequest}
              onDeleteRequest={(requestId, requestTitle) => 
                setDeleteConfirm({ isOpen: true, requestId, requestTitle })
              }
              onAddRequest={() => handleCreateRequest(stage.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragRequest ? (
            <RequestCard 
              request={activeDragRequest} 
              isDragging 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(isOpen) => !isOpen && setDeleteConfirm({ isOpen: false, requestId: '', requestTitle: ''})}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteConfirm.requestTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteConfirm({ isOpen: false, requestId: '', requestTitle: '' })}
              className="bg-gray-800 text-white hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteRequest(deleteConfirm.requestId)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Request Column Component
interface RequestColumnProps {
  stage: RequestStage;
  requests: ImprovementRequest[];
  onAddRequest: () => void;
  onEditRequest?: (request: ImprovementRequest) => void;
  onDeleteRequest: (requestId: string, requestTitle: string) => void;
}

const RequestColumn: React.FC<RequestColumnProps> = ({
  stage,
  requests,
  onAddRequest,
  onEditRequest,
  onDeleteRequest
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id
  });

  const requestIds = useMemo(() => requests.map(r => r.id), [requests]);

  return (
    <div
      ref={setNodeRef}
      className="min-w-[320px] max-w-[320px] bg-gray-900/50 backdrop-blur-xl
        rounded-xl border border-gray-800/50 flex flex-col max-h-[calc(100vh-200px)]"
      style={{
        transition: 'border-color 150ms ease',
        borderColor: isOver ? `${stage.color}80` : undefined
      }}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${stage.color}20` }}
          >
            <div style={{ color: stage.color }}>
              {stage.icon}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">{stage.name}</h3>
            <p className="text-xs text-gray-400">{stage.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="bg-gray-800/50 text-gray-300"
          >
            {requests.length}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddRequest}
            className="h-8 w-8 p-0 hover:bg-gray-800/50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <SortableContext items={requestIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            <AnimatePresence>
              {requests.map((request) => (
                <SortableRequestCard
                  key={request.id}
                  requestId={request.id}
                >
                  <RequestCard
                    request={request}
                    onEdit={() => onEditRequest?.(request)}
                    onDelete={() => onDeleteRequest(request.id, request.title)}
                  />
                </SortableRequestCard>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {requests.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No requests</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddRequest}
              className="text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Request Card Component
interface RequestCardProps {
  request: ImprovementRequest;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isDragging = false,
  onEdit,
  onDelete
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ui': return <Zap className="w-3 h-3" />;
      case 'feature': return <Target className="w-3 h-3" />;
      case 'bug': return <AlertTriangle className="w-3 h-3" />;
      case 'performance': return <BarChart className="w-3 h-3" />;
      case 'workflow': return <PlayCircle className="w-3 h-3" />;
      case 'reporting': return <BarChart className="w-3 h-3" />;
      default: return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getEffortColor = (effort?: string) => {
    switch (effort) {
      case 'xl': return 'text-red-400';
      case 'large': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'small': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 
        hover:bg-gray-700/50 transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-2xl shadow-blue-500/20 rotate-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">
            {getCategoryIcon(request.category)}
          </div>
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
            {request.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-600/50"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-white mb-2 line-clamp-2 leading-snug">
        {request.title}
      </h4>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-3 leading-relaxed">
        {request.description}
      </p>

      {/* Impact and Effort */}
      {(request.business_impact || request.effort_estimate) && (
        <div className="flex items-center gap-4 mb-3 text-xs">
          {request.business_impact && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-gray-500" />
              <span className={getImpactColor(request.business_impact)}>
                {request.business_impact} impact
              </span>
            </div>
          )}
          {request.effort_estimate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className={getEffortColor(request.effort_estimate)}>
                {request.effort_estimate}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          {request.requester && (
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                {request.requester.avatar_url ? (
                  <AvatarImage src={request.requester.avatar_url} />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-xs">
                    {request.requester.first_name?.[0]}{request.requester.last_name?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs text-gray-400">
                {request.requester.first_name} {request.requester.last_name}
              </span>
            </div>
          )}
        </div>
        
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(request.created_at))} ago
        </span>
      </div>
    </motion.div>
  );
};

// Sortable Request Card Component
interface SortableRequestCardProps {
  requestId: string;
  children: React.ReactNode;
}

const SortableRequestCard: React.FC<SortableRequestCardProps> = ({
  requestId,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: requestId
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

export default ImprovementRequestKanban;