import { Client } from 'pg';

// Neon database configuration
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

class NeonClient {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client({
      connectionString: NEON_CONNECTION_STRING,
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('🔗 Connected to Neon database');
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
      console.log('🔌 Disconnected from Neon database');
    }
  }

  async query(text: string, params?: any[]) {
    await this.connect();
    return this.client.query(text, params);
  }

  // Supabase-like interface for companies
  async getCompanies(options: {
    search?: string;
    includeStats?: boolean;
    limit?: number;
  } = {}) {
    const { search, includeStats, limit } = options;
    
    let query = `
      SELECT 
        c.*,
        ${includeStats ? `
          (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count,
          (SELECT COUNT(*) FROM deals WHERE company_id = c.id) as deals_count,
          (SELECT COALESCE(SUM(value), 0) FROM deals WHERE company_id = c.id) as deals_value
        ` : '0 as contact_count, 0 as deals_count, 0 as deals_value'}
      FROM companies c
    `;
    
    const params: any[] = [];
    
    if (search) {
      query += ` WHERE (c.name ILIKE $1 OR c.domain ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY c.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await this.query(query, params);
    
    return {
      data: result.rows.map(row => ({
        ...row,
        contactCount: parseInt(row.contact_count),
        dealsCount: parseInt(row.deals_count), 
        dealsValue: parseFloat(row.deals_value)
      })),
      error: null,
      count: result.rows.length
    };
  }

  // Supabase-like interface for deals with CRM relationships
  async getDealsWithRelationships(userId?: string) {
    const query = `
      SELECT 
        d.*,
        ds.id as stage_id, 
        ds.name as stage_name, 
        ds.color as stage_color, 
        ds.default_probability,
        
        -- Company relationship
        c.id as company_id,
        c.name as company_name,
        c.domain as company_domain,
        c.size as company_size,
        c.industry as company_industry,
        c.website as company_website,
        c.linkedin_url as company_linkedin_url,
        
        -- Primary contact relationship
        ct.id as contact_id,
        ct.first_name as contact_first_name,
        ct.last_name as contact_last_name,
        ct.full_name as contact_full_name,
        ct.email as contact_email,
        ct.phone as contact_phone,
        ct.title as contact_title,
        ct.linkedin_url as contact_linkedin_url,
        ct.is_primary as contact_is_primary
        
      FROM deals d
      LEFT JOIN deal_stages ds ON d.stage_id = ds.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts ct ON d.primary_contact_id = ct.id
      ORDER BY d.updated_at DESC;
    `;

    const result = await this.query(query);
    
    return {
      data: result.rows.map(row => {
        // Calculate days in stage
        const stageChangedDate = new Date(row.stage_changed_at);
        const currentDate = new Date();
        const daysInStage = Math.floor((currentDate.getTime() - stageChangedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          // Deal fields
          ...row,
          daysInStage,
          timeStatus: daysInStage > 14 ? 'danger' : daysInStage > 7 ? 'warning' : 'normal',
          
          // Deal stages relationship
          deal_stages: row.stage_id ? {
            id: row.stage_id,
            name: row.stage_name,
            color: row.stage_color,
            default_probability: row.default_probability
          } : null,
          
          // Companies relationship
          companies: row.company_id ? {
            id: row.company_id,
            name: row.company_name,
            domain: row.company_domain,
            size: row.company_size,
            industry: row.company_industry,
            website: row.company_website,
            linkedin_url: row.company_linkedin_url
          } : null,
          
          // Contacts relationship
          contacts: row.contact_id ? {
            id: row.contact_id,
            first_name: row.contact_first_name,
            last_name: row.contact_last_name,
            full_name: row.contact_full_name,
            email: row.contact_email,
            phone: row.contact_phone,
            title: row.contact_title,
            linkedin_url: row.contact_linkedin_url,
            is_primary: row.contact_is_primary
          } : null,
          
          // Empty deal_contacts for now (can be enhanced later)
          deal_contacts: []
        };
      }),
      error: null
    };
  }

  // Mock authentication for development
  getMockUser() {
    return {
      id: 'dev-user-123',
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'User',
      avatar_url: null,
      is_admin: true
    };
  }
}

// Export singleton instance
export const neonClient = new NeonClient();

// Cleanup on process exit
if (typeof window === 'undefined') {
  process.on('exit', () => {
    neonClient.disconnect();
  });
} 