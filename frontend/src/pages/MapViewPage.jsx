import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { volunteerAPI, disasterAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const MapViewPage = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, disasters, volunteers

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [volunteersRes, disastersRes] = await Promise.all([
                volunteerAPI.getAll().catch(() => ({ data: { volunteers: [] } })),
                disasterAPI.getAll().catch(() => ({ data: { disasters: [] } }))
            ]);

            setVolunteers(volunteersRes.data.volunteers || []);
            setDisasters(disastersRes.data.disasters || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load map data');
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (filter === 'disasters') return { volunteers: [], disasters };
        if (filter === 'volunteers') return { volunteers, disasters: [] };
        return { volunteers, disasters };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-emerald-500/10 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-[10px] font-black tracking-widest text-emerald-400">LOADING</span>
                    </div>
                </div>
            </div>
        );
    }

    const filtered = getFilteredData();

    return (
        <div className="min-h-screen bg-background flex flex-col pt-20 overflow-hidden">
            <div className="flex-1 relative">
                {/* Advanced Command Sidebar */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute top-6 left-6 z-[1000] w-full max-w-[320px] pointer-events-none"
                >
                    <div className="glass-card pointer-events-auto p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-black text-white leading-none tracking-tight">MAP COMMAND</h1>
                            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-400">Live Operation Grid</p>
                        </div>

                        {/* Enhanced Operational Status */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Disasters</span>
                                <span className="text-2xl font-black text-red-500">{disasters.length}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">On-Field</span>
                                <span className="text-2xl font-black text-emerald-500">{volunteers.length}</span>
                            </div>
                        </div>

                        {/* Interactive Grid Switcher */}
                        <div className="space-y-2">
                             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Filter Layers</span>
                            <div className="grid gap-2">
                                {[
                                    { id: 'all', label: 'Primary Overlay', count: volunteers.length + disasters.length, color: 'emerald' },
                                    { id: 'disasters', label: 'Disaster Markers', count: disasters.length, color: 'red' },
                                    { id: 'volunteers', label: 'Field Responders', count: volunteers.length, color: 'blue' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setFilter(item.id)}
                                        className={`group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border ${filter === item.id 
                                            ? `bg-${item.color}-500/10 border-${item.color}-500/40 text-${item.color}-300` 
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${filter === item.id ? `bg-${item.color}-400 shadow-[0_0_8px_${item.color}-500]` : 'bg-gray-600'}`}></div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className={`text-xs font-black ${filter === item.id ? 'opacity-100' : 'opacity-40'}`}>{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Real-time Ticker Simulation */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">LIVE EVENT FEED</h3>
                            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {disasters.slice(0, 4).map((d, i) => (
                                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 animate-pulse"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white uppercase leading-none mb-1">{d.name}</p>
                                            <p className="text-[9px] text-gray-500 font-medium">{d.city || 'Undeclared'} - {new Date().toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {disasters.length === 0 && (
                                    <p className="text-[10px] text-gray-600 italic">Standby Mode. Tracking Global Activity...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Map Interface Container */}
                <div className="h-full w-full relative z-0">
                    <MapView
                        center={[37.7749, -122.4194]}
                        zoom={6}
                        volunteers={filtered.volunteers}
                        disasters={filtered.disasters}
                    />
                    
                    {/* Map UI Decorations */}
                    <div className="absolute top-6 right-6 z-[1000] glass-card p-3 flex gap-2">
                         <div className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black tracking-widest border border-white/10">37.7749N / 122.4194W</div>
                         <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-black tracking-widest border border-emerald-500/20 text-emerald-400">GPS STABLE</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapViewPage;
