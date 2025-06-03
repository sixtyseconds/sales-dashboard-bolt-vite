/*
  # Migrate Existing Data to New CRM Structure
  
  1. Data Migration Steps
    - Extract companies from existing deals.company field
    - Extract contacts from existing deals contact fields
    - Map email domains to companies automatically (strict matching)
    - Update deals with proper foreign key relationships
    - Preserve all existing data integrity
    
  2. Smart Domain Extraction
    - Extract domain from contact_email in deals
    - Create companies with domain-based matching
    - Handle edge cases and preserve data quality
*/

-- Step 1: Extract and create companies from existing deals
WITH company_data AS (
  SELECT DISTINCT 
    deals.company as company_name,
    CASE 
      WHEN deals.contact_email LIKE '%@%' 
      THEN LOWER(SPLIT_PART(deals.contact_email, '@', 2))
      ELSE NULL 
    END as domain,
    deals.owner_id,
    MIN(deals.created_at) as first_seen
  FROM deals 
  WHERE deals.company IS NOT NULL 
    AND TRIM(deals.company) != ''
  GROUP BY deals.company, 
    CASE 
      WHEN deals.contact_email LIKE '%@%' 
      THEN LOWER(SPLIT_PART(deals.contact_email, '@', 2))
      ELSE NULL 
    END,
    deals.owner_id
)
INSERT INTO companies (name, domain, owner_id, created_at, updated_at)
SELECT 
  company_name,
  domain,
  owner_id,
  first_seen,
  first_seen
FROM company_data
WHERE company_name IS NOT NULL
ON CONFLICT (domain) DO UPDATE SET
  name = CASE 
    WHEN companies.name = '' OR companies.name IS NULL 
    THEN EXCLUDED.name 
    ELSE companies.name 
  END,
  updated_at = NOW();

-- Step 2: Extract and create contacts from existing deals
WITH contact_data AS (
  SELECT DISTINCT
    deals.contact_email as email,
    deals.contact_name as full_name,
    CASE 
      WHEN deals.contact_name LIKE '% %' 
      THEN SPLIT_PART(deals.contact_name, ' ', 1)
      ELSE deals.contact_name
    END as first_name,
    CASE 
      WHEN deals.contact_name LIKE '% %' 
      THEN SUBSTRING(deals.contact_name FROM POSITION(' ' IN deals.contact_name) + 1)
      ELSE NULL
    END as last_name,
    deals.contact_phone as phone,
    deals.owner_id,
    c.id as company_id,
    MIN(deals.created_at) as first_seen,
    -- Mark first contact as primary for each company
    ROW_NUMBER() OVER (
      PARTITION BY c.id, deals.owner_id 
      ORDER BY MIN(deals.created_at)
    ) = 1 as is_primary
  FROM deals
  LEFT JOIN companies c ON (
    c.name = deals.company AND c.owner_id = deals.owner_id
  ) OR (
    c.domain IS NOT NULL 
    AND deals.contact_email LIKE '%@' || c.domain
    AND c.owner_id = deals.owner_id
  )
  WHERE deals.contact_email IS NOT NULL 
    AND TRIM(deals.contact_email) != ''
    AND deals.contact_email LIKE '%@%'
  GROUP BY 
    deals.contact_email,
    deals.contact_name, 
    deals.contact_phone,
    deals.owner_id,
    c.id
)
INSERT INTO contacts (
  email, 
  first_name, 
  last_name, 
  phone, 
  company_id, 
  is_primary,
  owner_id, 
  created_at, 
  updated_at
)
SELECT 
  email,
  first_name,
  last_name,
  phone,
  company_id,
  is_primary,
  owner_id,
  first_seen,
  first_seen
FROM contact_data
WHERE email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  first_name = CASE 
    WHEN contacts.first_name IS NULL OR contacts.first_name = '' 
    THEN EXCLUDED.first_name 
    ELSE contacts.first_name 
  END,
  last_name = CASE 
    WHEN contacts.last_name IS NULL OR contacts.last_name = '' 
    THEN EXCLUDED.last_name 
    ELSE contacts.last_name 
  END,
  phone = CASE 
    WHEN contacts.phone IS NULL OR contacts.phone = '' 
    THEN EXCLUDED.phone 
    ELSE contacts.phone 
  END,
  company_id = CASE 
    WHEN contacts.company_id IS NULL 
    THEN EXCLUDED.company_id 
    ELSE contacts.company_id 
  END,
  updated_at = NOW();

-- Step 3: Update deals table with proper foreign key relationships
UPDATE deals 
SET 
  company_id = companies.id,
  primary_contact_id = contacts.id
FROM companies, contacts
WHERE deals.company = companies.name 
  AND deals.owner_id = companies.owner_id
  AND deals.contact_email = contacts.email
  AND deals.owner_id = contacts.owner_id;

-- Step 4: Create deal_contacts relationships for existing deals
INSERT INTO deal_contacts (deal_id, contact_id, role)
SELECT DISTINCT 
  deals.id as deal_id,
  contacts.id as contact_id,
  'decision_maker' as role -- Assume primary contact is decision maker
FROM deals
INNER JOIN contacts ON deals.contact_email = contacts.email 
  AND deals.owner_id = contacts.owner_id
WHERE deals.primary_contact_id IS NOT NULL
ON CONFLICT (deal_id, contact_id) DO NOTHING;

-- Step 5: Update activities with proper relationships where possible
UPDATE activities 
SET 
  contact_id = contacts.id,
  company_id = contacts.company_id,
  auto_matched = true
FROM contacts
WHERE activities.contact_identifier = contacts.email
  AND activities.user_id = contacts.owner_id;

-- Step 6: Link activities to deals where contact and deal relationships exist
UPDATE activities 
SET deal_id = deals.id
FROM deals, contacts
WHERE activities.contact_id = contacts.id
  AND deals.primary_contact_id = contacts.id
  AND activities.user_id = deals.owner_id
  AND activities.deal_id IS NULL; -- Only update if not already linked

-- Step 7: Create a summary view for data quality validation
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
  'Companies' as entity,
  COUNT(*) as total_created,
  COUNT(CASE WHEN domain IS NOT NULL THEN 1 END) as with_domain,
  COUNT(CASE WHEN domain IS NULL THEN 1 END) as without_domain
FROM companies
UNION ALL
SELECT 
  'Contacts' as entity,
  COUNT(*) as total_created,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as without_company
FROM contacts
UNION ALL
SELECT 
  'Deals Updated' as entity,
  COUNT(*) as total_updated,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
  COUNT(CASE WHEN primary_contact_id IS NOT NULL THEN 1 END) as with_contact
FROM deals
UNION ALL
SELECT 
  'Activities Matched' as entity,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN contact_id IS NOT NULL THEN 1 END) as with_contact,
  COUNT(CASE WHEN deal_id IS NOT NULL THEN 1 END) as with_deal
FROM activities;

-- Display migration summary
SELECT * FROM migration_summary; 