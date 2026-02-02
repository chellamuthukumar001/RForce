import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { disasterAPI, volunteerAPI, taskAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import useRealtime from '../hooks/useRealtime';
import { supabase } from '../services/supabase';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        disasters: 0,
        volunteers: 0,
        tasks: 0
    });
    const [animatedStats, setAnimatedStats] = useState({
        disasters: 0,
        volunteers: 0,
        tasks: 0
    });
    const [disasters, setDisasters] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentSuccess, setAssignmentSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [disastersRes, volunteersRes, tasksRes] = await Promise.all([
                disasterAPI.getAll().catch(err => {
                    console.error('Disaster API Error:', err);
                    return { data: { disasters: [] } };
                }),
                volunteerAPI.getAll().catch(err => {
                    console.error('Volunteer API Error:', err);
                    return { data: { volunteers: [] } };
                }),
                taskAPI.getAll().catch(err => {
                    console.error('Task API Error:', err);
                    return { data: { tasks: [] } };
                })
            ]);

            console.log('Dashboard Data:', {
                disasters: disastersRes.data?.disasters?.length,
                volunteers: volunteersRes.data?.volunteers?.length,
                tasks: tasksRes.data?.tasks?.length
            });

            const fetchedDisasters = disastersRes.data?.disasters || [];
            const fetchedVolunteers = volunteersRes.data?.volunteers || [];
            const fetchedTasks = tasksRes.data?.tasks || [];

            setDisasters(fetchedDisasters);
            setVolunteers(fetchedVolunteers);
            setTasks(fetchedTasks);

            const newStats = {
                disasters: fetchedDisasters.filter(d => d.status === 'active').length,
                volunteers: fetchedVolunteers.filter(v => v.availability === 'available').length,
                tasks: fetchedTasks.filter(t => t.status === 'open').length
            };
            setStats(newStats);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            if (loading) setLoading(false);
        }
    }, [loading]);

    // Animated counter effect
    useEffect(() => {
        const duration = 1000; // 1 second
        const steps = 30;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            setAnimatedStats({
                disasters: Math.floor(stats.disasters * progress),
                volunteers: Math.floor(stats.volunteers * progress),
                tasks: Math.floor(stats.tasks * progress)
            });

            if (currentStep >= steps) {
                clearInterval(interval);
                setAnimatedStats(stats);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [stats]);

    useEffect(() => {
        fetchData();
    }, []);

    // Subscribe to all changes
    useRealtime(fetchData, ['disasters', 'volunteers', 'tasks', 'task_assignments', 'updates']);

    useEffect(() => {
        const subscription = supabase
            .channel('admin-dashboard-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'volunteers' }, (payload) => {
                toast.success(`New volunteer joined: ${payload.new.name || 'Volunteer'}`, {
                    icon: '👋',
                    duration: 4000
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
                toast(`New task created: ${payload.new.title}`, {
                    icon: '📋',
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleAssign = async (taskId, volunteerId) => {
        if (!volunteerId) return toast.error('Please select a volunteer');

        try {
            await taskAPI.assign(taskId, [volunteerId]);
            setAssignmentSuccess(taskId);
            toast.success('✅ Task assigned successfully!', {
                icon: '🎯',
                duration: 3000
            });
            setTimeout(() => setAssignmentSuccess(null), 600);
            fetchData();
        } catch (e) {
            toast.error('Assignment failed: ' + e.message);
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
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <Toaster position="top-right" />
            <div className="container mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Overview</h1>
                        <p className="text-gray-500 mt-2">Monitor active disasters and coordinate response teams.</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/admin/create-disaster" className="btn-danger shadow-lg shadow-danger-200 hover:shadow-danger-300">
                            + New Disaster
                        </Link>
                        <Link to="/admin/create-task" className="btn-primary shadow-lg shadow-primary-200 hover:shadow-primary-300">
                            + New Task
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group transition-smooth"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Disasters</p>
                        <motion.p
                            key={animatedStats.disasters}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-bold text-gray-900 mt-2"
                        >
                            {animatedStats.disasters}
                        </motion.p>
                        <div className="mt-4 flex items-center text-sm text-danger-600 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-danger-500 mr-2 animate-pulse"></span>
                            Requires immediate attention
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group transition-smooth"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Available Volunteers</p>
                        <motion.p
                            key={animatedStats.volunteers}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-bold text-gray-900 mt-2"
                        >
                            {animatedStats.volunteers}
                        </motion.p>
                        <div className="mt-4 flex items-center text-sm text-primary-600 font-medium">
                            Ready for deployment
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group transition-smooth"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Open Tasks</p>
                        <motion.p
                            key={animatedStats.tasks}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-bold text-gray-900 mt-2"
                        >
                            {animatedStats.tasks}
                        </motion.p>
                        <div className="mt-4 flex items-center text-sm text-warning-600 font-medium">
                            Pending assignment
                        </div>
                    </motion.div>
                </motion.div>

                {/* Open Tasks Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Pending Tasks</h2>
                        <span className="bg-warning-100 text-warning-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {tasks.filter(t => t.status === 'open').length} Open
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        <AnimatePresence>
                            {tasks.filter(t => t.status === 'open').length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    No pending tasks. Good job!
                                </div>
                            ) : (
                                tasks.filter(t => t.status === 'open').map(task => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            scale: assignmentSuccess === task.id ? [1, 1.02, 1] : 1
                                        }}
                                        exit={{ opacity: 0, height: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                        className="p-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700">
                                                        {task.priority || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1">{task.description}</p>
                                                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                                    <span>📅 {new Date(task.created_at).toLocaleDateString()}</span>
                                                    {task.disasters && (
                                                        <span className="flex items-center text-danger-600">
                                                            ⚠️ {task.disasters.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 min-w-[300px]">
                                                <select
                                                    className="input-field text-sm py-2 bg-white border border-gray-300 rounded-md px-3 outline-none focus:ring-2 focus:ring-primary-500"
                                                    id={`volunteer-select-${task.id}`}
                                                >
                                                    <option value="">Select Volunteer...</option>
                                                    {volunteers
                                                        .filter(v => v.availability === 'available')
                                                        .map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.name || 'Volunteer'} ({v.skills?.[0] || 'General'}) - Score: {v.reliability_score || 100}
                                                            </option>
                                                        ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const select = document.getElementById(`volunteer-select-${task.id}`);
                                                        handleAssign(task.id, select.value);
                                                    }}
                                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Assigned Tasks Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">All Assigned Tasks</h2>
                        <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {tasks.filter(t => t.task_assignments && t.task_assignments.length > 0).reduce((acc, t) => acc + t.task_assignments.length, 0)} Assignments
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Task</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Disaster</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {tasks
                                    .filter(t => t.task_assignments && t.task_assignments.length > 0)
                                    .flatMap(task =>
                                        task.task_assignments.map(assignment => ({
                                            ...assignment,
                                            task: task
                                        }))
                                    )
                                    .length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No tasks have been assigned yet
                                        </td>
                                    </tr>
                                ) : (
                                    tasks
                                        .filter(t => t.task_assignments && t.task_assignments.length > 0)
                                        .flatMap(task =>
                                            task.task_assignments.map(assignment => ({
                                                ...assignment,
                                                task: task
                                            }))
                                        )
                                        .map((assignment, index) => {
                                            const volunteer = volunteers.find(v => v.id === assignment.volunteer_id);
                                            return (
                                                <motion.tr
                                                    key={assignment.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-900">{assignment.task.title}</span>
                                                            <span className="text-xs text-gray-500 mt-1">{assignment.task.description?.substring(0, 60)}...</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700 mr-3">
                                                                {volunteer?.name?.[0]?.toUpperCase() || 'V'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{volunteer?.name || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-500">{volunteer?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {assignment.task.disasters ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-900">{assignment.task.disasters.name}</span>
                                                                <span className="text-xs text-gray-500">{assignment.task.disasters.city}, {assignment.task.disasters.state}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${assignment.task.priority === 'high' ? 'bg-danger-100 text-danger-700' :
                                                            assignment.task.priority === 'medium' ? 'bg-warning-100 text-warning-700' :
                                                                'bg-success-100 text-success-700'
                                                            }`}>
                                                            {assignment.task.priority || 'Medium'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${assignment.status === 'completed' ? 'bg-success-100 text-success-800' :
                                                            assignment.status === 'accepted' ? 'bg-primary-100 text-primary-800' :
                                                                assignment.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            <span className={`w-2 h-2 rounded-full mr-2 ${assignment.status === 'completed' ? 'bg-success-500' :
                                                                assignment.status === 'accepted' ? 'bg-primary-500' :
                                                                    assignment.status === 'pending' ? 'bg-warning-500' :
                                                                        'bg-gray-500'
                                                                }`}></span>
                                                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(assignment.assigned_at || assignment.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Disasters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Recent Disasters</h2>
                            <Link to="/disasters" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">View All</Link>
                        </div>

                        {disasters.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No disasters in the records.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                {disasters.slice(0, 5).map(disaster => (
                                    <motion.div
                                        key={disaster.id}
                                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                                        className="p-6 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-gray-900">{disaster.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${disaster.urgency === 'critical' ? 'bg-danger-100 text-danger-700' :
                                                        disaster.urgency === 'high' ? 'bg-warning-100 text-warning-700' :
                                                            'bg-success-100 text-success-700'
                                                        }`}>
                                                        {disaster.urgency}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1">{disaster.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                                        {disaster.disaster_type || disaster.type || 'General'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center mt-3 text-sm text-gray-500">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    {disaster.city}, {disaster.state}, {disaster.country}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${disaster.status === 'active' ? 'bg-success-50 text-success-700 border border-success-100' :
                                                    disaster.status === 'monitoring' ? 'bg-warning-50 text-warning-700 border border-warning-100' :
                                                        'bg-gray-50 text-gray-700 border border-gray-100'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${disaster.status === 'active' ? 'bg-success-500' :
                                                        disaster.status === 'monitoring' ? 'bg-warning-500' :
                                                            'bg-gray-500'
                                                        }`}></span>
                                                    {disaster.status.charAt(0).toUpperCase() + disaster.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Volunteers */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">New Volunteers</h2>
                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {volunteers.length} Total
                            </span>
                        </div>

                        {volunteers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No volunteers yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                <AnimatePresence initial={false}>
                                    {volunteers.slice(0, 10).map((volunteer) => (
                                        <motion.div
                                            key={volunteer.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-inner">
                                                    {volunteer.name ? volunteer.name[0].toUpperCase() : 'V'}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900">{volunteer.name || 'Volunteer'}</h3>
                                                    <p className="text-xs text-gray-500">{volunteer.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${volunteer.availability === 'available' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {volunteer.availability || 'Unknown'}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Reliability: {volunteer.reliability_score || 100}%
                                                </p>
                                                {volunteer.last_login && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Last login: {new Date(volunteer.last_login).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
