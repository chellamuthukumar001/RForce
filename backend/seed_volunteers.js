
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Default location (San Francisco area, matching MapView default)
const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

const SKILLS_LIST = [
    'Medical Aid', 'First Aid', 'Search and Rescue', 'Emergency Response',
    'Food Distribution', 'Shelter Management', 'Logistics', 'Physical Labor',
    'Child Care', 'Psychological Support', 'Translation', 'Community Outreach'
];

function getRandomSkills() {
    const numSkills = Math.floor(Math.random() * 3) + 1;
    const shuffled = SKILLS_LIST.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numSkills);
}

function getRandomLocation() {
    // Generate within ~5km radius (approx 0.045 deg lat/lng)
    const latOffset = (Math.random() - 0.5) * 0.09;
    const lngOffset = (Math.random() - 0.5) * 0.09;
    return {
        lat: BASE_LAT + latOffset,
        lng: BASE_LNG + lngOffset
    };
}

async function seedVolunteers() {
    console.log('🌱 Starting volunteer seeding process...');
    console.log('Creating 50 volunteers near San Francisco...');

    const volunteersToCreate = 50;
    let successCount = 0;

    for (let i = 0; i < volunteersToCreate; i++) {
        const uniqueId = Math.random().toString(36).substring(7);
        const email = `mock_vol_${Date.now()}_${uniqueId}@example.com`;
        const password = 'password123';
        const name = `Volunteer ${i + 1}`;
        const location = getRandomLocation();

        try {
            // 1. Create Auth User
            const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (authError) {
                // If user exists, skip or handle (rare given timestamp in email)
                console.error(`Auth error for ${email}:`, authError.message);
                continue;
            }

            // 2. Create Profile
            // Check if profile exists (sometimes trigger creates it, sometimes not)
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

            if (!existingProfile) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email,
                        full_name: name,
                        role: 'volunteer'
                    });
                if (profileError) throw new Error(`Profile create failed: ${profileError.message}`);
            }

            // 3. Create Volunteer Record
            // Note: Schema 'volunteers' uses 'user_id' as FK to profiles(id)? 
            // Checking create_tables.sql: "user_id UUID REFERENCES public.profiles(id)"
            // Wait, schema usually uses 'id' or 'user_id'. 
            // Line 27: user_id UUID REFERENCES public.profiles(id)
            // Line 26: id UUID PRIMARY KEY DEFAULT gen_random_uuid()
            // So we insert 'profile_id' -> NO, column name is 'user_id'.
            // Re-checking create_tables.sql content in memory...
            // Line 27:   user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to profile
            // BUT, in `volunteers.js` (Step 155), the insert code uses:
            // Line 81: profile_id: req.user.id
            // This is a CONFLICT. `create_tables.sql` says `user_id`, `volunteers.js` says `profile_id`.
            // User might have run an older schema or the code in `volunteers.js` matches the ACTUAL DB.
            // Code in `volunteers.js` is the source of truth for what works. 
            // In `volunteers.js`: .insert({ profile_id: req.user.id ... })
            // So column name is likely `profile_id`. The SQL file viewed might be outdated or different version.
            // I will trust the JS code `volunteers.js` which uses `profile_id`.

            const { error: volunteerError } = await supabase
                .from('volunteers')
                .insert({
                    profile_id: user.id,
                    skills: getRandomSkills(),
                    availability: 'available',
                    latitude: location.lat,
                    longitude: location.lng,
                    reliability_score: Math.floor(Math.random() * 20) + 80 // 80-100
                });

            if (volunteerError) throw new Error(`Volunteer insert failed: ${volunteerError.message}`);

            successCount++;
            if (i % 10 === 0) process.stdout.write(` ${i}...`);

        } catch (err) {
            console.error(`\n❌ Error ${i + 1}:`, err.message);
        }
    }

    console.log(`\n✅ Finished! Created ${successCount} volunteers.`);
}

seedVolunteers();
