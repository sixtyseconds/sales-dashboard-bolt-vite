/*
  # Create Companies Table
  
  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `domain` (text, unique for auto-matching)
      - `industry` (text, optional)
      - `size` (text, company size category)
      - `website` (text, optional)
      - `address` (text, optional)
      - `phone` (text, optional)
      - `description` (text, optional)
      - `linkedin_url` (text, optional)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for users to manage their own companies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- For auto-matching emails like @company.com
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  website TEXT,
  address TEXT,
  phone TEXT,
  description TEXT,
  linkedin_url TEXT,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_companies_name ON companies(name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (owner_id = auth.uid()); 