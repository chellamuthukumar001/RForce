import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const volunteers = Array.from({ length: 15 }, (_, i) => ({
    email: `volunteer${i + 1}_test@example.com`,
    password: `password${i + 1}`,
    role: 'volunteer',
    name: `Test Volunteer ${i + 1}`
}));

async function createVolunteers() {
    console.log('🚀 Starting volunteer simulation (Direct Admin Access)...');

    for (const volunteer of volunteers) {
        try {
            console.log(`Processing ${volunteer.email}...`);

            let userId;

            // 1. Check if user exists
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            const existingUser = usersData.users.find(u => u.email === volunteer.email);

            if (existingUser) {
                // console.log(`ℹ️ User already exists: ${volunteer.email}`);
                userId = existingUser.id;
            } else {
                // 2. Create user if not exists
                const { data, error } = await supabase.auth.admin.createUser({
                    email: volunteer.email,
                    password: volunteer.password,
                    email_confirm: true,
                    user_metadata: { name: volunteer.name }
                });

                if (error) {
                    console.error(`❌ Failed to create user ${volunteer.email}:`, error.message);
                    continue;
                }
                userId = data.user.id;
                console.log(`✅ Created user: ${volunteer.email}`);
            }

            if (userId) {
                // 3. Upsert Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        role: volunteer.role,
                        email: volunteer.email,
                        full_name: volunteer.name
                    });

                if (profileError) {
                    console.error(`❌ Profile Error for ${volunteer.email}:`, profileError.message);
                }

                // 4. Upsert Volunteer
                const { error: volunteerError } = await supabase
                    .from('volunteers')
                    .upsert({
                        profile_id: userId,
                        skills: ['First Aid', 'Search and Rescue'],
                        availability: 'available',
                        reliability_score: 100,
                        completed_tasks: 0,
                        total_assigned_tasks: 0
                    }, { onConflict: 'profile_id' }); // Assuming profile_id handles uniqueness or we rely on upsert logic

                // Note: volunteers table usually has an 'id' PK. upsert needs a match on constraint.
                // If we don't know the volunteer 'id', upsert might fail or insert duplicate if no unique constraint on profile_id.
                // Ideally schema has UNIQUE(profile_id).
                // If not, we should select first.

                // Let's check if we can select first to be safe, as I recall unsure about unique constraint on profile_id.
                const { data: existingVol } = await supabase.from('volunteers').select('id').eq('profile_id', userId).single();

                if (!existingVol) {
                    const { error: volInsertError } = await supabase
                        .from('volunteers')
                        .insert({
                            profile_id: userId,
                            skills: ['First Aid', 'Search and Rescue'],
                            availability: 'available',
                            reliability_score: 100,
                            completed_tasks: 0,
                            total_assigned_tasks: 0
                        });
                    if (volInsertError) console.error(`❌ Volunteer Insert Error for ${volunteer.email}:`, volInsertError.message);
                    else console.log(`✅ Volunteer record created/updated for ${volunteer.email}`);
                } else {
                    // Update if needed, or just skip
                    console.log(`ℹ️ Volunteer record already exists for ${volunteer.email}`);
                }
            }

        } catch (error) {
            console.error(`❌ Error processing ${volunteer.email}:`, error.message);
        }
    }

    console.log('✨ Simulation complete!');
}

createVolunteers();
