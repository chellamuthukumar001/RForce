import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, disasterAPI, aiAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/MapView';

const SKILLS_OPTIONS = [
    'Medical Aid', 'First Aid', 'Search and Rescue', 'Emergency Response', 
    'Food Distribution', 'Shelter Management', 'Logistics', 'Physical Labor', 
    'Child Care', 'Psychological Support', 'Translation', 'Community Outreach'
];

const CreateTask = () => {
    const navigate = useNavigate();
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rankedVolunteers, setRankedVolunteers] = useState([]);
    const [showAIResults, setShowAIResults] = useState(false);

    const [formData, setFormData] = useState({
        disaster_id: '',
        title: '',
        description: '',
        required_skills: [],
        priority: 'medium',
        location_mode: 'disaster'
    });

    const [customLocation, setCustomLocation] = useState({
        lat: null,
        lng: null,
        address: ''
    });

    useEffect(() => {
        fetchDisasters();
    }, []);

    const fetchDisasters = async () => {
        try {
            const res = await disasterAPI.getAll('active');
            setDisasters(res.data.disasters || []);
        } catch (err) {
            console.error('Failed to load active relief sectors');
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

    const handleGetAISuggestions = async () => {
        if (!formData.disaster_id) return alert('Select Active Sector First');
        setLoading(true);
        try {
            const taskData = { ...formData };
            if (formData.location_mode === 'custom' && customLocation.lat && customLocation.lng) {
                taskData.latitude = customLocation.lat;
                taskData.longitude = customLocation.lng;
            }
            const taskRes = await taskAPI.create(taskData);
            const taskId = taskRes.data.task.id;
            const aiRes = await aiAPI.rankVolunteers(taskId, 5);
            setRankedVolunteers(aiRes.data.ranked_volunteers || []);
            setShowAIResults(true);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.error || 'AI Node Synchronization Failed');
            setLoading(false);
        }
    };

    const handleAutoAssign = async () => {
        if (rankedVolunteers.length === 0) return;
        const taskId = rankedVolunteers[0]?.task_id;
        setLoading(true);
        try {
            const vIds = rankedVolunteers.slice(0, 3).map(v => v.volunteer_id);
            await taskAPI.assign(taskId, vIds);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Mass Assignment Protocol Failed');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const taskData = { ...formData };
            if (formData.location_mode === 'custom' && customLocation.lat && customLocation.lng) {
                taskData.latitude = customLocation.lat;
                taskData.longitude = customLocation.lng;
            }
            await taskAPI.create(taskData);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Manual Declaration Failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto max-w-[1400px] relative z-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Mission Builder Section */}
                    <div className="flex-1 space-y-8">
                        <div className="mb-12">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 block">Strategic Mission Builder v2.0</span>
                            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Create.<br/>Missions.</h1>
                        </div>

                        <div className="glass-card p-10 space-y-8">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Disaster Sector</label>
                                    <select
                                        value={formData.disaster_id}
                                        onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-black text-xs uppercase tracking-[0.2em]"
                                        required
                                    >
                                        <option value="" className="bg-background">Select Operation Group...</option>
                                        {disasters.map(d => (
                                            <option key={d.id} value={d.id} className="bg-background">
                                                {d.name.toUpperCase()} ({d.status.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Location Interface</label>
                                     <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(p => ({...p, location_mode: 'disaster'}))}
                                            className={`py-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${formData.location_mode === 'disaster' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                                        >Sector HQ Location</button>
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(p => ({...p, location_mode: 'custom'}))}
                                            className={`py-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${formData.location_mode === 'custom' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                                        >Custom Field Target</button>
                                     </div>

                                     {formData.location_mode === 'custom' && (
                                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="h-[300px] border border-white/5 rounded-2xl overflow-hidden mt-4">
                                            <MapView 
                                                center={[20, 0]} 
                                                zoom={2} 
                                                onLocationSelect={(l) => setCustomLocation(prev => ({...prev, ...l}))}
                                                selectedLocation={customLocation}
                                            />
                                         </motion.div>
                                     )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Identifier</label>
                                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 text-xs font-bold" placeholder="e.g. MEDICAL SUPPLY AIRDROP" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deployment Brief</label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 text-xs font-medium min-h-[100px]" placeholder="Specific operational requirements..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Required Specializations</label>
                                     <div className="flex flex-wrap gap-2">
                                        {SKILLS_OPTIONS.map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${formData.required_skills.includes(skill)
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                                    }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                     </div>
                                </div>

                                <div className="flex gap-4 pt-10 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={handleGetAISuggestions}
                                        disabled={loading}
                                        className="flex-1 btn btn-premium bg-gradient-to-tr from-violet-600 to-blue-600 py-5 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-violet-500/20"
                                    >
                                        {loading ? 'AI CALIBRATING...' : '✨ Run AI Simulation'}
                                    </button>
                                    <button type="submit" className="px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest">Manual Create</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* AI Simulation Panel */}
                    <div className="lg:w-[450px]">
                        <AnimatePresence mode="wait">
                            {!showAIResults ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-12 glass-card border-dashed">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-6 flex items-center justify-center text-2xl animate-pulse">🤖</div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">AI Analysis Off-Line</h3>
                                    <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-widest">Awaiting mission parameters for volunteer synchronization simulation.</p>
                                </motion.div>
                            ) : (
                                <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div className="glass-card bg-violet-500/[0.03] border-violet-500/30">
                                        <div className="p-8 border-b border-white/5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-xl">✨</div>
                                            <div>
                                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">AI Top Match Units</h3>
                                                <p className="text-[10px] text-violet-400 font-black tracking-widest uppercase">Simulation Results Active</p>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {rankedVolunteers.map((v, i) => (
                                                <motion.div key={v.volunteer_id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 transition-all relative overflow-hidden">
                                                     <div className="absolute top-0 right-0 p-4 text-3xl font-black text-white/5 group-hover:text-violet-500/10 transition-colors">#{i+1}</div>
                                                     <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-white font-black uppercase tracking-tight text-lg">{v.volunteer_name}</h4>
                                                            <p className="text-[9px] text-gray-500 font-bold mb-3 uppercase tracking-widest">{v.volunteer_email}</p>
                                                            <div className="flex gap-2">
                                                                <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Dist: {v.distance}km</span>
                                                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Skill: {v.scores.skill.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-3xl font-black text-violet-500 tracking-tighter">{Math.round(v.scores.final * 100)}%</div>
                                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Match Prob.</span>
                                                        </div>
                                                     </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="p-6 pt-0">
                                            <button
                                                onClick={handleAutoAssign}
                                                disabled={loading}
                                                className="w-full btn btn-premium bg-gradient-to-tr from-emerald-600 to-green-800 py-6 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20"
                                            >
                                                Deploy Identified Units
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateTask;
