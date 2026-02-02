import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { volunteerAPI } from '../services/api';
import { motion } from 'framer-motion';

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
    'Community Outreach',
    'IT Support',
    'Communications'
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

        if (formData.skills.length === 0) {
            setError('Please select at least one skill to help us match you.');
            return;
        }

        setLoading(true);

        try {
            await volunteerAPI.createProfile(formData);
            navigate('/volunteer/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create profile');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-primary-600 px-8 py-8 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Join the Response Team</h1>
                        <p className="text-primary-100">Your skills can save lives. Tell us about yourself.</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg mb-8 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                    <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">1</span>
                                    <h2 className="text-lg font-bold text-gray-800">Personal Details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name <span className="text-danger-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address <span className="text-danger-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input-field"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="input-field"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                    <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">2</span>
                                    <h2 className="text-lg font-bold text-gray-800">Location</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="input-field"
                                            placeholder="San Francisco"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="input-field"
                                            placeholder="CA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="input-field"
                                            placeholder="USA"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                    <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">3</span>
                                    <h2 className="text-lg font-bold text-gray-800">Skills & Availability</h2>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Select Your Skills <span className="text-danger-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SKILLS_OPTIONS.map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => handleSkillToggle(skill)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${formData.skills.includes(skill)
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Current Availability
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['available', 'busy', 'offline'].map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, availability: status })}
                                                className={`py-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${formData.availability === status
                                                    ? `border-${status === 'available' ? 'success' : status === 'busy' ? 'warning' : 'gray'}-500 bg-${status === 'available' ? 'success' : status === 'busy' ? 'warning' : 'gray'}-50 text-${status === 'available' ? 'success' : status === 'busy' ? 'warning' : 'gray'}-700`
                                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 btn-primary shadow-lg shadow-primary-200 hover:shadow-primary-300 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                                Processing...
                                            </div>
                                        ) : 'Complete Registration'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VolunteerRegistration;
