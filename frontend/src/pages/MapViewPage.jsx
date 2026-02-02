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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const filtered = getFilteredData();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 relative">
                {/* Sidebar / Overlay */}
                <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute top-4 left-4 z-[1000] w-full max-w-sm"
                >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Response Map</h1>
                        <p className="text-sm text-gray-500 mb-6">Real-time tracking of disasters and volunteer deployments.</p>

                        {/* Filters */}
                        <div className="space-y-2 mb-6">
                            <button
                                onClick={() => setFilter('all')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${filter === 'all'
                                    ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-500'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span>Show All Activity</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{disasters.length + volunteers.length}</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setFilter('disasters')}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${filter === 'disasters'
                                        ? 'bg-danger-50 text-danger-700 ring-2 ring-danger-500'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    Disasters ({disasters.length})
                                </button>
                                <button
                                    onClick={() => setFilter('volunteers')}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${filter === 'volunteers'
                                        ? 'bg-success-50 text-success-700 ring-2 ring-success-500'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    Volunteers ({volunteers.length})
                                </button>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Map Legend</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-500"></span>
                                    </span>
                                    <span className="text-sm text-gray-600">Active Disaster</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-primary-500"></span>
                                    <span className="text-sm text-gray-600">Volunteer</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Map Container */}
                <div className="h-[calc(100vh-64px)] w-full z-0">
                    <MapView
                        center={[37.7749, -122.4194]}
                        zoom={6}
                        volunteers={filtered.volunteers}
                        disasters={filtered.disasters}
                    />
                </div>
            </div>
        </div>
    );
};

export default MapViewPage;
