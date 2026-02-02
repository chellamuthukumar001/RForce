-- Enable PostGIS if needed (but user didn't explicitly ask for it, just lat/long float)
-- CREATE EXTENSION IF NOT EXISTS postgis; 
-- For now we use float for lat/long as requested.

-- 1. ENUMS
CREATE TYPE role_type AS ENUM ('admin', 'volunteer', 'citizen');
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE disaster_type AS ENUM ('flood', 'earthquake', 'cyclone', 'fire', 'other');
CREATE TYPE disaster_status_type AS ENUM ('reported', 'verified', 'resolved'); -- Renamed to avoid reserved word conflict if any
CREATE TYPE assignment_status AS ENUM ('assigned', 'accepted', 'declined', 'completed');
CREATE TYPE alert_recipient AS ENUM ('volunteer', 'citizen', 'admin');

-- 2. TABLES

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role role_type NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id), -- Specific admin who verified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteers
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skills TEXT[], -- Array of strings
  availability_status availability_status DEFAULT 'offline',
  reliability_score FLOAT DEFAULT 0.5,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disasters
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  disaster_type disaster_type NOT NULL,
  severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  status disaster_status_type DEFAULT 'reported',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer Assignments
CREATE TABLE volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  ai_score FLOAT,
  assignment_status assignment_status DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES disasters(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sent_to_role alert_recipient NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts (Optional)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admins: Only verified admins can read admin list? Or public? Let's say public can see who is admin? 
-- The prompt says "Only verified admins can create disasters".
-- For admins table policies:
CREATE POLICY "Admins visible to registered users" ON admins FOR SELECT TO authenticated USING (true);

-- Volunteers: 
CREATE POLICY "Volunteers visible to admins and other volunteers" ON volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Volunteers can update their own status" ON volunteers FOR UPDATE USING (profile_id = auth.uid());

-- Disasters: 
-- "Public users can read verified disasters"
CREATE POLICY "Public can read verified disasters" ON disasters FOR SELECT USING (status = 'verified');
-- "Users (Admins/Volunteers) can read all" - Simplified to authenticated for now, or check role? 
-- Let's allow authenticated to read all for simplicity in coordination.
CREATE POLICY "Authenticated can read all disasters" ON disasters FOR SELECT TO authenticated USING (true);

-- "Only verified admins can create disasters"
-- This requires a check on the admins table.
CREATE POLICY "Verified admins can create disasters" ON disasters FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.profile_id = auth.uid() 
    AND admins.verified = true
  )
);
-- Same for update?
CREATE POLICY "Verified admins can update disasters" ON disasters FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.profile_id = auth.uid() 
    AND admins.verified = true
  )
);

-- Volunteer Assignments
-- "Volunteers can see only assigned disasters" -> This refers to viewing the disaster? Or the assignment?
-- Use case: Volunteer checks "My Assignments".
CREATE POLICY "Volunteers can view their own assignments" ON volunteer_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM volunteers
    WHERE volunteers.id = volunteer_assignments.volunteer_id
    AND volunteers.profile_id = auth.uid()
  )
);
-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments" ON volunteer_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.profile_id = auth.uid()
    AND admins.verified = true
  )
);

-- Alerts
-- "sent_to_role" logic
CREATE POLICY "Users view alerts for their role" ON alerts FOR SELECT TO authenticated
USING (
   (sent_to_role = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) OR 
   (sent_to_role = 'volunteer' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'volunteer')) OR
   (sent_to_role = 'citizen' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'citizen'))
);

-- Blog Posts
CREATE POLICY "Public view blog posts" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Admins create blog posts" ON blog_posts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.profile_id = auth.uid() 
    AND admins.verified = true
  )
);

-- 4. INDEXES
CREATE INDEX idx_volunteers_location ON volunteers(latitude, longitude);
CREATE INDEX idx_disasters_location ON disasters(latitude, longitude);
CREATE INDEX idx_volunteer_assignments_disaster_id ON volunteer_assignments(disaster_id);
CREATE INDEX idx_volunteer_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
