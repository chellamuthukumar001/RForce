import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { disasterAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/MapView';

const CreateDisaster = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPos, setSelectedPos] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        disaster_type: '',
        description: '',
        urgency: 'medium',
        city: '',
        state: '',
        country: '',
        status: 'active',
        latitude: null,
        longitude: null
    });

    const handleLocationSelect = (pos) => {
        setSelectedPos(pos);
        setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await disasterAPI.create(formData);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Operational failure: Strategic declare override failed.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-32 px-6 lg:px-12 flex items-center justify-center relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 rounded-full blur-[120px] animate-pulse-slow delay-700"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl w-full relative z-10"
            >
                <div className="glass-card p-0 overflow-hidden border-rose-500/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Map or Tactical Preview */}
                        <div className="h-[400px] lg:h-auto relative bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5">
                            <div className="absolute inset-0 z-0">
                                <MapView 
                                    center={[20, 0]} 
                                    zoom={2} 
                                    onLocationSelect={handleLocationSelect}
                                    selectedLocation={selectedPos}
                                />
                            </div>
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent"></div>
                            <div className="absolute top-6 left-6 p-4 glass-card bg-black/60 border-rose-500/30 backdrop-blur-md">
                                <h3 className="text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Coordinate Acquisition</h3>
                                <p className="text-white text-xs font-bold uppercase tracking-widest">
                                    {selectedPos ? `${selectedPos.lat.toFixed(4)}N / ${selectedPos.lng.toFixed(4)}W` : 'SELECT IMPACT ZONE ON GRID'}
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-10 lg:p-16">
                            <div className="mb-10">
                                <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-[0.4em] border border-rose-500/20 mb-4 inline-block">Tactical Emergency Declaration</span>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Declare.<br/>Relief.</h1>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Relief Codename</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-rose-500/50 transition-all font-medium"
                                            placeholder="e.g. OPERATION TITAN"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Relief Type</label>
                                        <select
                                            value={formData.disaster_type}
                                            onChange={(e) => setFormData({ ...formData, disaster_type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-rose-500/50 transition-all font-black text-xs uppercase tracking-widest"
                                            required
                                        >
                                            <option value="" className="bg-background">Select Sector...</option>
                                            {['Flood', 'Earthquake', 'Fire', 'Hurricane', 'Tornado', 'Tsunami', 'Pandemic', 'Humanitarian'].map(opt => (
                                                <option key={opt} value={opt} className="bg-background">{opt.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Strategic Overview</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-rose-500/50 transition-all font-medium min-h-[120px]"
                                        placeholder="Intelligence brief on current anomalies..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Urgency Protocol</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['low', 'medium', 'high', 'critical'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, urgency: level })}
                                                className={`py-3 rounded-xl border-2 transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${formData.urgency === level
                                                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                    : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">City Node</label>
                                        <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white outline-none focus:border-rose-500/50 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">State Sector</label>
                                        <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white outline-none focus:border-rose-500/50 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Global Region</label>
                                        <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white outline-none focus:border-rose-500/50 text-xs font-bold" />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 btn btn-premium bg-gradient-to-tr from-rose-600 to-red-800 py-6 text-xs font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20"
                                    >
                                        {loading ? 'Initializing Declaration...' : 'Broadcast Emergency'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/dashboard')}
                                        className="px-10 py-6 rounded-2xl bg-white/5 border border-white/5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-white/10"
                                    >
                                        Abort
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateDisaster;
