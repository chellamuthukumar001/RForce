import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskAPI, volunteerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import useRealtime from '../hooks/useRealtime';
import toast, { Toaster } from 'react-hot-toast';

const VolunteerDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [volunteer, setVolunteer] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { user, role, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && role === 'admin') {
            navigate('/admin/dashboard');
        }
    }, [role, authLoading, navigate]);

    const fetchData = useCallback(async () => {
        try {
            const [assignmentsRes, volunteerRes] = await Promise.all([
                taskAPI.getMyTasks(),
                volunteerAPI.getMe()
            ]);

            setAssignments(assignmentsRes.data.assignments || []);
            setVolunteer(volunteerRes.data.volunteer);
            setDataLoading(false);
        } catch (err) {
            console.warn("Fetch error:", err);
            // If the profile is missing (404), redirect to registration
            if (err.response?.status === 404) {
                navigate('/volunteer/register');
                return;
            }
            if (dataLoading) setError('Failed to synchronize with Command Center');
            setDataLoading(false);
        }
    }, [dataLoading, navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    useRealtime(fetchData, ['task_assignments', 'tasks', 'updates']);

    const handleUpdateAssignment = async (assignmentId, status) => {
        try {
            await taskAPI.updateAssignment(assignmentId, status);
            toast.success(`Mission status updated to ${status.toUpperCase()}`);
            fetchData();
        } catch (err) {
            toast.error('Protocol override failed. Retry connection.');
        }
    };

    const handleUpdateAvailability = async (availability) => {
        try {
            await volunteerAPI.updateAvailability(availability);
            toast.success(`Operational status set to ${availability.toUpperCase()}`);
            fetchData();
        } catch (err) {
            toast.error('Status synchronization failed.');
        }
    };

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500">SYNCHRONIZING SECURE NODE</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-32 px-6">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

            <div className="container mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tactical Interface v2.4</span>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">OPERATIONS CENTER.</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Tactical Profile Sidebar */}
                    {volunteer && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-1 border border-white/5 bg-white/[0.02] rounded-3xl p-8 h-fit sticky top-32"
                        >
                            <div className="flex flex-col items-center text-center pb-8 border-b border-white/10">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-green-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-emerald-500/20">
                                        {volunteer.name ? volunteer.name[0] : 'R'}
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl border-4 border-background flex items-center justify-center ${volunteer.availability === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        <div className="w-2 h-2 rounded-full bg-white opacity-50 animate-pulse"></div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{volunteer.name}</h2>
                                <p className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{volunteer.email}</p>
                                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                    Sector: {volunteer.city || 'GLOBAL'}, {volunteer.state || 'HQ'}
                                </div>
                            </div>

                            {/* Status Controls */}
                            <div className="py-8 border-b border-white/10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">Deployment Status</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {['available', 'busy', 'offline'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateAvailability(status)}
                                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between group ${volunteer.availability === status
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                : 'bg-transparent border-white/5 text-gray-500 hover:bg-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <span>{status}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${volunteer.availability === status ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-gray-700'}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Nodes */}
                            <div className="pt-8">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Capable Proficiencies</p>
                                <div className="flex flex-wrap gap-2">
                                    {volunteer.skills && volunteer.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1.5 bg-white/5 text-[10px] font-black text-gray-400 rounded-lg border border-white/5 uppercase tracking-wider">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Mission Control Grid */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            <div className="glass-card flex items-center gap-6 p-8">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center scroll-shadow">
                                    <span className="text-4xl font-black text-emerald-500">{volunteer?.completed_tasks || 0}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Validated Strikes</p>
                                    <p className="text-xl font-bold text-white tracking-tight">Completed Missions</p>
                                </div>
                            </div>
                            <div className="glass-card flex items-center gap-6 p-8">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <span className="text-4xl font-black text-blue-500">{volunteer?.reliability_score || 100}%</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Strategic Accuracy</p>
                                    <p className="text-xl font-bold text-white tracking-tight">Trust Integrity Score</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex flex-col">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Live Assignments</h2>
                                <p className="text-xs text-gray-500 font-bold tracking-widest">ENCRYPTED OPERATIONAL DATA</p>
                            </div>
                            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 text-[11px] font-black text-gray-400 uppercase tracking-widest transition-all">
                                {assignments.length} ACTIVE
                            </div>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="glass-card p-24 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
                                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Active Protocols</h3>
                                <p className="text-gray-500 font-medium">Monitoring global data streams for new emergency signatures...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <AnimatePresence mode='popLayout'>
                                    {assignments.map(assignment => {
                                        const urgency = assignment.tasks.disasters.urgency === 'critical' ? 'critical' :
                                            assignment.tasks.disasters.urgency === 'high' ? 'high' : 'medium';

                                        const theme = {
                                            critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'from-red-500/20' },
                                            high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'from-amber-500/20' },
                                            medium: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'from-emerald-500/20' }
                                        }[urgency];

                                        return (
                                            <motion.div
                                                key={assignment.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group relative"
                                            >
                                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${theme.glow} to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-500 lg:blur-sm`}></div>
                                                <div className="relative glass-card p-10 flex flex-col md:flex-row gap-10 items-start md:items-center">

                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] ${theme.bg} ${theme.text} ${theme.border} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}>
                                                                {assignment.tasks.disasters.urgency}
                                                            </span>
                                                            <div className="h-4 w-px bg-white/10"></div>
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                                ID: {assignment.tasks.id.split('-')[0]}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">{assignment.tasks.disasters.name}</p>
                                                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{assignment.tasks.title}</h3>
                                                        </div>

                                                        <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-2xl">{assignment.tasks.description}</p>

                                                        <div className="flex flex-wrap gap-4 items-center">
                                                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                <span className="text-[11px] font-black text-gray-300 uppercase tracking-wider">{assignment.tasks.disasters.city}, {assignment.tasks.disasters.state}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {assignment.tasks.required_skills?.map(s => (
                                                                    <span key={s} className="w-2 h-2 rounded-full border border-white/40 bg-white/10" title={s}></span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-4 min-w-[180px] w-full md:w-auto">
                                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center mb-2">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                                            <p className="text-lg font-black text-white uppercase tracking-tight">{assignment.status}</p>
                                                        </div>

                                                        {assignment.status === 'pending' && (
                                                            <div className="grid gap-3">
                                                                <button
                                                                    onClick={() => handleUpdateAssignment(assignment.id, 'accepted')}
                                                                    className="btn btn-premium w-full py-4 text-xs font-black uppercase tracking-widest"
                                                                >
                                                                    Accept Mission
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateAssignment(assignment.id, 'declined')}
                                                                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest transition-all border border-white/5"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        )}

                                                        {assignment.status === 'accepted' && (
                                                            <button
                                                                onClick={() => handleUpdateAssignment(assignment.id, 'completed')}
                                                                className="btn btn-premium bg-gradient-to-tr from-blue-500 to-indigo-700 w-full py-5 text-xs font-black uppercase tracking-widest"
                                                            >
                                                                Signal Completion
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
