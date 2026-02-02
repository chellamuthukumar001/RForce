-- ================================================================
-- FIX VOLUNTEER SCHEMA: user_id → profile_id
-- This migration ensures consistency across the application
-- ================================================================

-- Step 1: Check if we need to rename the column
DO $$
BEGIN
  -- Only rename if user_id exists and profile_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'volunteers' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'volunteers' 
    AND column_name = 'profile_id'
  ) THEN
    -- Rename user_id to profile_id
    ALTER TABLE public.volunteers RENAME COLUMN user_id TO profile_id;
    RAISE NOTICE 'Renamed user_id to profile_id in volunteers table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'volunteers' 
    AND column_name = 'profile_id'
  ) THEN
    RAISE NOTICE 'Column profile_id already exists, no rename needed';
  ELSE
    RAISE NOTICE 'Neither user_id nor profile_id found, adding profile_id';
    ALTER TABLE public.volunteers ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Ensure the column has proper constraints
ALTER TABLE public.volunteers 
  DROP CONSTRAINT IF EXISTS volunteers_user_id_fkey;

ALTER TABLE public.volunteers 
  DROP CONSTRAINT IF EXISTS volunteers_profile_id_fkey;

ALTER TABLE public.volunteers 
  ADD CONSTRAINT volunteers_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Step 3: Add missing columns if they don't exist
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS total_assigned_tasks INTEGER DEFAULT 0;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Update RLS policies to use profile_id
DROP POLICY IF EXISTS "Volunteers visible to admins and other volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Volunteers can update their own status" ON public.volunteers;
DROP POLICY IF EXISTS "Public Read Volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Volunteers update self" ON public.volunteers;

-- Create updated policies
CREATE POLICY "Public Read Volunteers" 
  ON public.volunteers 
  FOR SELECT 
  USING (true);

CREATE POLICY "Volunteers can update own profile" 
  ON public.volunteers 
  FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Volunteers can insert own profile" 
  ON public.volunteers 
  FOR INSERT 
  WITH CHECK (profile_id = auth.uid());

-- Step 5: Update task_assignments policies to use correct volunteer reference
DROP POLICY IF EXISTS "Volunteers Update Assignments" ON public.task_assignments;

CREATE POLICY "Volunteers Update Assignments" 
  ON public.task_assignments 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteers 
      WHERE volunteers.id = task_assignments.volunteer_id 
      AND volunteers.profile_id = auth.uid()
    )
  );

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_volunteers_profile_id ON public.volunteers(profile_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_availability ON public.volunteers(availability);
CREATE INDEX IF NOT EXISTS idx_volunteers_skills ON public.volunteers USING GIN(skills);

-- Step 7: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query (run this separately to check)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'volunteers' 
-- AND column_name IN ('user_id', 'profile_id')
-- ORDER BY column_name;
