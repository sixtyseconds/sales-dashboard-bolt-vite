-- Drop the existing constraint
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_status_check;

-- Add the new constraint including 'no_show'
ALTER TABLE public.activities 
ADD CONSTRAINT activities_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]));

-- Optional: Add a comment to the constraint for clarity
COMMENT ON CONSTRAINT activities_status_check ON public.activities 
IS 'Ensures activities status is one of: pending, completed, cancelled, no_show';
