import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Target,
  Flag,
  Lightbulb,
  Zap,
  AlertTriangle,
  BarChart,
  PlayCircle,
  Rocket
} from 'lucide-react';

import { useImprovementRequests } from '@/lib/hooks/useImprovementRequests';
import { useUser } from '@/lib/hooks/useUser';
import {
  ImprovementRequest,
  ImprovementRequestStatus,
  ImprovementRequestPriority,
  ImprovementRequestCategory,
} from '@/types/improvementRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ImprovementRequestListProps {
  onEditRequest?: (request: ImprovementRequest) => void;
  onCreateRequest?: () => void;
}

type SortField = 'created_at' | 'title' | 'priority' | 'status' | 'category';
type SortOrder = 'asc' | 'desc';

const ImprovementRequestList: React.FC<ImprovementRequestListProps> = ({
  onEditRequest,
  onCreateRequest
}) => {
  const { userData } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ImprovementRequestStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ImprovementRequestPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ImprovementRequestCategory | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    requestId: string;
    requestTitle: string;
  }>({
    isOpen: false,
    requestId: '',
    requestTitle: ''
  });

  const { requests, isLoading, error, deleteRequest } = useImprovementRequests();

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(request => {
      // Search filter
      const searchMatch = !searchTerm || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || request.status === statusFilter;

      // Priority filter
      const priorityMatch = priorityFilter === 'all' || request.priority === priorityFilter;

      // Category filter
      const categoryMatch = categoryFilter === 'all' || request.category === categoryFilter;

      return searchMatch && statusMatch && priorityMatch && categoryMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { suggested: 1, planned: 2, in_progress: 3, testing: 4, deployed: 5, cancelled: 6 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [requests, searchTerm, statusFilter, priorityFilter, categoryFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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

  const getCategoryIcon = (category: ImprovementRequestCategory) => {
    switch (category) {
      case 'ui': return <Zap className="w-4 h-4" />;
      case 'feature': return <Target className="w-4 h-4" />;
      case 'bug': return <AlertTriangle className="w-4 h-4" />;
      case 'performance': return <BarChart className="w-4 h-4" />;
      case 'workflow': return <PlayCircle className="w-4 h-4" />;
      case 'reporting': return <BarChart className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: ImprovementRequestStatus) => {
    switch (status) {
      case 'suggested': return <Lightbulb className="w-4 h-4" />;
      case 'planned': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'testing': return <Eye className="w-4 h-4" />;
      case 'deployed': return <Rocket className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ImprovementRequestStatus) => {
    switch (status) {
      case 'suggested': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'planned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'testing': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'deployed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: ImprovementRequestPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-800 rounded-lg w-48" />
          <div className="h-10 bg-gray-800 rounded-lg w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-6 h-32" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Improvement Requests</h1>
          <p className="text-gray-400 mt-1">
            Showing {filteredAndSortedRequests.length} of {requests.length} requests
          </p>
        </div>
        <Button 
          onClick={onCreateRequest}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Statuses</SelectItem>
            <SelectItem value="suggested" className="text-white hover:bg-gray-700">Suggested</SelectItem>
            <SelectItem value="planned" className="text-white hover:bg-gray-700">Planned</SelectItem>
            <SelectItem value="in_progress" className="text-white hover:bg-gray-700">In Progress</SelectItem>
            <SelectItem value="testing" className="text-white hover:bg-gray-700">Testing</SelectItem>
            <SelectItem value="deployed" className="text-white hover:bg-gray-700">Deployed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Priorities</SelectItem>
            <SelectItem value="urgent" className="text-white hover:bg-gray-700">Urgent</SelectItem>
            <SelectItem value="high" className="text-white hover:bg-gray-700">High</SelectItem>
            <SelectItem value="medium" className="text-white hover:bg-gray-700">Medium</SelectItem>
            <SelectItem value="low" className="text-white hover:bg-gray-700">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Categories</SelectItem>
            <SelectItem value="ui" className="text-white hover:bg-gray-700">UI/UX</SelectItem>
            <SelectItem value="feature" className="text-white hover:bg-gray-700">Feature</SelectItem>
            <SelectItem value="bug" className="text-white hover:bg-gray-700">Bug Fix</SelectItem>
            <SelectItem value="performance" className="text-white hover:bg-gray-700">Performance</SelectItem>
            <SelectItem value="workflow" className="text-white hover:bg-gray-700">Workflow</SelectItem>
            <SelectItem value="reporting" className="text-white hover:bg-gray-700">Reporting</SelectItem>
            <SelectItem value="other" className="text-white hover:bg-gray-700">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-');
          setSortField(field as SortField);
          setSortOrder(order as SortOrder);
        }}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="created_at-desc" className="text-white hover:bg-gray-700">Newest First</SelectItem>
            <SelectItem value="created_at-asc" className="text-white hover:bg-gray-700">Oldest First</SelectItem>
            <SelectItem value="title-asc" className="text-white hover:bg-gray-700">Title A-Z</SelectItem>
            <SelectItem value="title-desc" className="text-white hover:bg-gray-700">Title Z-A</SelectItem>
            <SelectItem value="priority-desc" className="text-white hover:bg-gray-700">Priority High-Low</SelectItem>
            <SelectItem value="priority-asc" className="text-white hover:bg-gray-700">Priority Low-High</SelectItem>
            <SelectItem value="status-asc" className="text-white hover:bg-gray-700">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedRequests.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-6
                hover:bg-gray-800/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-gray-400">
                      {getCategoryIcon(request.category)}
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {request.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                      <span className="text-sm text-gray-400 capitalize">{request.priority}</span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                    {request.title}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {request.description}
                  </p>

                  {/* Impact and Effort */}
                  {(request.business_impact || request.effort_estimate) && (
                    <div className="flex items-center gap-6 mb-4 text-sm">
                      {request.business_impact && (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">
                            <span className="text-white capitalize">{request.business_impact}</span> business impact
                          </span>
                        </div>
                      )}
                      {request.effort_estimate && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">
                            <span className="text-white capitalize">{request.effort_estimate}</span> effort
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {request.requester && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          {request.requester.avatar_url ? (
                            <AvatarImage src={request.requester.avatar_url} />
                          ) : (
                            <AvatarFallback className="bg-blue-600 text-xs">
                              {request.requester.first_name?.[0]}{request.requester.last_name?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>
                          {request.requester.first_name} {request.requester.last_name}
                        </span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(request.created_at))} ago</span>
                    {request.assignee && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Assigned to {request.assignee.first_name} {request.assignee.last_name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {onEditRequest && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditRequest(request)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm({ 
                      isOpen: true, 
                      requestId: request.id, 
                      requestTitle: request.title 
                    })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAndSortedRequests.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No requests found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first improvement request.'
              }
            </p>
            {onCreateRequest && (
              <Button onClick={onCreateRequest} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            )}
          </div>
        )}
      </div>

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

export default ImprovementRequestList;