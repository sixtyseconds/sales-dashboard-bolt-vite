import { neonClient } from '@/lib/database/neonClient';
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
      return await neonClient.getCompanies({
        search: options?.search,
        includeStats: options?.includeStats || false,
        limit: 1000 // reasonable limit for dev
      });
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
      const query = includeRelationships 
        ? `
          SELECT 
            c.*,
            json_agg(DISTINCT jsonb_build_object(
              'id', contacts.id,
              'first_name', contacts.first_name,
              'last_name', contacts.last_name,
              'full_name', contacts.full_name,
              'email', contacts.email,
              'phone', contacts.phone,
              'title', contacts.title,
              'is_primary', contacts.is_primary
            )) FILTER (WHERE contacts.id IS NOT NULL) as contacts,
            json_agg(DISTINCT jsonb_build_object(
              'id', deals.id,
              'name', deals.name,
              'value', deals.value,
              'status', deals.status,
              'stage_id', deals.stage_id,
              'created_at', deals.created_at
            )) FILTER (WHERE deals.id IS NOT NULL) as deals
          FROM companies c
          LEFT JOIN contacts ON contacts.company_id = c.id
          LEFT JOIN deals ON deals.company_id = c.id
          WHERE c.id = $1
          GROUP BY c.id
        `
        : `SELECT * FROM companies WHERE id = $1`;

      const result = await neonClient.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }

      return result.rows[0] as Company;
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
      const result = await neonClient.query(
        'SELECT * FROM companies WHERE domain = $1 LIMIT 1',
        [domain.toLowerCase()]
      );

      return result.rows.length > 0 ? result.rows[0] as Company : null;
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

      const query = `
        INSERT INTO companies (name, domain, industry, size, website, address, phone, description, linkedin_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        companyData.name,
        companyData.domain || null,
        companyData.industry || null,
        companyData.size || null,
        companyData.website || null,
        companyData.address || null,
        companyData.phone || null,
        companyData.description || null,
        companyData.linkedin_url || null
      ];

      const result = await neonClient.query(query, values);
      return result.rows[0] as Company;
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

      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic UPDATE query
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          setParts.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE companies 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await neonClient.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }

      return result.rows[0] as Company;
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
      const result = await neonClient.query('DELETE FROM companies WHERE id = $1', [id]);
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
        domain
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
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM contacts WHERE company_id = $1) as contact_count,
          (SELECT COUNT(*) FROM deals WHERE company_id = $1) as total_deals,
          (SELECT COUNT(*) FROM deals WHERE company_id = $1 AND status = 'active') as active_deals,
          (SELECT COALESCE(SUM(value), 0) FROM deals WHERE company_id = $1) as total_deals_value
      `;

      const result = await neonClient.query(statsQuery, [companyId]);
      const stats = result.rows[0];

      return {
        contactCount: parseInt(stats.contact_count),
        totalDealsValue: parseFloat(stats.total_deals_value),
        activeDeals: parseInt(stats.active_deals),
        totalDeals: parseInt(stats.total_deals),
        recentActivities: [] // Can be implemented later if needed
      };
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }
} 