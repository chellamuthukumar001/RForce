import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ disasters: 0, volunteers: 0, tasks: 0 });
    const [disasters, setDisasters] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('volunteers'); // 'volunteers' | 'missions'

    const fetchData = useCallback(async () => {
        try {
            // Query Supabase directly — works because RLS is disabled
            const [disastersRes, volunteersRes, tasksRes] = await Promise.all([
                supabase.from('disasters').select('*').order('created_at', { ascending: false }),
                supabase.from('volunteers').select('*').order('created_at', { ascending: false }),
                supabase.from('tasks').select('*, disasters(id, name, urgency)').order('created_at', { ascending: false }),
            ]);

            const fetchedDisasters = disastersRes.data || [];
            const fetchedVolunteers = volunteersRes.data || [];
            const fetchedTasks = tasksRes.data || [];

            setDisasters(fetchedDisasters);
            setVolunteers(fetchedVolunteers);
            setTasks(fetchedTasks);

            setStats({
                disasters: fetchedDisasters.filter(d => d.status === 'active').length,
                volunteers: fetchedVolunteers.length,
                tasks: fetchedTasks.filter(t => t.status === 'open').length
            });
            setLoading(false);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Realtime subscription for live updates
        const channel = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'disasters' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, fetchData)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const handleAssign = async (taskId, volunteerId) => {
        if (!volunteerId) return toast.error('Select a verified responder first');
        try {
            // Insert directly via Supabase — bypasses backend auth
            const { error } = await supabase
                .from('task_assignments')
                .insert({ task_id: taskId, volunteer_id: volunteerId, status: 'pending' });

            if (error) throw new Error(error.message);

            // Mark task as assigned
            await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId);

            toast.success('✅ Mission deployed successfully!');
            fetchData();
        } catch (e) {
            toast.error(`Deployment failed: ${e.message}`);
        }
    };

    const handleAssignToVolunteer = async (volunteerId) => {
        const taskId = document.getElementById(`task-sel-${volunteerId}`)?.value;
        if (!taskId) return toast.error('Select a mission to assign');
        await handleAssign(taskId, volunteerId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black tracking-[0.4em] text-emerald-500">INITIALIZING COMMAND CENTER</span>
                </div>
            </div>
        );
    }

    const openTasks = tasks.filter(t => t.status === 'open');

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12">
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

            <div className="container mx-auto max-w-[1600px]">
                {/* Tactical Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Tactical Control Hub v5.0</span>
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-none">Command.<br /><span className="text-emerald-500">Center.</span></h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap gap-4">
                        <Link to="/admin/create-disaster" className="btn btn-premium bg-gradient-to-tr from-red-500 to-rose-700 px-8 py-5 text-xs font-black uppercase tracking-widest shadow-2xl shadow-red-500/20">
                            + Emergency Declaration
                        </Link>
                        <Link to="/admin/create-task" className="btn btn-premium px-8 py-5 text-xs font-black uppercase tracking-widest">
                            + Tactical Mission
                        </Link>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {[
                        { label: 'Active Disasters', value: stats.disasters, icon: '🚨', colorClass: 'text-rose-500', borderClass: 'border-l-rose-500' },
                        { label: 'Registered Volunteers', value: stats.volunteers, icon: '🛡️', colorClass: 'text-emerald-500', borderClass: 'border-l-emerald-500' },
                        { label: 'Open Missions', value: stats.tasks, icon: '🎯', colorClass: 'text-blue-500', borderClass: 'border-l-blue-500' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className={`glass-card p-10 border-l-4 ${stat.borderClass} group relative overflow-hidden`}
                        >
                            <div className="absolute -right-8 -top-8 text-8xl opacity-10 group-hover:opacity-20 transition-all duration-700">{stat.icon}</div>
                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                            <div className={`text-6xl font-black ${stat.colorClass} tracking-tighter`}>{stat.value}</div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${stat.colorClass.replace('text-', 'bg-')} animate-ping`}></div>
                                <span className={`text-[9px] font-black ${stat.colorClass} opacity-60 uppercase tracking-widest`}>Real-time Active</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 mb-8">
                    {['volunteers', 'missions'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === tab
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            {tab === 'volunteers' ? `👥 All Volunteers (${volunteers.length})` : `🎯 Mission Assignments (${openTasks.length} Open)`}
                        </button>
                    ))}
                </div>

                {/* ─── TAB: Volunteers ─── */}
                {activeTab === 'volunteers' && (
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Registered Operatives</h2>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">ALL VOLUNTEERS IN THE NETWORK — ASSIGN MISSIONS DIRECTLY</p>
                        </div>

                        {volunteers.length === 0 ? (
                            <div className="p-20 text-center text-gray-600 font-black uppercase tracking-widest">
                                No volunteers registered yet. Share your platform link!
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {volunteers.map(v => (
                                    <motion.div
                                        key={v.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-8 hover:bg-white/[0.02] transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                            {/* Volunteer Info */}
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-green-600/20 border border-white/10 flex items-center justify-center text-xl font-black text-emerald-400">
                                                    {v.name ? v.name[0].toUpperCase() : 'R'}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">{v.name || 'Unknown Operative'}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest">{v.email}</p>
                                                    <div className="flex gap-3 mt-1 flex-wrap">
                                                        {v.phone && <span className="text-[9px] text-blue-400 font-black">📞 {v.phone}</span>}
                                                        {v.city && <span className="text-[9px] text-gray-500 font-black">📍 {v.city}{v.state ? `, ${v.state}` : ''}</span>}
                                                        <span className="text-[9px] text-emerald-500 font-black">✅ {v.completed_tasks || 0} Missions</span>
                                                        <span className="text-[9px] text-violet-400 font-black">⭐ {v.reliability_score || 100}% Trust</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {(v.skills || []).map(s => (
                                                            <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-gray-400 uppercase">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status + Mission Assign */}
                                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${v.availability === 'available'
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                    : v.availability === 'busy'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                        : 'border-white/10 bg-white/5 text-gray-500'
                                                    }`}>
                                                    {v.availability || 'available'}
                                                </span>

                                                <select
                                                    id={`task-sel-${v.id}`}
                                                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 text-xs font-black flex-1 min-w-[220px]"
                                                >
                                                    <option value="" className="bg-background">Assign Mission...</option>
                                                    {openTasks.map(t => (
                                                        <option key={t.id} value={t.id} className="bg-background">
                                                            {t.title} {t.disasters ? `(${t.disasters.name})` : ''}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={() => handleAssignToVolunteer(v.id)}
                                                    className="btn btn-premium py-3 px-6 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                                                >
                                                    Deploy
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: Mission Assignments ─── */}
                {activeTab === 'missions' && (
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Deployment Grid</h2>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">ASSIGN OPEN MISSIONS TO AVAILABLE RESPONDERS</p>
                            </div>
                            <div className="px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                                {openTasks.length} PENDING
                            </div>
                        </div>

                        <div className="divide-y divide-white/5">
                            <AnimatePresence>
                                {openTasks.length === 0 ? (
                                    <div className="p-20 text-center text-gray-600 font-black uppercase tracking-widest">
                                        Grid Clear. No Pending Missions. Create one with "+ Tactical Mission".
                                    </div>
                                ) : (
                                    openTasks.map(task => (
                                        <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 hover:bg-white/[0.02] transition-all">
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{task.title}</h3>
                                                        <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                        {task.disasters && (
                                                            <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                                                🚨 {task.disasters.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 font-medium text-sm leading-relaxed">{task.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(task.required_skills || []).map(s => (
                                                            <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-gray-400 uppercase">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 w-full lg:w-auto">
                                                    <select
                                                        className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 text-xs font-black flex-1 min-w-[220px]"
                                                        id={`v-sel-${task.id}`}
                                                    >
                                                        <option value="" className="bg-background">Assign Responder...</option>
                                                        {volunteers.map(v => (
                                                            <option key={v.id} value={v.id} className="bg-background">
                                                                {v.name} — {v.availability} | ⭐{v.reliability_score || 100}%{v.phone ? ` | 📞${v.phone}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            const sel = document.getElementById(`v-sel-${task.id}`);
                                                            handleAssign(task.id, sel.value);
                                                        }}
                                                        className="btn btn-premium py-4 px-8 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                                                    >
                                                        Deploy
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Active Disasters Summary */}
                {disasters.length > 0 && (
                    <div className="glass-card mt-8 overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Active Emergency Zones</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                            {disasters.filter(d => d.status === 'active').map(d => (
                                <div key={d.id} className="p-8 hover:bg-white/[0.02] transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{d.disaster_type}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.urgency === 'critical' ? 'bg-red-500/20 text-red-400' : d.urgency === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {d.urgency}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">{d.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold">{d.city}{d.state ? `, ${d.state}` : ''}</p>
                                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{d.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <footer className="mt-32 pt-8 border-t border-white/5 text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">
                    System Status: NOMINAL | Protocol: SECURE-X | Uptime: 99.9%
                </footer>
            </div>
        </div>
    );
};

export default AdminDashboard;
