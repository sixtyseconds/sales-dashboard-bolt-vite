    ALTER TABLE public.targets
    ADD COLUMN previous_target_id UUID NULL REFERENCES public.targets(id);

    COMMENT ON COLUMN public.targets.previous_target_id IS 'ID of the target record that this record version supersedes (due to modification). NULL for the first target in a chain.';