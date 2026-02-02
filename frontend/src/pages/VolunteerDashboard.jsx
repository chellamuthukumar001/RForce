import React, { useState, useEffect, useCallback } from 'react';
import { taskAPI, volunteerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import useRealtime from '../hooks/useRealtime';
import toast, { Toaster } from 'react-hot-toast';

const VolunteerDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [celebratingTask, setCelebratingTask] = useState(null);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [assignmentsRes, volunteerRes] = await Promise.all([
                taskAPI.getMyTasks(),
                volunteerAPI.getMe()
            ]);

            // Check for new assignments to toast
            if (volunteerRes.data.volunteer) {
                const newAssignments = assignmentsRes.data.assignments || [];
                // Simple check: if length increased (in a real app, compare IDs)
                if (assignments.length > 0 && newAssignments.length > assignments.length) {
                    toast.success('New Mission Assigned!', { icon: '🚨' });
                }
            }

            setAssignments(assignmentsRes.data.assignments || []);
            setVolunteer(volunteerRes.data.volunteer);
            setLoading(false);
        } catch (err) {
            console.warn("Fetch error:", err);
            // Don't set error state on background refreshes to avoid flash
            if (loading) setError('Failed to load dashboard');
            setLoading(false);
        }
    }, [assignments.length, loading]);

    useEffect(() => {
        fetchData();
    }, []);

    // Subscribe to changes in tasks and assignments
    useRealtime(fetchData, ['task_assignments', 'tasks', 'updates']);

    const handleUpdateAssignment = async (assignmentId, status) => {
        try {
            await taskAPI.updateAssignment(assignmentId, status);

            if (status === 'accepted') {
                setCelebratingTask(assignmentId);
                toast.success('🎉 Task accepted! Great job!', {
                    icon: '✅',
                    duration: 3000
                });
                setTimeout(() => setCelebratingTask(null), 600);
            } else if (status === 'completed') {
                toast.success('✨ Task completed! Excellent work!', {
                    icon: '🏆',
                    duration: 3000
                });
            } else if (status === 'declined') {
                toast.info('Task declined', {
                    icon: 'ℹ️',
                    duration: 2000
                });
            }

            fetchData();
        } catch (err) {
            toast.error('Failed to update assignment');
        }
    };

    const handleUpdateAvailability = async (availability) => {
        try {
            await volunteerAPI.updateAvailability(availability);
            toast.success(`Status set to ${availability}`);
            fetchData();
        } catch (err) {
            toast.error('Failed to update availability');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        },
        exit: {
            scale: 0.9,
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="rounded-full h-12 w-12 border-b-2 border-primary-600"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <Toaster position="top-right" />
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Volunteer Dashboard</h1>
                    <p className="text-gray-500 mt-2">Manage your profile and ongoing relief missions.</p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-xl mb-8 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {error}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Summary */}
                    {volunteer && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24"
                        >
                            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-3xl font-bold text-primary-700 mb-4 shadow-inner relative"
                                >
                                    {volunteer.name ? volunteer.name[0].toUpperCase() : 'V'}
                                    <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${volunteer.availability === 'available' ? 'bg-success-500' :
                                        volunteer.availability === 'busy' ? 'bg-warning-500' : 'bg-gray-400'
                                        }`}></span>
                                </motion.div>
                                <h2 className="text-2xl font-bold text-gray-900">{volunteer.name}</h2>
                                <p className="text-gray-500">{volunteer.email}</p>
                                <div className="mt-2 flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {volunteer.city}, {volunteer.state}
                                </div>
                            </div>

                            <div className="py-6 border-b border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Availability Status</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['available', 'busy', 'offline'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateAvailability(status)}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all border-2 relative overflow-hidden ${volunteer.availability === status
                                                ? 'bg-primary-50 border-primary-600 text-primary-700'
                                                : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="py-6 border-b border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {volunteer.skills && volunteer.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-gray-500 text-xs font-medium uppercase">Total Impact</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{volunteer.completed_tasks || 0}</p>
                                        <p className="text-xs text-primary-600 font-medium">Tasks Completed</p>
                                    </div>
                                    <div className="flex-1 border-l border-primary-200 pl-4">
                                        <p className="text-gray-500 text-xs font-medium uppercase">Reliability</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{volunteer.reliability_score || 100}</p>
                                        <p className="text-xs text-primary-600 font-medium">Trust Score</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* My Tasks */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Mission Assignments</h2>
                            <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-500 border border-gray-200 shadow-sm">
                                {assignments.length} Active
                            </span>
                        </div>

                        {assignments.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No assignments yet</h3>
                                <p className="text-gray-500">You're currently not assigned to any missions. Stand by for future alerts.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                <AnimatePresence mode='popLayout'>
                                    {assignments.map(assignment => (
                                        <motion.div
                                            key={assignment.id}
                                            layout
                                            variants={itemVariants}
                                            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${assignment.tasks.disasters.urgency === 'critical' ? 'bg-danger-50 text-danger-700 border-danger-100' :
                                                            assignment.tasks.disasters.urgency === 'high' ? 'bg-warning-50 text-warning-700 border-warning-100' :
                                                                'bg-success-50 text-success-700 border-success-100'
                                                            }`}>
                                                            {assignment.tasks.disasters.urgency}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-bold">
                                                            {assignment.tasks.disasters.disaster_type || 'Disaster'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-medium text-gray-600 mb-1">{assignment.tasks.disasters.name}</h4>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{assignment.tasks.title}</h3>

                                                    <p className="text-gray-600 mb-4 leading-relaxed">{assignment.tasks.description}</p>

                                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                                        <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        {assignment.tasks.disasters.city}, {assignment.tasks.disasters.state}
                                                    </div>

                                                    {assignment.tasks.required_skills && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {assignment.tasks.required_skills.map(skill => (
                                                                <span key={skill} className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs border border-gray-100">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-end min-w-[140px]">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4 ${assignment.status === 'accepted' ? 'bg-success-100 text-success-800' :
                                                        assignment.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                                                            assignment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${assignment.status === 'accepted' ? 'bg-success-500' :
                                                            assignment.status === 'pending' ? 'bg-warning-500' :
                                                                'bg-gray-500'
                                                            }`}></span>
                                                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                                    </span>

                                                    {assignment.status === 'pending' && (
                                                        <div className="flex flex-col w-full gap-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleUpdateAssignment(assignment.id, 'accepted')}
                                                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-md shadow-primary-200"
                                                            >
                                                                Accept
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleUpdateAssignment(assignment.id, 'declined')}
                                                                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                                                            >
                                                                Decline
                                                            </motion.button>
                                                        </div>
                                                    )}

                                                    {assignment.status === 'accepted' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleUpdateAssignment(assignment.id, 'completed')}
                                                            className="w-full bg-success-600 hover:bg-success-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-md shadow-success-200"
                                                        >
                                                            Complete
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
