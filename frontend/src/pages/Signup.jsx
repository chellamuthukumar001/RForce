import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const role = 'volunteer';
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Biometric match failed (Passwords do not match)');
            return;
        }

        if (password.length < 6) {
            setError('Encryption strength too low (Min 6 chars)');
            return;
        }

        setLoading(true);

        try {
            const { error } = await signup(email, password, role);
            setLoading(false);

            if (error) {
                setError(error);
            } else {
                navigate('/volunteer/dashboard');
            }
        } catch (err) {
            setError('Network sync failure. Try again.');
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            setLoading(false);
            navigate('/volunteer/dashboard');
        } catch (err) {
            setError(err.message || 'Google Authentication Failed.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </motion.div>
                        </Link>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">Request<br />Enlistment.</h2>
                        <p className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">Initialize Global Responder Profile</p>
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
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Identifier</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 transition-all font-medium"
                                placeholder="name@division.com"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Passkey</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-premium py-5 text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Registering Unit...
                                </span>
                            ) : (
                                'Initiate Enlistment'
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full btn bg-white text-gray-900 border border-gray-200 hover:bg-gray-200 py-5 text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 mt-4 rounded-xl"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full" />
                            {loading ? 'Authenticating...' : 'Sign up with Google'}
                        </motion.button>
                    </form>

                    <div className="mt-10 text-center flex flex-col items-center gap-4">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            Already Enlisted?{' '}
                            <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-extrabold transition-all text-[11px]">
                                Strategic Login
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

export default Signup;
