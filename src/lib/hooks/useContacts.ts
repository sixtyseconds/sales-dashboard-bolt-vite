import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ApiContactService } from '@/lib/services/apiContactService';
import type { Contact } from '@/lib/database/models';

interface UseContactsOptions {
  ownerId?: string;
  search?: string;
  companyId?: string;
  isPrimary?: boolean;
  includeCompany?: boolean;
  autoFetch?: boolean;
}

interface UseContactsReturn {
  contacts: Contact[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  
  // Actions
  fetchContacts: () => Promise<void>;
  createContact: (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'full_name'>) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  searchContacts: (query: string) => Promise<Contact[]>;
  
  // Utility functions
  findContactByEmail: (email: string) => Promise<Contact | null>;
  autoCreateFromEmail: (email: string, owner_id: string, firstName?: string, lastName?: string, companyName?: string) => Promise<Contact | null>;
  setPrimaryContact: (contactId: string) => Promise<Contact | null>;
  
  // State management
  refreshContacts: () => void;
  clearError: () => void;
}

export function useContacts(options: UseContactsOptions = {}): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { autoFetch = true } = options;

  // Fetch contacts based on options
  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ApiContactService.getContacts(options);
      
      setContacts(data);
      setTotalCount(data.length);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.search, options.companyId, options.isPrimary, options.includeCompany]);

  // Create a new contact
  const createContact = useCallback(async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'full_name'>) => {
    try {
      const newContact = await ApiContactService.createContact(contactData);
      
      // Add to local state
      setContacts(prev => [newContact, ...prev]);
      setTotalCount(prev => prev + 1);
      
      toast.success('Contact created successfully');
      return newContact;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to create contact');
      console.error('Error creating contact:', error);
      return null;
    }
  }, []);

  // Update an existing contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      const updatedContact = await ApiContactService.updateContact(id, updates);
      
      // Update local state
      setContacts(prev => 
        prev.map(contact => 
          contact.id === id ? updatedContact : contact
        )
      );
      
      toast.success('Contact updated successfully');
      return updatedContact;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to update contact');
      console.error('Error updating contact:', error);
      return null;
    }
  }, []);

  // Delete a contact
  const deleteContact = useCallback(async (id: string) => {
    try {
      await ApiContactService.deleteContact(id);
      
      // Remove from local state
      setContacts(prev => prev.filter(contact => contact.id !== id));
      setTotalCount(prev => prev - 1);
      
      toast.success('Contact deleted successfully');
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to delete contact');
      console.error('Error deleting contact:', error);
      return false;
    }
  }, []);

  // Search contacts
  const searchContacts = useCallback(async (query: string) => {
    try {
      const results = await ApiContactService.searchContacts(query, options.includeCompany);
      return results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error searching contacts:', error);
      return [];
    }
  }, [options.includeCompany]);

  // Find contact by email
  const findContactByEmail = useCallback(async (email: string) => {
    try {
      return await ApiContactService.findContactByEmail(email);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error finding contact by email:', error);
      return null;
    }
  }, []);

  // Auto-create contact from email
  const autoCreateFromEmail = useCallback(async (
    email: string, 
    owner_id: string, 
    firstName?: string, 
    lastName?: string, 
    companyName?: string
  ) => {
    try {
      const contact = await ApiContactService.autoCreateContactFromEmail(
        email, 
        owner_id, 
        firstName, 
        lastName, 
        companyName
      );
      
      if (contact) {
        // Add to local state if it's a new contact
        setContacts(prev => {
          const exists = prev.some(c => c.id === contact.id);
          return exists ? prev : [contact, ...prev];
        });
        setTotalCount(prev => prev + 1);
      }
      
      return contact;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error auto-creating contact:', error);
      return null;
    }
  }, []);

  // Set primary contact
  const setPrimaryContact = useCallback(async (contactId: string) => {
    try {
      const updatedContact = await ApiContactService.setPrimaryContact(contactId);
      
      // Update local state - set this as primary and others as non-primary
      setContacts(prev => 
        prev.map(contact => ({
          ...contact,
          is_primary: contact.id === contactId ? true : 
                     contact.company_id === updatedContact.company_id ? false : 
                     contact.is_primary
        }))
      );
      
      toast.success('Primary contact updated successfully');
      return updatedContact;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error('Failed to set primary contact');
      console.error('Error setting primary contact:', error);
      return null;
    }
  }, []);

  // Refresh contacts
  const refreshContacts = useCallback(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    if (autoFetch) {
      fetchContacts();
    }
  }, [fetchContacts, autoFetch]);

  return {
    contacts,
    isLoading,
    error,
    totalCount,
    
    // Actions
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    
    // Utility functions
    findContactByEmail,
    autoCreateFromEmail,
    setPrimaryContact,
    
    // State management
    refreshContacts,
    clearError
  };
}

// Convenience hook for getting a single contact
export function useContact(id: string, includeRelationships = true) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      if (!id) {
        setContact(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const data = await ApiContactService.getContactById(id, includeRelationships);
        setContact(data);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch contact'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [id, includeRelationships]);

  const refetch = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ApiContactService.getContactById(id, includeRelationships);
      setContact(data);
    } catch (err) {
      console.error('Error refetching contact:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch contact'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    contact,
    isLoading,
    error,
    refetch
  };
}

// Hook for getting contacts by company
export function useContactsByCompany(companyId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ApiContactService.getContactsByCompany(companyId);
      setContacts(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching company contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    refetch: fetchContacts,
    clearError: () => setError(null)
  };
} 