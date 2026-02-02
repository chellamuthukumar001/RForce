import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, disasterAPI, aiAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/MapView';

const SKILLS_OPTIONS = [
    'Medical Aid',
    'First Aid',
    'Search and Rescue',
    'Emergency Response',
    'Food Distribution',
    'Shelter Management',
    'Logistics',
    'Physical Labor',
    'Child Care',
    'Psychological Support',
    'Translation',
    'Community Outreach'
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
        location_mode: 'disaster' // 'disaster' or 'custom'
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
            console.error('Failed to load disasters');
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
        if (!formData.disaster_id) {
            alert('Please select a disaster first');
            return;
        }

        setLoading(true);
        try {
            // Prepare task data with location
            const taskData = { ...formData };
            if (formData.location_mode === 'custom' && customLocation.lat && customLocation.lng) {
                taskData.latitude = customLocation.lat;
                taskData.longitude = customLocation.lng;
                taskData.address = customLocation.address;
            }

            // First create the task
            const taskRes = await taskAPI.create(taskData);
            const taskId = taskRes.data.task.id;

            // Then get AI rankings
            console.log('Fetching AI rankings for task:', taskId);
            const aiRes = await aiAPI.rankVolunteers(taskId, 5);
            console.log('AI Response:', aiRes.data);
            setRankedVolunteers(aiRes.data.ranked_volunteers || []);
            setShowAIResults(true);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get AI suggestions');
            setLoading(false);
        }
    };

    const handleAutoAssign = async () => {
        if (rankedVolunteers.length === 0) return;

        const taskId = rankedVolunteers[0]?.task_id;
        if (!taskId) {
            alert('Task ID not found');
            return;
        }

        setLoading(true);
        try {
            const volunteerIds = rankedVolunteers.slice(0, 3).map(v => v.volunteer_id);
            await taskAPI.assign(taskId, volunteerIds);
            navigate('/admin/dashboard');
        } catch (err) {
            alert('Failed to assign volunteers');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Prepare task data with location
            const taskData = { ...formData };
            if (formData.location_mode === 'custom' && customLocation.lat && customLocation.lng) {
                taskData.latitude = customLocation.lat;
                taskData.longitude = customLocation.lng;
                taskData.address = customLocation.address;
            }

            await taskAPI.create(taskData);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create task');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl w-full"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-fit">
                        <div className="bg-primary-600 px-8 py-6">
                            <h1 className="text-2xl font-bold text-white mb-1">Create Response Task</h1>
                            <p className="text-primary-100 text-sm">Deploy volunteers to specific needs.</p>
                        </div>

                        <div className="p-8">
                            {error && (
                                <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Associated Disaster <span className="text-danger-500">*</span>
                                    </label>
                                    <select
                                        value={formData.disaster_id}
                                        onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select a disaster event</option>
                                        {disasters.map(disaster => (
                                            <option key={disaster.id} value={disaster.id}>
                                                {disaster.name} ({disaster.disaster_type || disaster.type || 'General'} - {disaster.urgency.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location Selection Section */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Task Location
                                    </label>
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="location_mode"
                                                value="disaster"
                                                checked={formData.location_mode === 'disaster'}
                                                onChange={(e) => setFormData({ ...formData, location_mode: e.target.value })}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">Same as Disaster</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="location_mode"
                                                value="custom"
                                                checked={formData.location_mode === 'custom'}
                                                onChange={(e) => setFormData({ ...formData, location_mode: e.target.value })}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">Set Custom Location</span>
                                        </label>
                                    </div>

                                    {formData.location_mode === 'custom' && (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="h-64 relative">
                                                <MapView
                                                    center={customLocation.lat ? [customLocation.lat, customLocation.lng] : [37.7749, -122.4194]}
                                                    zoom={10}
                                                    disasters={disasters}
                                                    onLocationSelect={(loc) => setCustomLocation({ ...customLocation, ...loc })}
                                                    selectedLocation={customLocation}
                                                />
                                                {!customLocation.lat && (
                                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                                                        <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-gray-700">
                                                            Click map to select location
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Selected coordinates..."
                                                    value={customLocation.lat ? `${customLocation.lat.toFixed(6)}, ${customLocation.lng.toFixed(6)}` : ''}
                                                    readOnly
                                                    className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Task Title <span className="text-danger-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Medical Aid Station Setup"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Task Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field"
                                        rows="3"
                                        placeholder="Describe requirements and objectives..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Required Skills
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SKILLS_OPTIONS.map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${formData.required_skills.includes(skill)
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleGetAISuggestions}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : '✨ Generate AI Assignments'}
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 btn-primary"
                                        >
                                            Create Task Only
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/admin/dashboard')}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* AI Results Section */}
                    <AnimatePresence>
                        {showAIResults && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-6 border border-violet-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl">🤖</div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">AI Recommendations</h2>
                                            <p className="text-sm text-gray-500">Based on skills, location & availability</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {rankedVolunteers.map((volunteer, index) => (
                                            <motion.div
                                                key={volunteer.volunteer_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500"></div>
                                                <div className="flex justify-between items-start pl-3">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{volunteer.volunteer_name}</h3>
                                                        <p className="text-xs text-gray-500 mb-2">{volunteer.volunteer_email}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded">📍 {volunteer.distance}km away</span>
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded">⭐ {volunteer.scores.skill.toFixed(1)} match</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-violet-600">{Math.round(volunteer.scores.final * 100)}%</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match Score</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAutoAssign}
                                        disabled={loading}
                                        className="w-full mt-6 bg-success-600 hover:bg-success-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-success-200 transition-all active:scale-95"
                                    >
                                        Confirm & Assign Top 3 Volunteers
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateTask;
