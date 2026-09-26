import React, { useState, useEffect } from 'react';
import MapView, { MAP_LAYERS } from '../components/MapView';
import ForestLinkModal from '../components/ForestLinkModal';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const FILTER_STYLES = {
    all: {
        label: 'Primary Overlay',
        activeClass: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
    },
    disasters: {
        label: 'Disaster Markers',
        activeClass: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        dotClass: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
    },
    volunteers: {
        label: 'Field Responders',
        activeClass: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
        dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
    }
};

const MapViewPage = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [mapLayer, setMapLayer] = useState('osm');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loraModalOpen, setLoraModalOpen] = useState(false);
    const [loraNodes, setLoraNodes] = useState([
        {
            node_id: 'FOREST_NODE_001',
            latitude: 9.8692558,
            longitude: 77.4222974,
            battery_pct: 85,
            rssi: -78,
            snr: 4.25,
            is_emergency: false
        }
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    // Geocode a city string to lat/lng using free OpenStreetMap Nominatim API
    const geocodeCity = async (city, state, country) => {
        const query = [city, state, country].filter(Boolean).join(', ');
        if (!query) return null;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data[0]) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch (e) {
            /* silent */
        }
        return null;
    };

    const fetchData = async () => {
        try {
            const [volRes, disRes] = await Promise.all([
                supabase.from('volunteers').select('*'),
                supabase.from('disasters').select('*')
            ]);

            const rawVolunteers = volRes.data || [];
            const rawDisasters = disRes.data || [];

            // For volunteers missing lat/lng, geocode from their city
            const enrichedVolunteers = await Promise.all(
                rawVolunteers.map(async (v) => {
                    if (v.latitude && v.longitude && (v.latitude !== 0 || v.longitude !== 0)) {
                        return v;
                    }
                    if (v.city || v.state) {
                        const coords = await geocodeCity(v.city, v.state, v.country);
                        if (coords) return { ...v, latitude: coords.lat, longitude: coords.lng };
                    }
                    return v;
                })
            );

            // For disasters missing lat/lng, geocode from their city
            const enrichedDisasters = await Promise.all(
                rawDisasters.map(async (d) => {
                    if (d.latitude && d.longitude && (d.latitude !== 0 || d.longitude !== 0)) {
                        return d;
                    }
                    if (d.city || d.state) {
                        const coords = await geocodeCity(d.city, d.state, d.country);
                        if (coords) return { ...d, latitude: coords.lat, longitude: coords.lng };
                    }
                    return d;
                })
            );

            setVolunteers(enrichedVolunteers);
            setDisasters(enrichedDisasters);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load map data:', err);
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (filter === 'disasters') return { volunteers: [], disasters };
        if (filter === 'volunteers') return { volunteers, disasters: [] };
        return { volunteers, disasters };
    };

    const handleLoraSignalProcessed = (data) => {
        if (data.lora_data && data.lora_data.gps) {
            const newNode = {
                node_id: data.lora_data.node_id,
                latitude: data.lora_data.gps.latitude,
                longitude: data.lora_data.gps.longitude,
                battery_pct: data.lora_data.node_health?.battery_pct,
                rssi: data.lora_data.rf_metrics?.rssi,
                snr: data.lora_data.rf_metrics?.snr,
                is_emergency: data.lora_data.emergency?.is_emergency
            };
            setLoraNodes(prev => [newNode, ...prev.filter(n => n.node_id !== newNode.node_id)]);
        }

        if (data.ai_dispatch?.disaster) {
            setDisasters(prev => [data.ai_dispatch.disaster, ...prev]);
        }
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
    const activeLayerConfig = MAP_LAYERS[mapLayer] || MAP_LAYERS.osm;

    return (
        <div className="h-screen bg-background flex flex-col pt-20 overflow-hidden">
            <div className="relative flex-1">
                {/* Collapsible Command Sidebar */}
                <div className="absolute top-6 left-6 z-[500] pointer-events-none flex flex-col gap-2">
                    <AnimatePresence>
                        {sidebarOpen ? (
                            <motion.div
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -30, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-[calc(100vw-3rem)] sm:w-[340px] pointer-events-auto"
                            >
                                <div className="glass-card p-5 sm:p-6 flex flex-col gap-5 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                                    {/* Header & Collapse Button */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col gap-1">
                                            <h1 className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">MAP COMMAND</h1>
                                            <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-400">OpenStreetMap Live Operations</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSidebarOpen(false)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            title="Collapse Panel"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Operational Status */}
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

                                    {/* ForestLink LoRa Gateway Button */}
                                    <button
                                        type="button"
                                        onClick={() => setLoraModalOpen(true)}
                                        className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/60 border border-emerald-500/40 text-left hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl">📡</span>
                                            <div>
                                                <span className="text-[11px] font-black uppercase text-emerald-400 block tracking-wider leading-none">
                                                    ForestLink LoRa Gateway
                                                </span>
                                                <span className="text-[9px] text-gray-400">433MHz Mesh & AI Auto-Assign</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>

                                    {/* Map Style / Engine Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Map Engine</span>
                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                OSM Core
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.values(MAP_LAYERS).map((layer) => (
                                                <button
                                                    key={layer.id}
                                                    type="button"
                                                    onClick={() => setMapLayer(layer.id)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border text-[11px] font-bold ${
                                                        mapLayer === layer.id
                                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="text-sm shrink-0">{layer.icon}</span>
                                                    <span className="truncate">{layer.shortName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Layer Filter */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Filter Markers</span>
                                        <div className="grid gap-2">
                                            {[
                                                { id: 'all', count: volunteers.length + disasters.length },
                                                { id: 'disasters', count: disasters.length },
                                                { id: 'volunteers', count: volunteers.length }
                                            ].map((item) => {
                                                const style = FILTER_STYLES[item.id];
                                                const isActive = filter === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setFilter(item.id)}
                                                        className={`group relative flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 border ${
                                                            isActive
                                                                ? style.activeClass
                                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? style.dotClass : 'bg-gray-600'}`}></div>
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{style.label}</span>
                                                        </div>
                                                        <span className={`text-xs font-black ${isActive ? 'opacity-100' : 'opacity-40'}`}>{item.count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Real-time Incident Feed */}
                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LIVE EVENT FEED</h3>
                                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                                        </div>
                                        <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                            {disasters.slice(0, 5).map((d, i) => (
                                                <div key={i} className="flex gap-2.5 items-start p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 animate-pulse shrink-0"></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-bold text-white uppercase leading-tight truncate">{d.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                                            📍 {d.city || 'Sector'}{d.state ? `, ${d.state}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {disasters.length === 0 && (
                                                <p className="text-[10px] text-gray-500 italic py-2">Standby Mode. Tracking Global Activity...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="pointer-events-auto px-4 py-3 rounded-2xl glass-card text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-white flex items-center gap-2 shadow-2xl border border-white/15"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span>COMMAND PANEL</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Map Interface Container */}
                <div className="absolute inset-0 z-0">
                    <MapView
                        center={[11.1271, 78.6569]}
                        zoom={7}
                        volunteers={filtered.volunteers}
                        disasters={filtered.disasters}
                        loraNodes={loraNodes}
                        mapLayer={mapLayer}
                        onMapLayerChange={setMapLayer}
                        showLayerSelector={true}
                        showControls={true}
                    />

                    {/* Map Top Status Pill */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                            OPENSTREETMAP ENGINE: <span className="text-emerald-400">{activeLayerConfig.name.toUpperCase()}</span>
                        </span>
                    </div>
                </div>

                {/* ForestLink LoRa Gateway Modal */}
                <ForestLinkModal
                    isOpen={loraModalOpen}
                    onClose={() => setLoraModalOpen(false)}
                    onSignalProcessed={handleLoraSignalProcessed}
                />
            </div>
        </div>
    );
};

export default MapViewPage;
