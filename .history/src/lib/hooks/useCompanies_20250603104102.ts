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

export function useCompanies(options: UseCompaniesOptions = {}): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { autoFetch = true } = options;

  // Fetch companies based on options
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CompanyService.getCompanies({
        search: options.search,
        domain: options.domain,
        size: options.size,
        industry: options.industry,
        includeStats: options.includeStats
      });
      
      setCompanies(data);
      setTotalCount(data.length);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.search, options.domain, options.size, options.industry, options.includeStats]);

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
        includeStats: options.includeStats
      });
      return results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error searching companies:', error);
      return [];
    }
  }, [options.includeStats]);

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
    if (autoFetch) {
      fetchCompanies();
    }
  }, [fetchCompanies, autoFetch]);

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