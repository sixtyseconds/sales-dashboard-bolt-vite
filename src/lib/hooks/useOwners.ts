import { useState, useEffect } from 'react';
import { API_BASE_URL, DISABLE_EDGE_FUNCTIONS } from '@/lib/config';
import { supabase } from '@/lib/supabase/clientV2';

export interface Owner {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  stage: string;
  email: string;
  deal_count?: number;
  total_value?: number;
}

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOwners() {
      try {
        setIsLoading(true);
        setError(null);

        // If edge functions are disabled, return hardcoded owners for now
        if (DISABLE_EDGE_FUNCTIONS) {
          console.log('🔄 Using hardcoded owners list (fallback)');
          
          // Hardcoded list of common sales representatives
          const hardcodedOwners: Owner[] = [
            {
              id: '1',
              first_name: 'Steve',
              last_name: 'Gibson',
              full_name: 'Steve Gibson',
              stage: 'Director',
              email: 'steve@company.com'
            },
            {
              id: '2',
              first_name: 'Andrew',
              last_name: 'Bryce',
              full_name: 'Andrew Bryce',
              stage: 'Senior Rep',
              email: 'andrew@company.com'
            },
            {
              id: '3',
              first_name: 'Phil',
              last_name: 'Johnson',
              full_name: 'Phil Johnson',
              stage: 'Rep',
              email: 'phil@company.com'
            }
          ];

          setOwners(hardcodedOwners);
          return;
        }

        // Try edge function first (fallback approach)
        try {
          const response = await fetch(`${API_BASE_URL}/owners`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          setOwners(result.data || []);
        } catch (edgeFunctionError) {
          console.warn('Edge function failed, using hardcoded fallback:', edgeFunctionError);
          
          // Fallback to hardcoded list
          const hardcodedOwners: Owner[] = [
            {
              id: '1',
              first_name: 'Steve',
              last_name: 'Gibson',
              full_name: 'Steve Gibson',
              stage: 'Director',
              email: 'steve@company.com'
            },
            {
              id: '2',
              first_name: 'Andrew',
              last_name: 'Bryce',
              full_name: 'Andrew Bryce',
              stage: 'Senior Rep',
              email: 'andrew@company.com'
            },
            {
              id: '3',
              first_name: 'Phil',
              last_name: 'Johnson',
              full_name: 'Phil Johnson',
              stage: 'Rep',
              email: 'phil@company.com'
            }
          ];

          setOwners(hardcodedOwners);
        }
      } catch (err) {
        console.error('Error fetching owners:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch owners'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOwners();
  }, []);

  return {
    owners,
    isLoading,
    error
  };
} 