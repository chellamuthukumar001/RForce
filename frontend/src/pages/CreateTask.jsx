import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const SKILLS_OPTIONS = [
    'Medical Aid', 'First Aid', 'Search and Rescue', 'Emergency Response',
    'Food Distribution', 'Shelter Management', 'Logistics', 'Physical Labor',
    'Child Care', 'Psychological Support', 'Translation', 'Community Outreach'
];

const CreateTask = () => {
    const navigate = useNavigate();
    const [disasters, setDisasters] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [createdTask, setCreatedTask] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    const [formData, setFormData] = useState({
        disaster_id: '',
        title: '',
        description: '',
        required_skills: [],
        priority: 'medium',
    });

    useEffect(() => {
        fetchDisasters();
        fetchVolunteers();
    }, []);

    const fetchDisasters = async () => {
        try {
            const { data } = await supabase
                .from('disasters')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            setDisasters(data || []);
        } catch (err) {
            console.error('Failed to load disasters:', err);
        }
    };

    const fetchVolunteers = async () => {
        try {
            // Fetch directly from Supabase (RLS disabled)
            const { data } = await supabase
                .from('volunteers')
                .select('*')
                .order('name');
            setVolunteers(data || []);
        } catch (err) {
            console.error('Failed to load volunteers:', err);
        }
    };

    const handleSkillToggle = (skill) => {
        setFormData(prev => ({
            ...prev,
            required_skills: prev.required_skills.includes(skill)
                ? prev.required_skills.filter(s => s !== skill)
                : [...prev.required_skills, skill]
        }));
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!formData.disaster_id) return setError('Select an emergency sector first');
        if (!formData.title.trim()) return setError('Mission identifier is required');
        setLoading(true);
        try {
            // Insert task directly via Supabase (bypasses backend auth)
            const { data: task, error } = await supabase
                .from('tasks')
                .insert({
                    disaster_id: formData.disaster_id,
                    title: formData.title,
                    description: formData.description,
                    required_skills: formData.required_skills,
                    priority: formData.priority,
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            setCreatedTask(task);
            setSuccess(`✅ Mission "${task.title}" created! Now assign it to a volunteer below.`);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to create mission.');
            setLoading(false);
        }
    };

    const handleAssignTask = async () => {
        if (!createdTask) return setError('Create a task first');
        if (!selectedVolunteer) return setError('Select a volunteer to assign to');
        setAssignLoading(true);
        setError('');
        try {
            // Insert assignment directly via Supabase (bypasses backend auth)
            const { error } = await supabase
                .from('task_assignments')
                .insert({
                    task_id: createdTask.id,
                    volunteer_id: selectedVolunteer,
                    status: 'pending'
                });

            if (error) throw new Error(error.message);

            // Update task status to 'assigned'
            await supabase
                .from('tasks')
                .update({ status: 'assigned' })
                .eq('id', createdTask.id);

            setSuccess(`🚀 Mission deployed to operative successfully!`);
            setAssignLoading(false);
            setTimeout(() => navigate('/admin/dashboard'), 1500);
        } catch (err) {
            setError(err.message || 'Assignment failed');
            setAssignLoading(false);
        }
    };

    const handleCreateAndDone = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!formData.disaster_id) return setError('Select an emergency sector first');
        if (!formData.title.trim()) return setError('Mission identifier is required');
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    disaster_id: formData.disaster_id,
                    title: formData.title,
                    description: formData.description,
                    required_skills: formData.required_skills,
                    priority: formData.priority,
                    status: 'open'
                });
            if (error) throw new Error(error.message);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to create mission');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto max-w-5xl relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 block">Strategic Mission Builder</span>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Create &<br /><span className="text-blue-500">Assign Mission.</span></h1>
                </div>

                {/* Alert Box */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 1: Create Task */}
                <div className="glass-card p-10 mb-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg">01</div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-widest text-lg">Define Mission Parameters</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Required fields to initialize the tactical operation</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateTask} className="space-y-8">
                        {/* Disaster Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Emergency Sector *</label>
                            <select
                                value={formData.disaster_id}
                                onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 font-black text-xs uppercase tracking-wider"
                                required
                            >
                                <option value="" className="bg-background">Select Active Emergency Zone...</option>
                                {disasters.map(d => (
                                    <option key={d.id} value={d.id} className="bg-background">
                                        🚨 {d.name} — {d.urgency?.toUpperCase()} | {d.city || 'Unknown location'}
                                    </option>
                                ))}
                            </select>
                            {disasters.length === 0 && (
                                <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">⚠ No active emergencies found. Create one via "+ Emergency Declaration" first.</p>
                            )}
                        </div>

                        {/* Title + Priority */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Identifier *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 text-sm font-bold"
                                    placeholder="e.g. Medical Supply Distribution"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Priority Level</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 font-black text-xs uppercase"
                                >
                                    <option value="low" className="bg-background">Low</option>
                                    <option value="medium" className="bg-background">Medium</option>
                                    <option value="high" className="bg-background">High</option>
                                    <option value="critical" className="bg-background">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deployment Brief</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 text-sm font-medium min-h-[100px] resize-none"
                                placeholder="Describe the mission objectives, location details, and any special requirements..."
                            />
                        </div>

                        {/* Skills */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Required Specializations</label>
                            <div className="flex flex-wrap gap-2">
                                {SKILLS_OPTIONS.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${formData.required_skills.includes(skill)
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn btn-premium bg-gradient-to-tr from-blue-600 to-indigo-700 py-5 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20"
                            >
                                {loading ? 'Creating Mission...' : '⚡ Create Mission (Then Assign Below)'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateAndDone}
                                disabled={loading}
                                className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest transition-all"
                            >
                                Create Only
                            </button>
                        </div>
                    </form>
                </div>

                {/* STEP 2: Assign to Volunteer */}
                <div className={`glass-card p-10 transition-all duration-500 ${!createdTask ? 'opacity-50 pointer-events-none' : 'opacity-100 border-emerald-500/20'}`}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border ${createdTask ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-600'}`}>02</div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-widest text-lg">
                                {createdTask ? `Assign: "${createdTask.title}"` : 'Assign to Volunteer'}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                {createdTask ? 'Select a volunteer and deploy the mission' : 'Create the mission first to unlock assignment'}
                            </p>
                        </div>
                    </div>

                    {/* Volunteer Selection */}
                    {volunteers.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 font-black uppercase tracking-widest text-xs bg-white/[0.02] rounded-2xl">
                            No volunteers registered yet. Share your app link for volunteers to sign up.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Simple Dropdown */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Operative *</label>
                                <select
                                    value={selectedVolunteer}
                                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 font-black text-xs uppercase"
                                >
                                    <option value="" className="bg-background">Choose volunteer...</option>
                                    {volunteers.map(v => (
                                        <option key={v.id} value={v.id} className="bg-background">
                                            {v.name} — {v.availability || 'available'} | ⭐{v.reliability_score || 100}% | 📍{v.city || 'Unknown'}{v.phone ? ` | 📞${v.phone}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Visual Volunteer Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                                {volunteers.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVolunteer(v.id)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all hover:bg-white/5 ${selectedVolunteer === v.id
                                            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                            : 'border-white/5 bg-white/[0.02]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                                                {v.name ? v.name[0].toUpperCase() : 'R'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{v.name}</h4>
                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                    <span className={`text-[9px] font-black uppercase ${v.availability === 'available' ? 'text-emerald-400' : v.availability === 'busy' ? 'text-amber-400' : 'text-gray-500'}`}>
                                                        ● {v.availability || 'available'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 font-bold">📍 {v.city || 'Any'}</span>
                                                    <span className="text-[9px] text-violet-400 font-bold">⭐ {v.reliability_score || 100}%</span>
                                                </div>
                                                {v.phone && <p className="text-[9px] text-blue-400 font-black mt-0.5">📞 {v.phone}</p>}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(v.skills || []).slice(0, 3).map(s => (
                                                        <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] font-black text-gray-500 uppercase">{s}</span>
                                                    ))}
                                                    {(v.skills || []).length > 3 && <span className="text-[7px] text-gray-600 font-black">+{v.skills.length - 3}</span>}
                                                </div>
                                            </div>
                                            {selectedVolunteer === v.id && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <button
                                    onClick={handleAssignTask}
                                    disabled={assignLoading || !selectedVolunteer || !createdTask}
                                    className="flex-1 btn btn-premium bg-gradient-to-tr from-emerald-600 to-green-800 py-5 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {assignLoading ? 'Deploying...' : '🚀 Deploy Mission to Selected Operative'}
                                </button>
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest transition-all"
                                >
                                    Skip → Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CreateTask;
