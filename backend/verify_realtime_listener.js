import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("Listening for Realtime events on task_assignments...");

const channel = supabase
    .channel('public:task_assignments')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_assignments' }, (payload) => {
        console.log('REALTIME EVENT RECEIVED:', payload);
        process.exit(0);
    })
    .subscribe((status) => {
        console.log("Subscription status:", status);
    });

// Timeout after 60s
setTimeout(() => {
    console.log("Timeout waiting for event.");
    process.exit(1);
}, 60000);
