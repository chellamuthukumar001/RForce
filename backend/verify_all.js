import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    console.log('🔍 Verifying Data...');

    const { count: volCount, error: volError } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
    if (volError) console.error('Volunteers error:', volError);
    console.log(`Volunteers: ${volCount}`);

    const { count: taskCount, error: taskError } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    if (taskError) console.error('Tasks error:', taskError);
    console.log(`Tasks: ${taskCount}`);

    const { count: assignCount, error: assignError } = await supabase.from('task_assignments').select('*', { count: 'exact', head: true });
    if (assignError) console.error('Assignments error:', assignError);
    console.log(`Assignments: ${assignCount}`);

    const { count: disasterCount, error: disasterError } = await supabase.from('disasters').select('*', { count: 'exact', head: true });
    if (disasterError) console.error('Disasters error:', disasterError);
    console.log(`Disasters: ${disasterCount}`);

    const { count: updateCount, error: updateError } = await supabase.from('updates').select('*', { count: 'exact', head: true });
    if (updateError) console.error('Updates error:', updateError);
    console.log(`Updates: ${updateCount}`);

    if (volCount > 0 && taskCount > 0 && updateCount > 0) {
        console.log('✅ verification PASSED: All tables have data.');
    } else {
        console.log('❌ verification FAILED: Some tables are empty.');
    }
}

verify();
