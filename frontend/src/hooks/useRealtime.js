import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Hook to subscribe to Supabase Realtime changes
 * @param {Function} onChange - Callback function to run when data changes
 * @param {Array<string>} tables - List of tables to subscribe to
 * @param {Object} filters - Optional filters (e.g., { event: 'INSERT', filter: 'id=eq.1' })
 */
const useRealtime = (onChange, tables = []) => {
    useEffect(() => {
        const channels = tables.map(table => {
            return supabase
                .channel(`public:${table}`)
                .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
                    // console.log(`Realtime change in ${table}:`, payload);

                    // Show toast for specific events
                    if (table === 'task_assignments' && payload.eventType === 'INSERT') {
                        // We could filter this if we had the user ID context, but for now generic is fine
                        // Ideally we only show this if the assignment is for the current user
                    }
                    if (table === 'updates' && payload.eventType === 'INSERT') {
                        toast.error(`New Alert: ${payload.new.title}`, {
                            icon: '⚠️',
                            duration: 5000
                        });
                    }

                    // Trigger data refresh
                    onChange();
                })
                .subscribe();
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [onChange, tables]);
};

export default useRealtime;
