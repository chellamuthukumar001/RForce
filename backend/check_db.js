import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('Checking database state...');

    // Check auth user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) console.error('List users error:', usersError);

    const volunteerUser = users.find(u => u.email === 'volunteer@example.com');

    if (!volunteerUser) {
        console.error('❌ User volunteer@example.com NOT FOUND in Supabase Auth');
        return;
    }
    console.log('✅ Found Auth User:', volunteerUser.id);

    // Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', volunteerUser.id)
        .single();

    if (profileError || !profile) {
        console.error('❌ Profile NOT FOUND in public.profiles');
        console.error(profileError);
    } else {
        console.log('✅ Found Profile:', profile);
    }

    // Check Volunteer Record
    const { data: volunteer, error: volError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', volunteerUser.id)
        .single();

    if (volError || !volunteer) {
        console.error('❌ Volunteer Record NOT FOUND in public.volunteers');
        console.error(volError);
    } else {
        console.log('✅ Found Volunteer Record:', volunteer);
    }
}

check();
