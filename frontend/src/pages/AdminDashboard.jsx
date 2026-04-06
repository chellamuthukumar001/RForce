import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { disasterAPI, volunteerAPI, taskAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import useRealtime from '../hooks/useRealtime';
import { supabase } from '../services/supabase';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ disasters: 0, volunteers: 0, tasks: 0 });
    const [disasters, setDisasters] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentSuccess, setAssignmentSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [disastersRes, volunteersRes, tasksRes] = await Promise.all([
                disasterAPI.getAll().catch(() => ({ data: { disasters: [] } })),
                volunteerAPI.getAll().catch(() => ({ data: { volunteers: [] } })),
                taskAPI.getAll().catch(() => ({ data: { tasks: [] } }))
            ]);

            const fetchedDisasters = disastersRes.data?.disasters || [];
            const fetchedVolunteers = volunteersRes.data?.volunteers || [];
            const fetchedTasks = tasksRes.data?.tasks || [];

            setDisasters(fetchedDisasters);
            setVolunteers(fetchedVolunteers);
            setTasks(fetchedTasks);

            setStats({
                disasters: fetchedDisasters.filter(d => d.status === 'active').length,
                volunteers: fetchedVolunteers.filter(v => v.availability === 'available').length,
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
    }, []);

    useRealtime(fetchData, ['disasters', 'volunteers', 'tasks', 'task_assignments', 'updates']);

    const handleAssign = async (taskId, volunteerId) => {
        if (!volunteerId) return toast.error('Select a verified responder');
        try {
            await taskAPI.assign(taskId, [volunteerId]);
            setAssignmentSuccess(taskId);
            toast.success('Mission Deployed Successfully');
            setTimeout(() => setAssignmentSuccess(null), 600);
            fetchData();
        } catch (e) {
            toast.error('Deployment Override Failed');
        }
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

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12">
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

            <div className="container mx-auto max-w-[1600px]">
                {/* Tactical Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Tactical Control Hub v4.0</span>
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

                {/* Grid Overlay Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-2">
                    {[
                        { label: 'Active Disasters', value: stats.disasters, color: 'rose', icon: '🚨', theme: 'border-l-rose-500 text-rose-500 bg-rose-500 text-rose-500/60' },
                        { label: 'Verified Responders', value: stats.volunteers, color: 'emerald', icon: '🛡️', theme: 'border-l-emerald-500 text-emerald-500 bg-emerald-500 text-emerald-500/60' },
                        { label: 'Unassigned Missions', value: stats.tasks, color: 'blue', icon: '🎯', theme: 'border-l-blue-500 text-blue-500 bg-blue-500 text-blue-500/60' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className={`glass-card p-10 ${stat.theme.split(' ')[0]} group relative overflow-hidden`}
                        >
                            <div className="absolute -right-8 -top-8 text-8xl opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700 select-none">{stat.icon}</div>
                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                            <div className={`text-6xl font-black ${stat.theme.split(' ')[1]} tracking-tighter`}>{stat.value}</div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${stat.theme.split(' ')[2]} animate-ping`}></div>
                                <span className={`text-[9px] font-black ${stat.theme.split(' ')[3]} uppercase tracking-widest`}>Real-time Active</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mission Control: Pending Assignments */}
                <div className="glass-card mb-16 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Deployment Grid</h2>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest">AWAITING COMMANDERS INITIALIZATION</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                            {tasks.filter(t => t.status === 'open').length} PENDING UNASSIGNED
                        </div>
                    </div>

                    <div className="divide-y divide-white/5">
                        <AnimatePresence>
                            {tasks.filter(t => t.status === 'open').length === 0 ? (
                                <div className="p-20 text-center text-gray-600 font-black uppercase tracking-widest">Grid Clear. No Pending Maneuvers.</div>
                            ) : (
                                tasks.filter(t => t.status === 'open').map(task => (
                                    <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 hover:bg-white/[0.02] transition-all">
                                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{task.title}</h3>
                                                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                                        {task.priority || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 font-medium text-lg leading-relaxed">{task.description}</p>
                                                {task.disasters && (
                                                    <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                        Zone: {task.disasters.name}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                                <select
                                                    className="bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 text-xs font-black uppercase tracking-widest flex-1 min-w-[250px]"
                                                    id={`v-sel-${task.id}`}
                                                >
                                                    <option value="" className="bg-background">Assign Responder...</option>
                                                    {volunteers.filter(v => v.availability === 'available').map(v => (
                                                        <option key={v.id} value={v.id} className="bg-background">
                                                            {v.name} - Reliability: {v.reliability_score}% {v.phone ? `(${v.phone})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const sel = document.getElementById(`v-sel-${task.id}`);
                                                        handleAssign(task.id, sel.value);
                                                    }}
                                                    className="btn btn-premium py-4 px-10 text-[10px] font-black uppercase tracking-widest"
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

                {/* Multi-Column Intelligence View */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Log of Operations */}
                    <div className="glass-card">
                        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Recent Operations</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Mission</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Responder</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {tasks.slice(0, 10).map((t, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">{t.title}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t.disasters?.name || 'Global HQ'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${t.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' :
                                                    t.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 bg-white/5'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">R</div>
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Unit-Validated</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Global Force Readiness */}
                    <div className="glass-card">
                        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Global Force Readiness</h3>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {volunteers.map((v, i) => (
                                <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xl font-black text-white">
                                            {v.name ? v.name[0] : 'R'}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-white uppercase tracking-tighter">{v.name}</h4>
                                            <div className="flex gap-4">
                                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Impact: {v.completed_tasks || 0} Missions</p>
                                                {v.phone && <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Comm: {v.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${v.availability === 'available' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-white/5 text-gray-500'
                                            }`}>
                                            {v.availability}
                                        </div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">{v.city || 'GLOBAL'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Operability Status */}
            <footer className="mt-32 pt-8 border-t border-white/5 text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">
                System Status: NOMINAL | Protocol: SECURE-X | Uptime: 99.9%
            </footer>
        </div>
    );
};

export default AdminDashboard;
