import type { Company } from '@/lib/database/models';
import { supabase } from '@/lib/supabase/client';

export class CompanyService {
  
  /**
   * Get all companies for the current user with optional search and filters
   */
  static async getCompanies(options?: {
    search?: string;
    domain?: string;
    size?: string;
    industry?: string;
    includeStats?: boolean;
    ownerId?: string;
  }) {
    try {
      let query = supabase.from('companies').select('*');
      
      // Add search filter
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,domain.ilike.%${options.search}%`);
      }
      
      // Add domain filter
      if (options?.domain) {
        query = query.eq('domain', options.domain);
      }
      
      // Add size filter
      if (options?.size) {
        query = query.eq('size', options.size);
      }
      
      // Add industry filter
      if (options?.industry) {
        query = query.eq('industry', options.industry);
      }
      
      // Add owner filter
      if (options?.ownerId) {
        query = query.eq('owner_id', options.ownerId);
      }
      
      // Order by updated_at descending
      query = query.order('updated_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      // TODO: If includeStats is true, we need to fetch contact and deal counts
      // For now, return companies without stats
      return data as Company[];
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Get a single company by ID
   */
  static async getCompanyById(id: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  /**
   * Find company by domain (for auto-matching)
   */
  static async findCompanyByDomain(domain: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('domain', domain)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Company;
    } catch (error) {
      console.error('Error finding company by domain:', error);
      return null;
    }
  }

  /**
   * Extract domain from email address
   */
  static extractDomainFromEmail(email: string): string | null {
    if (!email || !email.includes('@')) return null;
    
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Filter out common personal email domains
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'icloud.com', 'me.com', 'aol.com', 'live.com'
    ];
    
    if (personalDomains.includes(domain)) return null;
    
    return domain;
  }

  /**
   * Suggest company name from domain
   */
  static suggestCompanyNameFromDomain(domain: string): string {
    if (!domain) return '';
    
    // Remove common TLDs and format as company name
    const name = domain
      .replace(/\.(com|org|net|co\.uk|io|ai|tech)$/i, '')
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    
    return name;
  }

  /**
   * Create a new company
   */
  static async createCompany(companyData: Partial<Company>) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Update an existing company
   */
  static async updateCompany(id: string, updates: Partial<Company>) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Company;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * Delete a company
   */
  static async deleteCompany(id: string) {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  /**
   * Auto-create company from email domain
   */
  static async autoCreateCompanyFromEmail(
    email: string, 
    owner_id: string,
    suggestedName?: string
  ): Promise<Company | null> {
    try {
      const domain = this.extractDomainFromEmail(email);
      if (!domain) return null;

      // Check if company already exists
      const existing = await this.findCompanyByDomain(domain);
      if (existing) return existing;

      // Create new company
      const companyName = suggestedName || this.suggestCompanyNameFromDomain(domain);
      
      return await this.createCompany({
        name: companyName,
        domain,
        owner_id: owner_id || 'dev-user-123' // Provide default for development
      });
    } catch (error) {
      console.error('Error auto-creating company:', error);
      return null;
    }
  }

  /**
   * Get company statistics
   */
  static async getCompanyStats(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }
} 