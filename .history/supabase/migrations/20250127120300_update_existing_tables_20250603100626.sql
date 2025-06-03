/*
  # Update Existing Tables for CRM Relationships
  
  1. Updates to existing tables
    - Add `company_id` and `primary_contact_id` to deals table
    - Add `company_id`, `contact_id`, `deal_id`, `auto_matched` to activities table
    - Create `activity_sync_rules` table for intelligent automation
  
  2. Indexes and constraints
    - Add indexes for new foreign keys
    - Maintain existing functionality while adding relationships
*/

-- Update deals table with new relationship fields
ALTER TABLE deals 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Update activities table with new relationship fields
ALTER TABLE activities 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
ADD COLUMN auto_matched BOOLEAN DEFAULT false;

-- Create activity_sync_rules table for intelligent automation
CREATE TABLE activity_sync_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('sale', 'outbound', 'meeting', 'proposal')),
  min_priority TEXT DEFAULT 'medium' CHECK (min_priority IN ('low', 'medium', 'high')),
  auto_create_deal BOOLEAN DEFAULT false,
  target_stage_name TEXT, -- Maps to deal_stages.name
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_type, owner_id) -- One rule per activity type per user
);

-- Create indexes for new foreign keys
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_primary_contact_id ON deals(primary_contact_id);

CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_activities_auto_matched ON activities(auto_matched);

CREATE INDEX idx_activity_sync_rules_owner_id ON activity_sync_rules(owner_id);
CREATE INDEX idx_activity_sync_rules_activity_type ON activity_sync_rules(activity_type);
CREATE INDEX idx_activity_sync_rules_active ON activity_sync_rules(is_active) WHERE is_active = true;

-- Create updated_at trigger for activity_sync_rules
CREATE TRIGGER update_activity_sync_rules_updated_at BEFORE UPDATE ON activity_sync_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for activity_sync_rules
ALTER TABLE activity_sync_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_sync_rules
CREATE POLICY "Users can view their own sync rules" ON activity_sync_rules
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own sync rules" ON activity_sync_rules
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own sync rules" ON activity_sync_rules
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own sync rules" ON activity_sync_rules
  FOR DELETE USING (owner_id = auth.uid());

-- Insert default activity sync rules for existing users
INSERT INTO activity_sync_rules (activity_type, min_priority, auto_create_deal, target_stage_name, owner_id, is_active)
SELECT 
  rule.activity_type,
  rule.min_priority,
  rule.auto_create_deal,
  rule.target_stage_name,
  u.id as owner_id,
  true as is_active
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('meeting', 'medium', true, 'SQL'),
    ('proposal', 'medium', true, 'Opportunity'),
    ('sale', 'low', false, 'Closed Won'),
    ('outbound', 'medium', false, 'MQL')
) AS rule(activity_type, min_priority, auto_create_deal, target_stage_name)
WHERE u.id IS NOT NULL
ON CONFLICT (activity_type, owner_id) DO NOTHING; 