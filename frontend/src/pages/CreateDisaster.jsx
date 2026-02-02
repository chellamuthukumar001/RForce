import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { disasterAPI } from '../services/api';
import { motion } from 'framer-motion';

const CreateDisaster = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        disaster_type: '',
        description: '',
        urgency: 'medium',
        city: '',
        state: '',
        country: '',
        status: 'active'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await disasterAPI.create(formData);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create disaster');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl w-full"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-danger-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white mb-1">Report New Disaster</h1>
                        <p className="text-danger-100 text-sm">Create a new relief entry to coordinate volunteers.</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg mb-6 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Disaster Name <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Bay Area Wildfire"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Disaster Type <span className="text-danger-500">*</span>
                                </label>
                                <select
                                    value={formData.disaster_type}
                                    onChange={(e) => setFormData({ ...formData, disaster_type: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Flood">Flood</option>
                                    <option value="Earthquake">Earthquake</option>
                                    <option value="Fire">Fire</option>
                                    <option value="Hurricane">Hurricane</option>
                                    <option value="Tornado">Tornado</option>
                                    <option value="Tsunami">Tsunami</option>
                                    <option value="Pandemic">Pandemic</option>
                                    <option value="Humanitarian">Humanitarian</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field"
                                    rows="4"
                                    placeholder="Describe the disaster situation, affected areas, and immediate needs..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Urgency Level <span className="text-danger-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['critical', 'high', 'medium', 'low'].map(level => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgency: level })}
                                            className={`p-3 rounded-xl border-2 capitalize transition-all duration-200 text-sm font-medium ${formData.urgency === level
                                                ? `border-${level === 'critical' || level === 'high' ? 'danger' : 'primary'}-500 bg-${level === 'critical' || level === 'high' ? 'danger' : 'primary'}-50 text-${level === 'critical' || level === 'high' ? 'danger' : 'primary'}-700 shadow-sm`
                                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
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
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="input-field"
                                        placeholder="California"
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

                            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 btn-danger shadow-md shadow-danger-200 hover:shadow-lg hover:shadow-danger-300 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </div>
                                    ) : 'Create Disaster Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateDisaster;
