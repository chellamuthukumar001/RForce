import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { mockVolunteers, mockDisasters, mockTasks, mockAssignments, mockUpdates } from './mockData.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // 1. Create Users (Admin & Volunteers)
        // We map the mock IDs (e.g., 'volunteer-1') to real Supabase Auth User IDs
        const userMapping = {};

        // Create Admin User
        const adminEmail = 'admin@example.com';
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: 'password123',
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (adminError && !adminError.message.includes('already registered')) {
            console.error('Error creating admin:', adminError);
        }

        // If user already exists, we need to fetch their ID. 
        // Ideally, for a fresh seed, we might wipe data, but here we just try to get the ID.
        // Simplifying assumption: if create fails, we might not have the ID easily without listUsers

        let adminId = adminUser?.user?.id;
        if (!adminId) {
            // Fallback: try to list users to find admin (optional, for now let's hope it's fresh or handle gracefully)
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingAdmin = users.users.find(u => u.email === adminEmail);
            if (existingAdmin) adminId = existingAdmin.id;
        }

        if (adminId) {
            userMapping['admin-1'] = adminId;
            // Upsert Admin Profile
            await supabase.from('profiles').upsert({
                id: adminId,
                email: adminEmail,
                full_name: 'Admin User',
                role: 'admin'
            });
            await supabase.from('admins').upsert({
                profile_id: adminId,
                verified: true,
                department: 'Emergency Response'
            });
            console.log(`✅ Admin user prepared: ${adminId}`);
        }


        // Create Volunteers
        for (const vol of mockVolunteers) {
            let volId;
            const { data: volUser, error: volError } = await supabase.auth.admin.createUser({
                email: vol.email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { role: 'volunteer' }
            });

            if (volError) {
                if (volError.message.includes('already registered')) {
                    // Fetch existing user to get ID
                    const { data: users } = await supabase.auth.admin.listUsers();
                    const existingVol = users.users.find(u => u.email === vol.email);
                    if (existingVol) {
                        volId = existingVol.id;
                        // Ensure password is correct for existing user
                        await supabase.auth.admin.updateUserById(volId, { password: 'password123' });
                    }
                } else {
                    console.error('Error creating volunteer:', volError);
                    continue;
                }
            } else {
                volId = volUser.user.id;
            }

            if (volId) {
                userMapping[vol.user_id] = volId;
                // Upsert Volunteer Profile
                await supabase.from('profiles').upsert({
                    id: volId,
                    email: vol.email,
                    full_name: vol.name,
                    role: 'volunteer',
                    phone: vol.phone
                });
                console.log(`✅ Volunteer user prepared: ${vol.name} -> ${volId}`);
            }
        }

        // 2. Insert Volunteers Data
        console.log('Inserting volunteers detailed data...');

        // Map mock data and prepare for DB insertion
        const volData = [];
        for (const v of mockVolunteers) {
            const realUserId = userMapping[v.user_id];
            if (realUserId) {
                // Prepare object for 'volunteers' table, stripping out fields that belong to 'profiles' or don't exist
                // 'volunteers' columns: profile_id, skills, availability, latitude, longitude, reliability_score, etc.
                // 'name' and 'email' should NOT be inserted here (they are in profiles).
                // We kept 'availability' in mock data which matches column 'availability' (text)

                const { user_id, name, email, phone, id, ...rest } = v;

                volData.push({
                    profile_id: realUserId,
                    ...rest,
                    // Ensure defaults if missing
                    reliability_score: v.reliability_score || 100,
                    completed_tasks: v.completed_tasks || 0,
                    total_assigned_tasks: v.total_assigned_tasks || 0
                });
            }
        }

        const volunteerDbIdMapping = {}; // mock id (1) -> real uuid

        for (const v of volData) {
            // We need to match back to mock ID to populate `volunteerDbIdMapping`.
            // Since we stripped it, we can look it up or just iterate differently.
            // Better approach: Iterate mockVolunteers again.
        }

        // Re-iterate mockVolunteers to insert and map
        for (const v of mockVolunteers) {
            const realUserId = userMapping[v.user_id];
            if (!realUserId) continue;

            const { user_id, name, email, phone, id: mockId, ...rest } = v;

            // Construct insert payload
            const insertPayload = {
                profile_id: realUserId,
                skills: v.skills || [],
                availability: v.availability || 'available',
                latitude: v.latitude,
                longitude: v.longitude,
                reliability_score: v.reliability_score || 100,
                completed_tasks: v.completed_tasks || 0,
                total_assigned_tasks: v.total_assigned_tasks || 0
            };

            // Use upsert on profile_id unique constraint if possible, but volunteers PK is id. 
            // We should use upsert based on profile_id if there is a unique constraint, otherwise we need to select first.
            // Assuming profile_id is unique for volunteers.

            // First check if exists
            const { data: existing } = await supabase.from('volunteers').select('id').eq('profile_id', realUserId).single();

            let result;
            if (existing) {
                result = await supabase.from('volunteers').update(insertPayload).eq('profile_id', realUserId).select().single();
            } else {
                result = await supabase.from('volunteers').insert(insertPayload).select().single();
            }

            if (result.error) {
                console.error(`Error inserting/updating volunteer ${v.name}:`, result.error.message);
            } else {
                volunteerDbIdMapping[mockId] = result.data.id; // Map mock ID (e.g. undefined/autogen in mock? mockData usually has IDs?)
                // Wait, mockData has no 'id' field in mockVolunteers array in the file I viewed!
                // Let's check mockData.js again.
                // It has: user_id: 'volunteer-0', name...
                // It does NOT have an integer 'id'.
                // But `seed.js` later tries to map assignments using `volunteerDbIdMapping[volunteer_id]`.
                // In `mockAssignments`, `volunteer_id` is 2. `mockVolunteers` index?
                // `mockVolunteers` has `user_id`: 'volunteer-1' etc.
                // Let's assume the mock assignments refer to the INDEX or some ID we need to infer.
                // Inspecting mockData.js again:
                // mockAssignments: { volunteer_id: 2 } ...
                // mockVolunteers[1] is 'Sarah Jenkins' (user_id: 'volunteer-1').
                // It seems likely `volunteer_id: 2` in assignment refers to user_id 'volunteer-2' (Mike Ross).

                // Let's map based on user_id string 'volunteer-X'.
                const mockUserKey = v.user_id; // e.g., 'volunteer-1'
                // But wait, assignments use integer `2`. 
                // Let's map 'volunteer-2' -> real UUID. And we need to handle how assignments reference it.
                // If assignments use `2`, and that corresponds to `volunteer-2`, we can map `2` -> real UUID.

                // Let's extract the integer part from user_id 'volunteer-2' => 2.
                const mockIntId = parseInt(mockUserKey.split('-')[1]);
                if (!isNaN(mockIntId)) {
                    volunteerDbIdMapping[mockIntId] = result.data.id;
                }
            }
        }

        // 3. Insert Disasters
        console.log('Inserting disasters...');
        for (const d of mockDisasters) {
            const { id: mockId, created_by, ...insertData } = d;
            insertData.created_by = userMapping[created_by] || userMapping['admin-1']; // Fallback to admin if mapped user not found

            const { data, error } = await supabase.from('disasters').insert(insertData).select().single();
            if (error) console.error(`Error inserting disaster ${d.name}:`, error.message);
            else {
                disasterDbIdMapping[mockId] = data.id;
            }
        }

        // 4. Insert Tasks
        console.log('Inserting tasks...');
        for (const t of mockTasks) {
            const { id: mockId, disaster_id, created_by, ...insertData } = t;
            insertData.disaster_id = disasterDbIdMapping[disaster_id];
            insertData.created_by = userMapping[created_by] || userMapping['admin-1'];

            if (insertData.disaster_id) {
                const { data, error } = await supabase.from('tasks').insert(insertData).select().single();
                if (error) console.error(`Error inserting task ${t.title}:`, error.message);
                else {
                    taskDbIdMapping[mockId] = data.id;
                }
            }
        }

        // 5. Insert Assignments (optional, depends on mock data)
        console.log('Inserting assignments...');
        for (const a of mockAssignments) {
            const { id: mockId, task_id, volunteer_id, ...insertData } = a;
            insertData.task_id = taskDbIdMapping[task_id];
            insertData.volunteer_id = volunteerDbIdMapping[volunteer_id]; // Note: this maps to 'volunteers' table ID, not user_id

            if (insertData.task_id && insertData.volunteer_id) {
                const { error } = await supabase.from('task_assignments').insert(insertData);
                if (error) console.error(`Error inserting assignment for task ${t.title}:`, error.message);
            } else {
                console.warn(`Skipping assignment due to missing ID mapping: Task ${mockId} or Volunteer ${volunteer_id}`);
            }
        }

        // 6. Insert Updates/Alerts
        console.log('Inserting updates...');
        for (const u of mockUpdates) {
            const { id: mockId, disaster_id, created_by, priority, ...insertData } = u;
            // Map fields to 'alerts' table schema
            // Mock schema: title, message, priority, disaster_id
            // DB schema: table 'alerts' -> disaster_id, message, sent_to_role (enum)

            // We might need to adapt the data. The 'alerts' table doesn't have 'title' or 'priority' in the schema viewed earlier.
            // 'alerts' columns: id, disaster_id, message, sent_to_role, created_at

            const alertData = {
                disaster_id: disasterDbIdMapping[disaster_id],
                message: `${u.title}: ${u.message}`, // Combine title and message
                sent_to_role: 'volunteer', // Default
                created_at: u.created_at
            };

            if (alertData.disaster_id) {
                await supabase.from('alerts').insert(alertData);
            }
        }

        console.log('✅ Seeding complete!');

    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seed();
