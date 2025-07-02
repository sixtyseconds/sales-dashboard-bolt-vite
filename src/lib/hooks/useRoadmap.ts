import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/clientV2';
import { useUser } from './useUser';

export interface RoadmapSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'under_review' | 'in_progress' | 'testing' | 'completed' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  assigned_to?: string;
  votes_count: number;
  estimated_effort?: 'small' | 'medium' | 'large' | 'extra_large';
  target_version?: string;
  completion_date?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  submitted_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  assigned_to_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  hasUserVoted: boolean;
}

export function useRoadmap() {
  const [suggestions, setSuggestions] = useState<RoadmapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useUser();

  const fetchSuggestions = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/roadmap', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const createSuggestion = async (suggestionData: {
    title: string;
    description: string;
    type: RoadmapSuggestion['type'];
    priority?: RoadmapSuggestion['priority'];
  }) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(suggestionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create suggestion');
    }

    const newSuggestion = await response.json();
    setSuggestions(prev => [newSuggestion, ...prev]);
    return newSuggestion;
  };

  const updateSuggestion = async (id: string, updates: Partial<RoadmapSuggestion>) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/roadmap?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update suggestion');
    }

    const updatedSuggestion = await response.json();
    setSuggestions(prev => 
      prev.map(s => s.id === id ? updatedSuggestion : s)
    );
    return updatedSuggestion;
  };

  const deleteSuggestion = async (id: string) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/roadmap?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete suggestion');
    }

    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const voteForSuggestion = async (suggestionId: string) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/roadmap-votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ suggestion_id: suggestionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to vote');
    }

    // Update the suggestion locally
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId
          ? { ...s, votes_count: s.votes_count + 1, hasUserVoted: true }
          : s
      )
    );
  };

  const removeVote = async (suggestionId: string) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/roadmap-votes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ suggestion_id: suggestionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove vote');
    }

    // Update the suggestion locally
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId
          ? { ...s, votes_count: s.votes_count - 1, hasUserVoted: false }
          : s
      )
    );
  };

  useEffect(() => {
    fetchSuggestions();
  }, [session?.access_token]);

  // Set up real-time subscription for suggestions
  useEffect(() => {
    if (!session?.access_token) return;

    const channel = supabase
      .channel('roadmap_suggestions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roadmap_suggestions',
        },
        () => {
          // Refetch suggestions when there are changes
          fetchSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.access_token]);

  return {
    suggestions,
    loading,
    error,
    createSuggestion,
    updateSuggestion,
    deleteSuggestion,
    voteForSuggestion,
    removeVote,
    refetch: fetchSuggestions,
  };
}