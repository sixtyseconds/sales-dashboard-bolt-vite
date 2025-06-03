import { useState, useEffect } from 'react';

// Mock hook - temporarily disabled Supabase calls to avoid 400 errors
// TODO: Implement with Neon API when targets functionality is needed
export interface Target {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  target_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export function useTargets(userId: string | undefined) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock implementation - returns proper target object structure
    // Eliminates Supabase 400 errors while keeping components functional
    if (userId) {
      setIsLoading(true);
      setTimeout(() => {
        // Return mock target data that matches what Dashboard expects
        setData({
          id: 'mock-target-1',
          user_id: userId,
          revenue_target: 20000,
          outbound_target: 100,
          meetings_target: 20,
          proposal_target: 15,
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setError(null);
        setIsLoading(false);
      }, 100);
    }
  }, [userId]);

  return {
    data,
    isLoading,
    error
  };
}

export function useCreateTarget() {
  return {
    mutate: async () => {
      // Mock implementation - does nothing
      console.log('Target creation temporarily disabled');
    },
    isLoading: false,
    error: null
  };
}

export function useUpdateTarget() {
  return {
    mutate: async () => {
      // Mock implementation - does nothing  
      console.log('Target update temporarily disabled');
    },
    isLoading: false,
    error: null
  };
}

export function useDeleteTarget() {
  return {
    mutate: async () => {
      // Mock implementation - does nothing
      console.log('Target deletion temporarily disabled');
    },
    isLoading: false,
    error: null
  };
}