import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

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

async function seed() {
    console.log('🌱 Starting Database Seed...');

    // 1. Create Users (Admin & Volunteer)
    const users = [
        { email: 'admin@example.com', password: 'password123', role: 'admin', name: 'Admin User' },
        { email: 'volunteer@example.com', password: 'password123', role: 'volunteer', name: 'John Volunteer' }
    ];

    const createdUsers = {};

    for (const user of users) {
        console.log(`Creating user: ${user.email}...`);

        // Try to create user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true
        });

        let userId;

        if (authError) {
            if (authError.message.includes('already been registered')) {
                console.log(`User ${user.email} already exists. Fetching ID...`);
                const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
                userId = allUsers.find(u => u.email === user.email)?.id;
            } else {
                console.error(`Failed to create user ${user.email}:`, authError);
                continue;
            }
        } else {
            userId = authData.user.id;
            console.log(`User created: ${userId}`);
        }

        if (!userId) continue;

        createdUsers[user.role] = { ...user, id: userId };

        // Upsert Profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: user.email,
            full_name: user.name,
            role: user.role
        });

        if (profileError) console.error(`Profile error for ${user.email}:`, profileError);

        // If volunteer, create volunteer record
        if (user.role === 'volunteer') {
            const { error: volError } = await supabase.from('volunteers').upsert({
                user_id: userId,
                skills: ['First Aid', 'Search & Rescue', 'Driving'],
                availability: 'available',
                reliability_score: 100,
                city: 'New York',
                state: 'NY',
                country: 'USA'
            }, { onConflict: 'user_id' });

            if (volError) console.error(`Volunteer record error:`, volError);
        }
    }

    if (!createdUsers.admin || !createdUsers.volunteer) {
        console.error('Failed to setup users. Aborting.');
        return;
    }

    // Unpack IDs for easy access
    const adminId = createdUsers.admin.id;
    const volunteerUserId = createdUsers.volunteer.id;

    // Get Volunteer ID (PK of volunteers table)
    const { data: volunteerRecord } = await supabase.from('volunteers').select('id').eq('user_id', volunteerUserId).single();
    if (!volunteerRecord) {
        console.error('CRITICAL: Volunteer record missing.');
        return;
    }
    const volunteerId = volunteerRecord.id;


    // 2. Create Disasters
    console.log('Creating Disasters...');
    const disasters = [
        {
            name: 'City Flood 2024',
            description: 'Severe flooding in downtown area due to heavy rains.',
            type: 'flood',
            urgency: 'critical',
            status: 'active',
            latitude: 40.7128,
            longitude: -74.0060,
            city: 'New York',
            state: 'NY',
            country: 'USA',
            created_by: adminId
        },
        {
            name: 'Forest Fire - North Woods',
            description: 'Spreading fire in the northern forest reserve.',
            type: 'fire',
            urgency: 'high',
            status: 'active',
            latitude: 40.7800,
            longitude: -74.1000,
            city: 'New York',
            state: 'NY',
            country: 'USA',
            created_by: adminId
        }
    ];

    const { data: insertedDisasters, error: disasterError } = await supabase
        .from('disasters')
        .insert(disasters)
        .select();

    if (disasterError) {
        console.error('Disaster creation failed:', disasterError);
        return;
    }
    console.log(`Created ${insertedDisasters.length} disasters.`);


    // 3. Create Tasks
    console.log('Creating Tasks...');
    const tasks = [
        {
            disaster_id: insertedDisasters[0].id,
            title: 'Evacuate Residents',
            description: 'Assist elderly residents in sector 4 to reach safe zone.',
            status: 'open',
            priority: 'high',
            required_skills: ['First Aid', 'Driving'],
            created_by: adminId
        },
        {
            disaster_id: insertedDisasters[0].id,
            title: 'Distribute Food Packets',
            description: 'Distribute relief material at the community center.',
            status: 'open',
            priority: 'medium',
            required_skills: ['Driving'],
            created_by: adminId
        },
        {
            disaster_id: insertedDisasters[1].id,
            title: 'Clear Fire Paths',
            description: 'Help fire department clear dry brush.',
            status: 'open',
            priority: 'critical',
            required_skills: ['Search & Rescue'],
            created_by: adminId
        }
    ];

    const { data: insertedTasks, error: taskError } = await supabase
        .from('tasks')
        .insert(tasks)
        .select();

    if (taskError) {
        console.error('Task creation failed:', taskError);
        return;
    }
    console.log(`Created ${insertedTasks.length} tasks.`);


    // 4. Assign one task to volunteer
    console.log('Assigning Task...');
    const taskToAssign = insertedTasks[0];

    const { error: assignError } = await supabase
        .from('task_assignments')
        .insert({
            task_id: taskToAssign.id,
            volunteer_id: volunteerId,
            status: 'pending'
        });

    if (assignError) console.error('Assignment failed:', assignError);
    else console.log(`Assigned task "${taskToAssign.title}" to volunteer.`);

    console.log('✅ Seeding Complete!');
}

seed();
