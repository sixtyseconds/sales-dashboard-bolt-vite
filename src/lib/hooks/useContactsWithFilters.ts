import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

export interface ContactWithFilters {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  title: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  company_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Company relationship
  companies?: {
    id: string;
    name: string;
    domain: string;
    size: string;
    industry: string;
    website: string;
  } | null;
}

interface UseContactsWithFiltersOptions {
  ownerId?: string;
  search?: string;
  companyId?: string;
}

export function useContactsWithFilters(options: UseContactsWithFiltersOptions = {}) {
  const [contacts, setContacts] = useState<ContactWithFilters[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `${API_BASE_URL}/contacts?includeCompany=true`;
      const params = new URLSearchParams();
      
      if (options.ownerId) {
        params.append('ownerId', options.ownerId);
      }
      
      if (options.search) {
        params.append('search', options.search);
      }
      
      if (options.companyId) {
        params.append('companyId', options.companyId);
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setContacts(result.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
    } finally {
      setIsLoading(false);
    }
  }, [options.ownerId, options.search, options.companyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    refetch: fetchContacts
  };
} 