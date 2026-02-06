import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://klukwoztcbnxzebiixwi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWt3b3p0Y2JueHplYmlpeHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODQ0NTgsImV4cCI6MjA4NTI2MDQ1OH0.XYoTh0y11fERlxDj4Z44QR7C5ZrCDZla4apRmUBzQT8';

// SAFETY CHECK: Prevent white screen crash if keys are missing
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 CRTICAL ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing!');
    console.error('Please add them to your .env file or Vercel Environment Variables.');

    // Return a dummy client that doesn't crash immediate imports but logs errors on use
    supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Missing Supabase Keys') }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signUp: () => Promise.reject(new Error('Missing Supabase Keys')),
            signInWithPassword: () => Promise.reject(new Error('Missing Supabase Keys')),
            signOut: () => Promise.resolve({ error: null }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Missing Supabase Keys') }),
                    order: () => ({})
                })
            })
        }),
        channel: () => ({
            on: () => ({ subscribe: () => { } }),
            subscribe: () => { }
        }),
        removeChannel: () => { }
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
export default supabase;
