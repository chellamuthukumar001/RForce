import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
    console.log('🔧 Fixing Volunteer Data...');

    // 1. Get Volunteer Auth User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const volunteerUser = users.find(u => u.email === 'volunteer@example.com');

    if (!volunteerUser) {
        console.error('Generic volunteer user not found. Creating...');
        // Create if needed (omitted for brevity, assuming it exists or handled by seed)
    }
    console.log('Found User ID:', volunteerUser.id);

    // 2. Ensure Profile exists
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: volunteerUser.id,
        email: volunteerUser.email,
        full_name: 'John Volunteer',
        role: 'volunteer'
    });
    if (profileError) console.error('Profile Error:', profileError);

    // 3. Create Volunteer Record (Check then Insert)
    console.log('Creating Volunteer Record...');
    let volData;

    // Check existence
    const { data: existingVol } = await supabase.from('volunteers').select('id, profile_id').eq('profile_id', volunteerUser.id).single();

    if (existingVol) {
        console.log('Volunteer already exists.');
        volData = existingVol;
    } else {
        const { data: newVol, error: volError } = await supabase.from('volunteers').insert({
            profile_id: volunteerUser.id,
            skills: ['First Aid', 'Search & Rescue'],
            availability: 'available',
            reliability_score: 100
        }).select().single();

        if (volError) {
            console.error('Volunteer Create Error:', volError);
            return;
        }
        volData = newVol;
        console.log('Volunteer Created:', volData);
    }

    // 4. Assign a Task
    console.log('Assigning Task...');
    const { data: tasks } = await supabase.from('tasks').select('*').limit(1);

    if (tasks && tasks.length > 0) {
        const task = tasks[0];
        const { error: assignError } = await supabase.from('task_assignments').insert({
            task_id: task.id,
            volunteer_id: volData.id,
            status: 'pending'
        });

        if (assignError) console.error('Assignment Error:', assignError);
        else console.log(`Assigned task "${task.title}" to volunteer.`);
    } else {
        console.log('No tasks found to assign.');
    }

    console.log('✅ Fix Complete');
}

fix();
