
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS availability text DEFAULT 'available',
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS name text;

-- Update existing records
UPDATE profiles SET availability = 'available' WHERE availability IS NULL;
UPDATE profiles SET reliability_score = 100 WHERE reliability_score IS NULL;
