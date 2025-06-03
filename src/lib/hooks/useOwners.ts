import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Owner {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  stage: string;
  email: string;
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

        const response = await fetch(`${API_BASE_URL}/owners`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setOwners(result.data || []);
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