/*
  # Create Contacts Table
  
  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies, nullable)
      - `first_name` (text, optional)
      - `last_name` (text, optional)
      - `full_name` (text, generated from first + last name)
      - `email` (text, unique for contact identification)
      - `phone` (text, optional)
      - `title` (text, job title)
      - `linkedin_url` (text, optional)
      - `is_primary` (boolean, primary contact for company)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `contacts` table
    - Add policies for users to manage their own contacts
*/

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
        CONCAT(first_name, ' ', last_name)
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE NULL
    END
  ) STORED,
  email TEXT UNIQUE,
  phone TEXT,
  title TEXT, -- Job title
  linkedin_url TEXT,
  is_primary BOOLEAN DEFAULT false, -- Primary contact for company
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary) WHERE is_primary = true;

-- Create updated_at trigger
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (owner_id = auth.uid());

-- Function to ensure only one primary contact per company per user
CREATE OR REPLACE FUNCTION check_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a contact as primary, remove primary status from other contacts for same company
  IF NEW.is_primary = true AND NEW.company_id IS NOT NULL THEN
    UPDATE contacts 
    SET is_primary = false 
    WHERE company_id = NEW.company_id 
      AND id != NEW.id 
      AND owner_id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_contact 
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION check_primary_contact(); 