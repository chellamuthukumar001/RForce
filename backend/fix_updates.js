import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUpdates() {
    console.log('🔧 seeding Updates...');

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'admin@example.com');

    if (!adminUser) {
        console.error('Admin user not found.');
        return;
    }

    const { data: disasters } = await supabase.from('disasters').select('id, name');
    if (!disasters || disasters.length === 0) {
        console.error('No disasters found.');
        return;
    }

    const updates = [
        {
            title: 'Evacuation Warning',
            message: 'Immediate evacuation required for Zone A due to rising rising water levels.',
            priority: 'critical',
            category: 'Safety',
            disaster_id: disasters[0].id,
            created_by: adminUser.id
        },
        {
            title: 'Relief Center Open',
            message: 'Community center is now open for shelter and food.',
            priority: 'high',
            category: 'Relief',
            disaster_id: disasters[0].id,
            created_by: adminUser.id
        }
    ];

    const { data, error } = await supabase.from('updates').insert(updates).select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log(`✅ Seeded ${data.length} updates.`);
    }
}

fixUpdates();
