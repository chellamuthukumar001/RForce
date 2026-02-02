import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { updatesAPI } from '../services/api';
import useRealtime from '../hooks/useRealtime';

const Updates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, critical, high, medium, low
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest
    const [viewMode, setViewMode] = useState('timeline'); // timeline, table

    useEffect(() => {
        fetchUpdates();
    }, []);


    const fetchUpdates = useCallback(async () => {
        try {
            const response = await updatesAPI.getAll();
            setUpdates(response.data.updates || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch updates:', err);
            if (loading) setError('Failed to load updates. Please try again later.');
            setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        fetchUpdates();
    }, []);

    // Real-time subscription for updates
    useRealtime(fetchUpdates, ['updates', 'disasters']);

    const getFilteredUpdates = () => {
        let filtered = updates;

        // Filter by priority
        if (filter !== 'all') {
            filtered = filtered.filter(update => update.priority === filter);
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
            } else {
                return new Date(a.created_at) - new Date(b.created_at);
            }
        });

        return filtered;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hrs ago`;
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const filteredUpdates = getFilteredUpdates();

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="container mx-auto max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Alerts & Updates</h1>
                    <p className="text-gray-500 mt-2">Real-time announcements from the disaster response coordinator.</p>
                </motion.div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Filters, Sort, and View Toggle */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => setFilter(priority)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === priority
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Sort by</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="input-field py-1.5 min-w-[140px]"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'timeline'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    title="Timeline View"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'table'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    title="Table View"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Disaster & Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Message</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredUpdates.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No updates available for this filter
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUpdates.map((update, index) => (
                                            <motion.tr
                                                key={update.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`hover:bg-gray-50 transition-colors ${update.priority === 'critical' ? 'bg-danger-50/30' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-2 ${update.priority === 'critical' ? 'bg-danger-500 animate-pulse' :
                                                            update.priority === 'high' ? 'bg-warning-500' :
                                                                update.priority === 'medium' ? 'bg-primary-500' :
                                                                    'bg-gray-400'
                                                            }`}></div>
                                                        <span className={`text-xs font-bold uppercase ${update.priority === 'critical' ? 'text-danger-700' :
                                                            update.priority === 'high' ? 'text-warning-700' :
                                                                update.priority === 'medium' ? 'text-primary-700' :
                                                                    'text-gray-600'
                                                            }`}>
                                                            {update.priority}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900">{update.title}</span>
                                                        {update.priority === 'critical' && (
                                                            <span className="bg-danger-100 text-danger-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                                Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                                        {update.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {update.disasters ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${update.disasters.urgency === 'critical' ? 'bg-danger-100 text-danger-700' :
                                                                    update.disasters.urgency === 'high' ? 'bg-warning-100 text-warning-700' :
                                                                        'bg-success-100 text-success-700'
                                                                    }`}>
                                                                    {update.disasters.disaster_type || 'General'}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900">{update.disasters.name}</span>
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                {update.disasters.city}, {update.disasters.state}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">General Update</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-600 line-clamp-2">{update.message}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDate(update.created_at)}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Timeline View */}
                {viewMode === 'timeline' && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="space-y-6 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-gray-200 before:z-0 max-sm:before:left-5"
                    >
                        {filteredUpdates.length === 0 ? (
                            <div className="text-center py-12 relative z-10 bg-gray-50">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-gray-600">No updates available for this filter</p>
                            </div>
                        ) : (
                            filteredUpdates.map(update => (
                                <motion.div
                                    key={update.id}
                                    variants={{
                                        hidden: { x: -20, opacity: 0 },
                                        visible: { x: 0, opacity: 1 }
                                    }}
                                    className="relative z-10 pl-20 max-sm:pl-14"
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-6 max-sm:left-3 top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 ${update.priority === 'critical' ? 'bg-danger-500 ring-danger-100' :
                                        update.priority === 'high' ? 'bg-warning-500 ring-warning-100' :
                                            update.priority === 'medium' ? 'bg-primary-500 ring-primary-100' :
                                                'bg-gray-400 ring-gray-100'
                                        }`}></div>

                                    <div className={`bg-white rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${update.priority === 'critical' ? 'border-danger-100' : 'border-gray-100'
                                        }`}>
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{update.title}</h3>
                                                    {update.priority === 'critical' && (
                                                        <span className="bg-danger-100 text-danger-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                    {update.category} • {formatDate(update.created_at)}
                                                </p>

                                                {/* Disaster Location Info */}
                                                {update.disasters && (
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${update.disasters.urgency === 'critical' ? 'bg-danger-100 text-danger-700' :
                                                                update.disasters.urgency === 'high' ? 'bg-warning-100 text-warning-700' :
                                                                    'bg-success-100 text-success-700'
                                                            }`}>
                                                            {update.disasters.disaster_type || 'General'}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-700">{update.disasters.name}</span>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {update.disasters.city}, {update.disasters.state}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 leading-relaxed text-sm">
                                            {update.message}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Updates;
