/*
  # Create Relationship Tables
  
  1. New Tables
    - `deal_contacts` (many-to-many relationship between deals and contacts)
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals)
      - `contact_id` (uuid, foreign key to contacts)
      - `role` (text, contact's role in the deal)
      - `created_at` (timestamp)
      - Unique constraint on deal_id + contact_id
    
    - `contact_preferences` (communication preferences for contacts)
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `preferred_method` (text, communication preference)
      - `timezone` (text, contact's timezone)
      - `notes` (text, preference notes)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create deal_contacts relationship table
CREATE TABLE deal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'stakeholder' CHECK (role IN ('decision_maker', 'influencer', 'stakeholder', 'champion', 'blocker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deal_id, contact_id) -- Prevent duplicate relationships
);

-- Create contact_preferences table
CREATE TABLE contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  preferred_method TEXT DEFAULT 'email' CHECK (preferred_method IN ('email', 'phone', 'linkedin', 'text')),
  timezone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id) -- One preference record per contact
);

-- Create indexes for performance
CREATE INDEX idx_deal_contacts_deal_id ON deal_contacts(deal_id);
CREATE INDEX idx_deal_contacts_contact_id ON deal_contacts(contact_id);
CREATE INDEX idx_deal_contacts_role ON deal_contacts(role);

CREATE INDEX idx_contact_preferences_contact_id ON contact_preferences(contact_id);
CREATE INDEX idx_contact_preferences_method ON contact_preferences(preferred_method);

-- Create updated_at trigger for contact_preferences
CREATE TRIGGER update_contact_preferences_updated_at BEFORE UPDATE ON contact_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_contacts
CREATE POLICY "Users can view deal contacts for their deals" ON deal_contacts
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create deal contacts for their deals" ON deal_contacts
  FOR INSERT WITH CHECK (
    deal_id IN (SELECT id FROM deals WHERE owner_id = auth.uid()) AND
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update deal contacts for their deals" ON deal_contacts
  FOR UPDATE USING (
    deal_id IN (SELECT id FROM deals WHERE owner_id = auth.uid())
  ) WITH CHECK (
    deal_id IN (SELECT id FROM deals WHERE owner_id = auth.uid()) AND
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete deal contacts for their deals" ON deal_contacts
  FOR DELETE USING (
    deal_id IN (SELECT id FROM deals WHERE owner_id = auth.uid())
  );

-- Create policies for contact_preferences
CREATE POLICY "Users can view preferences for their contacts" ON contact_preferences
  FOR SELECT USING (
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create preferences for their contacts" ON contact_preferences
  FOR INSERT WITH CHECK (
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update preferences for their contacts" ON contact_preferences
  FOR UPDATE USING (
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  ) WITH CHECK (
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete preferences for their contacts" ON contact_preferences
  FOR DELETE USING (
    contact_id IN (SELECT id FROM contacts WHERE owner_id = auth.uid())
  ); 