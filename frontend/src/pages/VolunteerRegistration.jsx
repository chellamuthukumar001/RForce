import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { volunteerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const SKILLS_OPTIONS = [
    'Medical Aid', 'First Aid', 'Search and Rescue', 'Emergency Response', 
    'Food Distribution', 'Shelter Management', 'Logistics', 'Physical Labor', 
    'Child Care', 'Psychological Support', 'Translation', 'Community Outreach'
];

const VolunteerRegistration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        skills: [],
        availability: 'available',
        city: '',
        state: '',
        country: ''
    });

    const handleSkillToggle = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.skills.length === 0) return setError('Select At Least One Tactical Specialization');
        setLoading(true);
        try {
            await volunteerAPI.createProfile(formData);
            navigate('/volunteer/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration Interface Failure');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12 flex items-center justify-center relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full relative z-10">
                <div className="glass-card p-0 overflow-hidden">
                    <div className="bg-emerald-500/10 border-b border-white/5 p-12 text-center relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block">Responders Network Access</span>
                         <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Initialize.<br/>operative.</h1>
                         <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-6">Secure encryption enabled for profile synchronization.</p>
                    </div>

                    <div className="p-10 lg:p-16">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-12">
                            {/* Personal Details */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-lg">01</div>
                                     <h2 className="text-white font-black uppercase tracking-widest">Personal Identification</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Operative Name</label>
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 text-xs font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Secure Email Uplink</label>
                                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 text-xs font-bold" required />
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-lg">02</div>
                                     <h2 className="text-white font-black uppercase tracking-widest">Tactical Specializations</h2>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {SKILLS_OPTIONS.map(skill => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => handleSkillToggle(skill)}
                                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.skills.includes(skill)
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Finalize */}
                            <div className="pt-12 border-t border-white/5">
                                 <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn btn-premium bg-gradient-to-tr from-emerald-600 to-green-800 py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/20"
                                >
                                    {loading ? 'SYNCHRONIZING PROFILE...' : 'Establish Network Node'}
                                </button>
                                <button type="button" onClick={() => navigate('/')} className="w-full mt-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-gray-400 transition-colors">Abort Initialization</button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VolunteerRegistration;
