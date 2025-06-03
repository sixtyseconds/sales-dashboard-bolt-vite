import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CompanyService } from '@/lib/services/companyService';
import type { Company } from '@/lib/database/models';

interface UseCompaniesOptions {
  search?: string;
  domain?: string;
  size?: string;
  industry?: string;
  includeStats?: boolean;
  autoFetch?: boolean;
}

interface UseCompaniesReturn {
  companies: Company[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  
  // Actions
  fetchCompanies: () => Promise<void>;
  createCompany: (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<Company | null>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  searchCompanies: (query: string) => Promise<Company[]>;
  
  // Utility functions
  findCompanyByDomain: (domain: string) => Promise<Company | null>;
  autoCreateFromEmail: (email: string, owner_id: string, suggestedName?: string) => Promise<Company | null>;
  
  // State management
  refreshCompanies: () => void;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:8000/api';

export function useCompanies(ownerId?: string, search?: string): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `${API_BASE_URL}/companies?includeStats=true`;
      const params = new URLSearchParams();
      
      if (ownerId) {
        params.append('ownerId', ownerId);
      }
      
      if (search) {
        params.append('search', search);
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setCompanies(result.data || []);
      setTotalCount(result.data?.length || 0);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch companies'));
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, search]);

  // Create a new company
  const createCompany = useCallback(async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCompany = await CompanyService.createCompany(companyData);
      
      // Add to local state
      setCompanies(prev => [newCompany, ...prev]);
      setTotalCount(prev => prev + 1);
      
      toast.success('Company created successfully');
      return newCompany;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to create company');
      console.error('Error creating company:', error);
      return null;
    }
  }, []);

  // Update an existing company
  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    try {
      const updatedCompany = await CompanyService.updateCompany(id, updates);
      
      // Update local state
      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? updatedCompany : company
        )
      );
      
      toast.success('Company updated successfully');
      return updatedCompany;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to update company');
      console.error('Error updating company:', error);
      return null;
    }
  }, []);

  // Delete a company
  const deleteCompany = useCallback(async (id: string) => {
    try {
      await CompanyService.deleteCompany(id);
      
      // Remove from local state
      setCompanies(prev => prev.filter(company => company.id !== id));
      setTotalCount(prev => prev - 1);
      
      toast.success('Company deleted successfully');
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to delete company');
      console.error('Error deleting company:', error);
      return false;
    }
  }, []);

  // Search companies
  const searchCompanies = useCallback(async (query: string) => {
    try {
      const results = await CompanyService.getCompanies({
        search: query,
        includeStats: true
      });
      return results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error searching companies:', error);
      return [];
    }
  }, []);

  // Find company by domain
  const findCompanyByDomain = useCallback(async (domain: string) => {
    try {
      return await CompanyService.findCompanyByDomain(domain);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error finding company by domain:', error);
      return null;
    }
  }, []);

  // Auto-create company from email
  const autoCreateFromEmail = useCallback(async (email: string, owner_id: string, suggestedName?: string) => {
    try {
      const company = await CompanyService.autoCreateCompanyFromEmail(email, owner_id, suggestedName);
      
      if (company) {
        // Add to local state if it's a new company
        setCompanies(prev => {
          const exists = prev.some(c => c.id === company.id);
          return exists ? prev : [company, ...prev];
        });
        setTotalCount(prev => prev + 1);
      }
      
      return company;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error auto-creating company:', error);
      return null;
    }
  }, []);

  // Refresh companies
  const refreshCompanies = useCallback(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    isLoading,
    error,
    totalCount,
    
    // Actions
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    searchCompanies,
    
    // Utility functions
    findCompanyByDomain,
    autoCreateFromEmail,
    
    // State management
    refreshCompanies,
    clearError
  };
}

// Convenience hook for getting a single company
export function useCompany(id: string, includeRelationships = true) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CompanyService.getCompanyById(id, includeRelationships);
      setCompany(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching company:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, includeRelationships]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    isLoading,
    error,
    refetch: fetchCompany,
    clearError: () => setError(null)
  };
} 