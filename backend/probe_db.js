import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Specify the path to the backend .env
dotenv.config({ path: path.resolve('backend/.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    console.log('--- Database Column Probe ---');
    const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching from volunteers:', error.message);
        if (error.hint) console.log('Hint:', error.hint);
        if (error.details) console.log('Details:', error.details);
    } else {
        console.log('✅ Success! Found columns:');
        Object.keys(data[0] || {}).forEach(k => console.log(' -', k));
    }
}

checkColumns();
