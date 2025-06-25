import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ImprovementRequest,
  CreateImprovementRequestData,
  UpdateImprovementRequestData,
  ImprovementRequestFilters,
} from '@/types/improvementRequests';

export const useImprovementRequests = (filters?: ImprovementRequestFilters) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Fetch improvement requests
  const {
    data: requests = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['improvement-requests', filters],
    queryFn: async (): Promise<ImprovementRequest[]> => {
      let query = supabase
        .from('improvement_requests')
        .select(`
          *,
          requester:requested_by(id, first_name, last_name, email, avatar_url),
          assignee:assigned_to(id, first_name, last_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching improvement requests:', error);
        throw new Error(error.message);
      }

      return data || [];
    },
    staleTime: 30000, // 30 seconds
  });

  // Create improvement request
  const createMutation = useMutation({
    mutationFn: async (data: CreateImprovementRequestData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const requestData = {
        ...data,
        requested_by: user.user.id,
      };

      const { data: newRequest, error } = await supabase
        .from('improvement_requests')
        .insert(requestData)
        .select(`
          *,
          requester:requested_by(id, first_name, last_name, email, avatar_url),
          assignee:assigned_to(id, first_name, last_name, email, avatar_url)
        `)
        .single();

      if (error) throw new Error(error.message);
      return newRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-requests'] });
      toast.success('Improvement request created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create request: ${error.message}`);
      setError(error);
    },
  });

  // Update improvement request
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateImprovementRequestData }) => {
      const { data: updatedRequest, error } = await supabase
        .from('improvement_requests')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          requester:requested_by(id, first_name, last_name, email, avatar_url),
          assignee:assigned_to(id, first_name, last_name, email, avatar_url)
        `)
        .single();

      if (error) throw new Error(error.message);
      return updatedRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-requests'] });
      toast.success('Request updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update request: ${error.message}`);
      setError(error);
    },
  });

  // Delete improvement request
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('improvement_requests')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvement-requests'] });
      toast.success('Request deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete request: ${error.message}`);
      setError(error);
    },
  });

  // Helper functions
  const createRequest = useCallback(
    (data: CreateImprovementRequestData) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const updateRequest = useCallback(
    (id: string, data: UpdateImprovementRequestData) => {
      return updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const deleteRequest = useCallback(
    (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const moveToStatus = useCallback(
    (id: string, status: ImprovementRequest['status']) => {
      return updateRequest(id, { status });
    },
    [updateRequest]
  );

  // Clear error when requests change
  useEffect(() => {
    if (error && requests.length > 0) {
      setError(null);
    }
  }, [requests, error]);

  return {
    requests,
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error || queryError,
    createRequest,
    updateRequest,
    deleteRequest,
    moveToStatus,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};