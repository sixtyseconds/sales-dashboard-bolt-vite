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
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || {
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
} 