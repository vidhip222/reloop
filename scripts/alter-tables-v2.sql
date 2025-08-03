-- Add relist_platform column to the returns table
ALTER TABLE public.returns
ADD COLUMN relist_platform VARCHAR(255);
