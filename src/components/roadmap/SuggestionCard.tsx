import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  MessageSquare,
  Calendar,
  User,
  Lightbulb,
  Bug,
  ArrowUp,
  AlertTriangle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Target,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { RoadmapSuggestion } from '@/lib/hooks/useRoadmap';

interface SuggestionCardProps {
  suggestion: RoadmapSuggestion;
  onVote: (suggestionId: string, hasVoted: boolean) => void;
  isAdmin: boolean;
  isDragging?: boolean;
}

export function SuggestionCard({ suggestion, onVote, isAdmin, isDragging }: SuggestionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: suggestion.id,
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  const getTypeColor = (type: RoadmapSuggestion['type']) => {
    switch (type) {
      case 'feature':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'bug':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'improvement':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'other':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: RoadmapSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const TypeIcon = getTypeIcon(suggestion.type);

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...(isAdmin ? { ...attributes, ...listeners } : {})}
        className={`
          bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-4 
          hover:border-gray-600/50 transition-all duration-200 cursor-pointer group
          ${isDragging || isSortableDragging ? 'opacity-50 rotate-3 scale-105' : ''}
          ${isAdmin ? 'hover:shadow-lg' : ''}
        `}
        onClick={() => setShowDetails(true)}
        whileHover={{ y: -2 }}
        layout
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div className={`p-1.5 rounded-lg border ${getTypeColor(suggestion.type)}`}>
              <TypeIcon className="w-3 h-3" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(suggestion.priority)}`}>
              {suggestion.priority}
            </span>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem className="text-gray-300 hover:text-white">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white mb-2 line-clamp-2 leading-tight">
          {suggestion.title}
        </h4>

        {/* Description Preview */}
        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {suggestion.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>{suggestion.submitted_by_profile?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(suggestion.created_at), 'MMM d')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVote(suggestion.id, suggestion.hasUserVoted);
            }}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors
              ${suggestion.hasUserVoted 
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
              }
            `}
          >
            <ThumbsUp className="w-3 h-3" />
            <span>{suggestion.votes_count}</span>
          </button>

          <div className="flex items-center gap-2">
            {suggestion.estimated_effort && (
              <span className="flex items-center gap-1 text-gray-500">
                <Target className="w-3 h-3" />
                <span className="text-xs capitalize">{suggestion.estimated_effort}</span>
              </span>
            )}
            
            {suggestion.target_version && (
              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                v{suggestion.target_version}
              </span>
            )}
          </div>
        </div>

        {/* Completion Date for completed items */}
        {suggestion.status === 'completed' && suggestion.completion_date && (
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Clock className="w-3 h-3" />
              <span>Completed {format(new Date(suggestion.completion_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg border ${getTypeColor(suggestion.type)}`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority} priority
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300 capitalize">
                  {suggestion.type}
                </span>
              </div>
            </div>
            <DialogTitle className="text-xl">{suggestion.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                {suggestion.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Submitted By</h4>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">
                    {suggestion.submitted_by_profile?.full_name || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Submitted Date</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">
                    {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {suggestion.estimated_effort && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Estimated Effort</h4>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 capitalize">{suggestion.estimated_effort}</span>
                  </div>
                </div>
              )}

              {suggestion.target_version && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Target Version</h4>
                  <span className="text-gray-400">v{suggestion.target_version}</span>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {suggestion.admin_notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Admin Notes</h4>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">{suggestion.admin_notes}</p>
                </div>
              </div>
            )}

            {/* Voting Section */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onVote(suggestion.id, suggestion.hasUserVoted)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                    ${suggestion.hasUserVoted 
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                      : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-gray-700'
                    }
                  `}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{suggestion.hasUserVoted ? 'Voted' : 'Vote'}</span>
                  <span className="text-xs">({suggestion.votes_count})</span>
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                Status: <span className="capitalize">{suggestion.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}