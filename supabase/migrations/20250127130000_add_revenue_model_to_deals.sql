/*
  # Add Revenue Model Fields to Deals Table
  
  This migration adds support for hybrid revenue model:
  
  1. New columns
    - `one_off_revenue` (One-time payment amount)
    - `monthly_mrr` (Monthly Recurring Revenue)
    - `annual_value` (Calculated field for easier reporting)
  
  2. The existing `value` field becomes auto-calculated:
    - Total Deal Value = one_off_revenue + (monthly_mrr * 3)
    - This gives a 3-month weighted value for mixed deals
*/

-- Add new revenue model columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS one_off_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_mrr DECIMAL(12,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS annual_value DECIMAL(12,2) DEFAULT NULL;

-- Create function to calculate total deal value
CREATE OR REPLACE FUNCTION calculate_deal_total_value(
  p_one_off_revenue DECIMAL(12,2),
  p_monthly_mrr DECIMAL(12,2)
) RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN COALESCE(p_one_off_revenue, 0) + (COALESCE(p_monthly_mrr, 0) * 3);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate annual value
CREATE OR REPLACE FUNCTION calculate_deal_annual_value(
  p_one_off_revenue DECIMAL(12,2),
  p_monthly_mrr DECIMAL(12,2)
) RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN COALESCE(p_one_off_revenue, 0) + (COALESCE(p_monthly_mrr, 0) * 12);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update calculated fields
CREATE OR REPLACE FUNCTION update_deal_revenue_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate total deal value
  NEW.value := calculate_deal_total_value(NEW.one_off_revenue, NEW.monthly_mrr);
  
  -- Auto-calculate annual value
  NEW.annual_value := calculate_deal_annual_value(NEW.one_off_revenue, NEW.monthly_mrr);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_deal_revenue_trigger ON deals;
CREATE TRIGGER update_deal_revenue_trigger
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_revenue_calculations();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_one_off_revenue ON deals(one_off_revenue) WHERE one_off_revenue > 0;
CREATE INDEX IF NOT EXISTS idx_deals_monthly_mrr ON deals(monthly_mrr) WHERE monthly_mrr > 0;
CREATE INDEX IF NOT EXISTS idx_deals_annual_value ON deals(annual_value) WHERE annual_value IS NOT NULL;

-- Migrate existing deals - move current value to one_off_revenue
UPDATE deals 
SET one_off_revenue = COALESCE(value, 0),
    monthly_mrr = 0
WHERE one_off_revenue IS NULL OR one_off_revenue = 0;

-- Trigger the recalculation for all deals
UPDATE deals SET updated_at = NOW();

-- Add helpful comments
COMMENT ON COLUMN deals.one_off_revenue IS 'One-time payment amount';
COMMENT ON COLUMN deals.monthly_mrr IS 'Monthly Recurring Revenue amount';
COMMENT ON COLUMN deals.annual_value IS 'Calculated annual value: one_off + (mrr * 12) - auto-updated';
COMMENT ON COLUMN deals.value IS 'Total deal value: one_off + (mrr * 3) - auto-calculated'; 