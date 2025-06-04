import type { Contact } from '@/lib/database/models';

const API_BASE_URL = 'http://localhost:8000/api';

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
      const params = new URLSearchParams();
      
      if (options?.search) params.append('search', options.search);
      if (options?.companyId) params.append('companyId', options.companyId);
      if (options?.includeCompany) params.append('includeCompany', 'true');
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.ownerId) params.append('ownerId', options.ownerId);

      const response = await fetch(`${API_BASE_URL}/contacts?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID with full details
   */
  static async getContactById(id: string, includeRelationships = true) {
    try {
      const params = new URLSearchParams();
      params.append('includeCompany', includeRelationships.toString());
      
      const response = await fetch(`${API_BASE_URL}/contacts/${id}?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as Contact;
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
      const params = new URLSearchParams();
      params.append('search', email);
      params.append('limit', '1');
      
      const contacts = await this.getContacts({ search: email, limit: 1 });
      
      // Find exact email match
      const contact = contacts.find(c => c.email?.toLowerCase() === email.toLowerCase());
      return contact || null;
    } catch (error) {
      console.error('Error finding contact by email:', error);
      return null;
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'full_name'>) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as Contact;
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
      const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data as Contact;
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
      const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Get contacts for a specific company
   */
  static async getContactsByCompany(companyId: string) {
    try {
      return await this.getContacts({ 
        companyId, 
        includeCompany: false 
      });
    } catch (error) {
      console.error('Error fetching company contacts:', error);
      throw error;
    }
  }

  /**
   * Search contacts with intelligent matching
   */
  static async searchContacts(query: string, includeCompany = true) {
    try {
      return await this.getContacts({ 
        search: query, 
        includeCompany,
        limit: 20
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact statistics and related data
   */
  static async getContactStats(contactId: string) {
    try {
      // For now, return mock data until we add stats endpoints to Express API
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/stats`);
      
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
      
      // Fallback mock data
      return {
        totalDealsValue: 0,
        activeDeals: 0,
        totalDeals: 0,
        recentActivities: [],
        activityCount: 0
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      // Return mock data on error
      return {
        totalDealsValue: 0,
        activeDeals: 0,
        totalDeals: 0,
        recentActivities: [],
        activityCount: 0
      };
    }
  }
} 