import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const { login, user, role, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user && role) {
            if (role === 'admin') navigate('/admin/dashboard');
            else navigate('/volunteer/dashboard');
        }
    }, [user, role, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        try {
            const { data, error } = await login(email, password);
            setSubmitLoading(false);

            if (error) {
                setError(error);
            } else {
                if (data?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/volunteer/dashboard');
                }
            }
        } catch (err) {
            setError('Strategic connection failure. Attempt override.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setSubmitLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/volunteer/dashboard`
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message || 'Google Authentication Failed.');
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
            {/* Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="glass-card p-10 lg:p-12">
                    <div className="text-center mb-10">
                        <Link to="/" className="inline-block group mb-6">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.5 }}
                                className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"
                            >
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </motion.div>
                        </Link>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">Tactical<br />Authentication.</h2>
                        <p className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">Input Credentials to Initialize Node</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-wider"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Responder Signature (Email)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 transition-all font-medium"
                                placeholder="name@division.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Secure Passkey</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 transition-all font-medium"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitLoading || authLoading}
                            className="w-full btn btn-premium py-5 text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {submitLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Synchronizing...
                                </span>
                            ) : (
                                'Initiate Session'
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={submitLoading || authLoading}
                            className="w-full btn bg-white text-gray-900 border border-gray-200 hover:bg-gray-200 py-5 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 mt-4 rounded-xl"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full" />
                            {submitLoading ? 'Authenticating...' : 'Sign in with Google'}
                        </motion.button>
                    </form>

                    <div className="mt-10 text-center flex flex-col items-center gap-4">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            New Unit?{' '}
                            <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-extrabold transition-all">
                                Request Entry Profile
                            </Link>
                        </p>
                        <div className="h-px w-20 bg-white/5"></div>
                        <Link to="/" className="text-[9px] font-bold text-gray-700 uppercase tracking-widest hover:text-gray-500">Back to External View</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
