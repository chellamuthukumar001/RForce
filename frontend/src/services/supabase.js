import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
        })
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
export default supabase;
