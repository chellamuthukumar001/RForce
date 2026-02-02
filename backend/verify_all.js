import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    console.log('🔍 Verifying Data...');

    const { count: volCount } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
    console.log(`Volunteers: ${volCount}`);

    const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    console.log(`Tasks: ${taskCount}`);

    const { count: assignCount } = await supabase.from('task_assignments').select('*', { count: 'exact', head: true });
    console.log(`Assignments: ${assignCount}`);

    const { count: disasterCount } = await supabase.from('disasters').select('*', { count: 'exact', head: true });
    console.log(`Disasters: ${disasterCount}`);

    const { count: updateCount } = await supabase.from('updates').select('*', { count: 'exact', head: true });
    console.log(`Updates: ${updateCount}`);

    if (volCount > 0 && taskCount > 0 && updateCount > 0) {
        console.log('✅ verification PASSED: All tables have data.');
    } else {
        console.log('❌ verification FAILED: Some tables are empty.');
    }
}

verify();
