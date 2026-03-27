import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updatesAPI } from '../services/api';
import useRealtime from '../hooks/useRealtime';

const Updates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('timeline');

    const fetchUpdates = useCallback(async () => {
        try {
            const response = await updatesAPI.getAll();
            setUpdates(response.data.updates || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch updates:', err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    useRealtime(fetchUpdates, ['updates', 'disasters']);

    const getFilteredUpdates = () => {
        let filtered = updates;
        if (filter !== 'all') {
            filtered = filtered.filter(u => u.priority === filter);
        }
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-background">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredUpdates = getFilteredUpdates();

    const priorityColors = {
        critical: 'text-red-500 border-red-500/40 bg-red-500/10 shadow-red-500/20',
        high: 'text-amber-500 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20',
        medium: 'text-blue-500 border-blue-500/40 bg-blue-500/10 shadow-blue-500/20',
        low: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20',
        all: 'text-gray-400 border-white/10 bg-white/5 shadow-white/5'
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-6 lg:px-12 relative overflow-hidden">
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-16">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block">Operation Vanguard: Transmission Feed</span>
                    <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">Live.<br/>Comms.</h1>
                    <div className="mt-8 flex gap-3">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                            Secure Uplink Active
                         </div>
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                            {updates.length} Packets Received
                         </div>
                    </div>
                </motion.div>

                {/* Tactical Filters */}
                <div className="mb-12 flex flex-wrap gap-3">
                    {Object.keys(priorityColors).map(p => (
                        <button
                            key={p}
                            onClick={() => setFilter(p)}
                            className={`px-6 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === p ? priorityColors[p] : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Timeline Grid */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredUpdates.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 glass-card text-center border-dashed">
                                <p className="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">No Transmission Data in Selected Frequency</p>
                            </motion.div>
                        ) : (
                            filteredUpdates.map((update, i) => (
                                <motion.div
                                    key={update.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative"
                                >
                                    <div className="glass-card p-0 overflow-hidden hover:border-white/20 transition-all duration-500">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Status Column */}
                                            <div className={`w-full md:w-32 py-6 px-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 ${update.priority === 'critical' ? 'bg-red-500/5' : ''}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${priorityColors[update.priority].split(' ')[0]}`}>{update.priority}</span>
                                                <span className="text-[14px] font-black text-white/50">{formatDate(update.created_at)}</span>
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 p-8">
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{update.title}</h3>
                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black text-gray-500 border border-white/10 uppercase tracking-widest">{update.category}</span>
                                                    {update.disasters && (
                                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-black text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Sector: {update.disasters.name}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 ml-1">
                                                    {update.message}
                                                </p>
                                            </div>

                                            {/* Decorative End */}
                                            <div className="hidden lg:flex items-center px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <div className="w-8 h-px bg-gradient-to-r from-emerald-500 to-transparent"></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Updates;
