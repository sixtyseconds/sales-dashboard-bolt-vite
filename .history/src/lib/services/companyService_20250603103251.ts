import { supabase } from '@/lib/supabase/client';
import type { Company } from '@/lib/database/models';

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
  }) {
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          ${options?.includeStats ? `
            contacts:contacts(count),
            deals:deals(count, value)
          ` : ''}
        `)
        .order('name');

      // Apply search filter
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,domain.ilike.%${options.search}%`);
      }

      // Apply domain filter
      if (options?.domain) {
        query = query.eq('domain', options.domain);
      }

      // Apply size filter
      if (options?.size) {
        query = query.eq('size', options.size);
      }

      // Apply industry filter
      if (options?.industry) {
        query = query.eq('industry', options.industry);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process stats if requested
      if (options?.includeStats && data) {
        return data.map(company => ({
          ...company,
          contactCount: Array.isArray(company.contacts) ? company.contacts.length : 0,
          dealsValue: Array.isArray(company.deals) 
            ? company.deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
            : 0
        }));
      }

      return data as Company[];
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Get a single company by ID with full details
   */
  static async getCompanyById(id: string, includeRelationships = true) {
    try {
      const query = supabase
        .from('companies')
        .select(`
          *,
          ${includeRelationships ? `
            contacts(*),
            deals:deals(*, deal_stages(*))
          ` : ''}
        `)
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error) throw error;
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
        .eq('domain', domain.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data as Company | null;
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
  static async createCompany(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Ensure domain is lowercase
      if (companyData.domain) {
        companyData.domain = companyData.domain.toLowerCase();
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
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
      // Ensure domain is lowercase
      if (updates.domain) {
        updates.domain = updates.domain.toLowerCase();
      }

      const { data, error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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

      if (error) throw error;
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
        owner_id
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
      const [contactsResult, dealsResult, activitiesResult] = await Promise.all([
        // Get contact count
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
        
        // Get deals stats
        supabase
          .from('deals')
          .select('value, status')
          .eq('company_id', companyId),
        
        // Get recent activities
        supabase
          .from('activities')
          .select('id, type, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const contactCount = contactsResult.count || 0;
      const deals = dealsResult.data || [];
      const activities = activitiesResult.data || [];

      const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const activeDeals = deals.filter(deal => deal.status === 'active').length;

      return {
        contactCount,
        totalDealsValue,
        activeDeals,
        totalDeals: deals.length,
        recentActivities: activities
      };
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }
} 