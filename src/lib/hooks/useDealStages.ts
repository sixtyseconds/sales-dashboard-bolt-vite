import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface DealStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order_position: number;
  default_probability: number;
  created_at: string;
  updated_at: string;
}

export function useDealStages() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchStages() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/stages`);
        if (!response.ok) {
          throw new Error(`Failed to fetch stages: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }
        
        setStages(result.data || []);
      } catch (err) {
        console.error('Error fetching deal stages:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStages();
  }, []);

  const createStage = async (stageData: Omit<DealStage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create stage: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Optimistic update
      setStages(prevStages => [...prevStages, result.data].sort((a, b) => a.order_position - b.order_position));
      
      return result.data;
    } catch (err) {
      console.error('Error creating stage:', err);
      setError(err);
      return null;
    }
  };
  
  const updateStage = async (id: string, updates: Partial<DealStage>) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update stage: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Optimistic update
      setStages(prevStages => 
        prevStages.map(s => s.id === id ? result.data : s)
          .sort((a, b) => a.order_position - b.order_position)
      );
      
      return true;
    } catch (err) {
      console.error('Error updating stage:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteStage = async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stages/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete stage: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Optimistic update
      setStages(prevStages => prevStages.filter(s => s.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError(err);
      return false;
    }
  };

  return {
    stages,
    isLoading,
    error,
    createStage,
    updateStage,
    deleteStage
  };
} 