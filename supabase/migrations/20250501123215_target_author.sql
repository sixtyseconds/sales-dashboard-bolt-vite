-- Add the created_by column
ALTER TABLE public.targets
ADD COLUMN created_by UUID NULL REFERENCES auth.users(id);

COMMENT ON COLUMN public.targets.created_by IS 'ID of the admin user who created this specific target record/version. Should ideally be NOT NULL, consider backfilling for existing records if necessary.';

-- Add the closed_by column
ALTER TABLE public.targets
ADD COLUMN closed_by UUID NULL REFERENCES auth.users(id);

COMMENT ON COLUMN public.targets.closed_by IS 'ID of the admin user who ended the validity of this target record (set the end_date). NULL if the record is still active or was never closed.';
