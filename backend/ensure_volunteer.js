import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Ensuring volunteer exists...");

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === 'volunteer@example.com');

    if (!user) {
        console.log("Creating Auth User...");
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'volunteer@example.com',
            password: 'password123',
            email_confirm: true
        });
        if (error) { console.error("Auth create error:", error); process.exit(1); }
        user = data.user;
    }
    console.log("Auth User ID:", user.id);

    // 2. Upsert Profile
    await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: 'John Volunteer',
        role: 'volunteer'
    });

    // 3. Upsert Volunteer (Manual)
    const { data: existing } = await supabase.from('volunteers').select('id').eq('profile_id', user.id).single();

    let volData;
    if (existing) {
        console.log("Volunteer exists, updating...");
        const { data, error } = await supabase.from('volunteers').update({
            skills: ['First Aid', 'Driving'],
            availability_status: 'available',
            reliability_score: 1.0
        }).eq('id', existing.id).select();
        volData = data;
    } else {
        console.log("Creating volunteer...");
        const { data, error } = await supabase.from('volunteers').insert({
            profile_id: user.id,
            skills: ['First Aid', 'Driving'],
            availability_status: 'available',
            reliability_score: 1.0
        }).select();
        volData = data;
        if (error) console.error("Insert error:", error);
    }

    console.log("Volunteer Data:", volData);
}

run();
