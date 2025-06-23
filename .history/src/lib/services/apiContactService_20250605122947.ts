import type { Contact } from '@/lib/database/models';
import { supabase } from '@/lib/supabase/client';

export class ApiContactService {
  
  /**
   * Get all contacts with optional search and filters
   */
  static async getContacts(options?: {
    search?: string;
    companyId?: string;
    isPrimary?: boolean;
    includeCompany?: boolean;
    limit?: number;
    ownerId?: string;
  }) {
    try {
      let query = supabase.from('contacts').select('*');
      
      // Include company data if requested
      if (options?.includeCompany) {
        query = supabase.from('contacts').select(`
          *,
          companies (
            id,
            name,
            domain,
            size,
            industry,
            website
          )
        `);
      }
      
      // Add search filter
      if (options?.search) {
        query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }
      
      // Add company filter
      if (options?.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      // Add owner filter
      if (options?.ownerId) {
        query = query.eq('owner_id', options.ownerId);
      }
      
      // Add limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      // Order by updated_at descending
      query = query.order('updated_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   */
  static async getContactById(id: string, includeCompany = false) {
    try {
      let query = supabase.from('contacts').select('*');
      
      if (includeCompany) {
        query = supabase.from('contacts').select(`
          *,
          companies (
            id,
            name,
            domain,
            size,
            industry,
            website
          )
        `);
      }
      
      query = query.eq('id', id).single();
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Contact;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  /**
   * Find contact by email
   */
  static async findContactByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Contact | null;
    } catch (error) {
      console.error('Error finding contact by email:', error);
      throw error;
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: Partial<Contact>) {
    try {
      // Ensure email is lowercase
      if (contactData.email) {
        contactData.email = contactData.email.toLowerCase();
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  static async updateContact(id: string, updates: Partial<Contact>) {
    try {
      // Ensure email is lowercase if being updated
      if (updates.email) {
        updates.email = updates.email.toLowerCase();
      }

      const { data, error } = await supabase
        .from('contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(id: string) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Get contact statistics and related data
   */
  static async getContactStats(contactId: string) {
    try {
      // For now, return basic stats - this would need to be expanded
      // to include activity counts, deal counts, etc.
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Return fallback stats for now
      return {
        meetings: 0,
        emails: 0,
        calls: 0,
        totalDeals: 0,
        activeDeals: 0,
        totalDealsValue: 0,
        engagementScore: 0,
        recentActivities: []
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      // Return fallback mock data
      return {
        meetings: 0,
        emails: 0,
        calls: 0,
        totalDeals: 0,
        activeDeals: 0,
        totalDealsValue: 0,
        engagementScore: 0,
        recentActivities: []
      };
    }
  }

  /**
   * Auto-create contact from email with company detection
   * TODO: Implement with Express API when needed
   */
  static async autoCreateContactFromEmail(
    email: string,
    owner_id: string,
    firstName?: string,
    lastName?: string,
    companyName?: string
  ): Promise<Contact | null> {
    try {
      // Check if contact already exists
      const existing = await this.findContactByEmail(email);
      if (existing) return existing;

      // For now, create basic contact without company auto-detection
      return await this.createContact({
        email,
        first_name: firstName,
        last_name: lastName,
        owner_id,
        is_primary: false
        // TODO: Add company auto-detection logic via API
      });
    } catch (error) {
      console.error('Error auto-creating contact:', error);
      return null;
    }
  }

  /**
   * Set contact as primary for their company
   * TODO: Implement with Express API when needed
   */
  static async setPrimaryContact(contactId: string) {
    try {
      // For now, just update the contact to set is_primary = true
      // TODO: Add server-side logic to handle making other contacts non-primary
      return await this.updateContact(contactId, { is_primary: true });
    } catch (error) {
      console.error('Error setting primary contact:', error);
      throw error;
    }
  }

  /**
   * Get deals for a specific contact
   */
  static async getContactDeals(contactId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/deals`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching contact deals:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get activities for a specific contact
   */
  static async getContactActivities(contactId: string, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/activities?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching contact activities:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get the owner (sales rep) info for a contact
   */
  static async getContactOwner(contactId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/owner`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error fetching contact owner:', error);
      return null; // Return null on error
    }
  }

  /**
   * Get tasks for a specific contact
   */
  static async getContactTasks(contactId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/tasks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching contact tasks:', error);
      return []; // Return empty array on error
    }
  }
} 