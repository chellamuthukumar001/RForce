import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/map', label: 'Global Map' },
        { path: '/updates', label: 'Live Updates' },
    ];

    if (user) {
        if (role === 'admin') {
            navLinks.push({ path: '/admin/dashboard', label: 'Command Center' });
        } else {
            navLinks.push({ path: '/volunteer/dashboard', label: 'My Operations' });
        }
    }

    return (
        <header
            className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled
                ? 'py-3 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-2xl'
                : 'py-6 bg-transparent border-b border-transparent'
                }`}
        >
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center space-x-4 group">
                        <motion.div 
                            whileHover={{ rotate: 90, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-green-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover:shadow-emerald-500/40 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] opacity-50"></div>
                            <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </motion.div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black font-heading tracking-tighter text-white leading-none">
                                    RFORCE
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-emerald-500/60 font-black">
                                COMMAND OPERATIVE
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center bg-white/5 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive(link.path)
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="nav-bg"
                                        className="absolute inset-0 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                                        initial={false}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    Log Out
                                </button>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center space-x-3 bg-white/5 pl-4 pr-1.5 py-1.5 rounded-full border border-white/10"
                                >
                                    <span className="text-xs font-medium text-gray-300">
                                        {role === 'admin' ? 'Controller' : 'Responder'}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold shadow-inner">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-5 py-2.5 text-gray-300 font-semibold hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="btn btn-premium text-sm"
                                >
                                    Volunteer Now
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Icon */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-2xl border-b border-white/10 py-8 px-6 space-y-6 shadow-2xl"
                    >
                        <div className="space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block text-2xl font-bold tracking-tight ${isActive(link.path) ? 'text-emerald-400' : 'text-white'}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="pt-6 border-t border-white/10 space-y-4">
                            {user ? (
                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className="w-full btn btn-outline border-red-500/30 text-red-400"
                                >
                                    Sign Out
                                </button>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full text-center py-4 bg-white/5 rounded-2xl text-white font-bold border border-white/10"
                                    >
                                        Log In
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full btn btn-premium py-4"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
