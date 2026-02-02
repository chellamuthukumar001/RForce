-- Add missing columns to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing rows to have default values if needed (optional)
-- UPDATE public.volunteers SET name = 'Unknown Volunteer' WHERE name IS NULL;
