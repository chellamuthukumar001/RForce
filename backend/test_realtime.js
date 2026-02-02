import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("WAITING 5s before assigning...");
    await new Promise(r => setTimeout(r, 5000));

    console.log("Looking up volunteer...");
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const volunteerUser = users.find(u => u.email === 'volunteer@example.com');

    if (!volunteerUser) {
        console.error("Volunteer user not found!");
        process.exit(1);
    }

    const { data: volunteer } = await supabase.from('volunteers').select('id').eq('profile_id', volunteerUser.id).single();
    if (!volunteer) {
        console.error("Volunteer profile not found!");
        process.exit(1);
    }

    console.log("Looking for task...");
    const { data: tasks } = await supabase.from('tasks').select('id').eq('status', 'open').limit(1);
    let taskId;
    if (!tasks || tasks.length === 0) {
        console.log("No open tasks, creating one...");
        const { data: newTask } = await supabase.from('tasks').insert({
            title: 'Realtime Test Task ' + new Date().getTime(),
            description: 'Test description',
            status: 'open',
            priority: 'medium',
            required_skills: ['Driving'],
            disaster_id: 'no_id_needed_if_optional_or_we_need_one'
            // Wait we need a disaster_id usually.
            // Let's pick a disaster too or just hope constraint isn't strict? 
            // It's likely strict.
        }).select().single();

        // We need disaster_id.
        // Let's just pick ANY open task or fail.
        // Or fetch a disaster first.
    } else {
        taskId = tasks[0].id;
    }

    // Safety fallback: fetch disaster if no task
    if (!taskId) {
        const { data: disasters } = await supabase.from('disasters').select('id').limit(1);
        if (!disasters.length) { console.error("No disasters!"); process.exit(1); }

        const { data: newTask } = await supabase.from('tasks').insert({
            title: 'Realtime Test Task ' + new Date().getTime(),
            description: 'Realtime description',
            status: 'open',
            priority: 'medium',
            required_skills: ['Driving'],
            disaster_id: disasters[0].id,
            created_by: volunteerUser.id // hacking created_by
        }).select().single();
        taskId = newTask.id;
    }

    console.log(`Assigning Task ${taskId} to Volunteer ${volunteer.id}...`);
    const { error } = await supabase.from('task_assignments').insert({
        task_id: taskId,
        volunteer_id: volunteer.id,
        status: 'pending'
    });

    if (error) {
        console.error("Assignment failed:", error);
    } else {
        console.log("ASSIGNMENT SUCCESSFUL! Check browser.");
    }
}

run();
