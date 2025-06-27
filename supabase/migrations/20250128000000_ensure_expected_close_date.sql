/*
  # Ensure expected_close_date column exists
  
  This migration ensures the expected_close_date column exists in the deals table
  and refreshes the schema cache to fix any schema synchronization issues.
*/

-- Ensure the expected_close_date column exists (safe operation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'expected_close_date'
  ) THEN
    ALTER TABLE deals ADD COLUMN expected_close_date DATE;
    RAISE NOTICE 'Added expected_close_date column to deals table';
  ELSE
    RAISE NOTICE 'expected_close_date column already exists in deals table';
  END IF;
END $$;

-- Refresh the schema cache by updating the table's metadata
COMMENT ON COLUMN deals.expected_close_date IS 'Expected date when the deal will close';

-- Ensure proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date) WHERE expected_close_date IS NOT NULL; 