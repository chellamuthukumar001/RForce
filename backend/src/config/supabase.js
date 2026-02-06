import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://klukwoztcbnxzebiixwi.supabase.co';
// Use Service Role Key if available, otherwise fall back to Anon Key (limited permission but prevents crash)
// User provided Anon Key in previous turn
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWt3b3p0Y2JueHplYmlpeHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODQ0NTgsImV4cCI6MjA4NTI2MDQ1OH0.XYoTh0y11fERlxDj4Z44QR7C5ZrCDZla4apRmUBzQT8';

let supabase;

try {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing credentials');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
    console.error('⚠️ Warning: Failed to initialize Supabase client:', error.message);
    // Dummy client to prevent server crash on startup
    supabase = {
        auth: {
            signUp: () => Promise.reject(new Error('Supabase not configured')),
            signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
            signOut: () => Promise.resolve({ error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
            admin: {
                createUser: () => Promise.reject(new Error('Supabase not configured')),
                deleteUser: () => Promise.reject(new Error('Supabase not configured'))
            }
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                    order: () => ({})
                })
            }),
            insert: () => Promise.resolve({ error: new Error('Supabase not configured') }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ error: new Error('Supabase not configured') }) }) }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
        })
    };
}

export default supabase;
