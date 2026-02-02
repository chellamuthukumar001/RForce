import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getIds() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const volunteerUser = users.find(u => u.email === 'volunteer@example.com');

    if (!volunteerUser) {
        console.error("Volunteer not found");
        return;
    }

    const { data: volunteer } = await supabase.from('volunteers').select('id').eq('user_id', volunteerUser.id).single();

    const { data: tasks } = await supabase.from('tasks').select('id').eq('status', 'open').limit(1);

    console.log(JSON.stringify({
        volunteer_id: volunteer.id,
        task_id: tasks[0]?.id
    }));
}

getIds();
