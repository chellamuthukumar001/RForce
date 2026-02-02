
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Trying current directory .env first as we are running from backend root usually
dotenv.config();

// If that failed, try explicit path
if (!process.env.SUPABASE_URL) {
    dotenv.config({ path: path.resolve(__dirname, '.env') });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLogin(email, password) {
    console.log(`Attempting login for ${email} with password '${password}'...`);

    // Test 1: Using supabase.auth.signInWithPassword (client-side simulation)
    // Note: With service role key, this might behave as admin, but let's see if it verifies password.
    // Ideally we should verify with ANON key to simulate real frontend. 
    // But let's try with what we have first, or hardcode anon key if we can find it.

    // Actually, let's just check if the backend route logic works.
    // The backend uses the service role key everywhere.

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login Failed:', error.message);
    } else {
        console.log('✅ Login Successful!');
        console.log('User ID:', data.user.id);

        // Also verify the last_login update logic
        // We can't run the express route here, but we can verify DB access
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);

        if (updateError) console.error('❌ Failed to update last_login:', updateError.message);
        else console.log('✅ last_login updated successfully');
    }
}

// Test with expected credentials
testLogin('volunteer1_test@example.com', 'password1');
