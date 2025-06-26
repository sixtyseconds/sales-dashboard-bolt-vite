/*
  # Add CRM Relationship Columns to Existing Tables
  
  1. Updates to existing tables
    - Add `company_id` and `primary_contact_id` to deals table
    - Add `company_id`, `contact_id`, `deal_id`, `auto_matched` to activities table
  
  2. Indexes and constraints
    - Add indexes for new foreign keys
    - Maintain existing functionality while adding relationships
*/

-- Update deals table with new relationship fields (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE deals ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'primary_contact_id'
  ) THEN
    ALTER TABLE deals ADD COLUMN primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update activities table with new relationship fields (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE activities ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE activities ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE activities ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'auto_matched'
  ) THEN
    ALTER TABLE activities ADD COLUMN auto_matched BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for new foreign keys (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_primary_contact_id ON deals(primary_contact_id);

CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_auto_matched ON activities(auto_matched);

-- Create index for faster deal lookups to prevent duplicates
CREATE INDEX IF NOT EXISTS idx_deals_contact_email_owner_active 
ON deals(contact_email, owner_id, status) 
WHERE status = 'active';

-- Insert default activity sync rules for existing users (if rules don't exist)
INSERT INTO activity_sync_rules (activity_type, min_priority, auto_create_deal, target_stage_name, owner_id, is_active)
SELECT 
  rule.activity_type,
  rule.min_priority,
  rule.auto_create_deal,
  rule.target_stage_name,
  p.id as owner_id,
  true as is_active
FROM profiles p
CROSS JOIN (
  VALUES 
    ('meeting', 'medium', true, 'SQL'),
    ('proposal', 'medium', true, 'Opportunity'),
    ('sale', 'low', false, 'Closed Won'),
    ('outbound', 'medium', false, 'SQL')
) AS rule(activity_type, min_priority, auto_create_deal, target_stage_name)
WHERE p.id IS NOT NULL
ON CONFLICT (activity_type, owner_id) DO NOTHING; 