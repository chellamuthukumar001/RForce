import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import heroImage from '../assets/hero-image.png'; // Will use the newly generated one in real scenario, mapping locally for now

const Landing = () => {
    const navigate = useNavigate();
    const { user, role, loading } = useAuth();
    const [stats, setStats] = useState({ volunteers: 0, events: 0, helped: 0 });

    useEffect(() => {
        if (!loading && user && role) {
            if (role === 'admin') navigate('/admin/dashboard');
            else navigate('/volunteer/dashboard');
        }
    }, [user, role, loading, navigate]);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
    const scaleHero = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

    useEffect(() => {
        const timer = setInterval(() => {
            setStats(prev => ({
                volunteers: Math.min(prev.volunteers + 25, 1500),
                events: Math.min(prev.events + 1, 50),
                helped: Math.min(prev.helped + 150, 10000)
            }));
        }, 30);
        return () => clearInterval(timer);
    }, []);

    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30 overflow-x-hidden" ref={containerRef}>
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <motion.div style={{ y, opacity: opacityHero, scale: scaleHero }} className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=2074" // High quality placeholder or generated
                        alt="Background"
                        className="w-full h-full object-cover opacity-30 brightness-[0.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
                </motion.div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-6xl mx-auto text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                                Global Response Protocol Active
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="text-7xl md:text-[10rem] font-bold mb-8 leading-[0.85] tracking-tighter"
                        >
                            <span className="text-white block">Rapid. Aware.</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 via-green-500 to-teal-400 block px-4">Impactful.</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="text-lg md:text-2xl mb-12 text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium"
                        >
                            The industry-standard AI ecosystem for high-stakes coordination. We bridge the gap between volunteers and emergencies with sub-second precision.
                        </motion.p>

                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                        >
                            <Link to="/map">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Tactical Command Map
                                </motion.button>
                            </Link>

                            <div className="flex gap-4">
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-5 bg-white/5 backdrop-blur-xl text-white rounded-2xl font-bold text-lg border border-white/10 hover:border-white/20 transition-all"
                                    >
                                        Responder Login
                                    </motion.button>
                                </Link>
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-5 bg-white/5 backdrop-blur-xl text-emerald-400 rounded-2xl font-bold text-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                                    >
                                        Admin Command
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="py-24 relative z-10 border-t border-white/5 bg-background">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Mobilized Force", value: stats.volunteers, suffix: "+", color: "from-emerald-400 to-green-600" },
                            { label: "Active Operations", value: stats.events, suffix: "", color: "from-blue-400 to-indigo-600" },
                            { label: "Lives Benefited", value: stats.helped, suffix: "+", color: "from-purple-400 to-pink-600" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card text-center group"
                            >
                                <div className={`text-6xl font-black mb-2 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.value.toLocaleString()}{stat.suffix}
                                </div>
                                <div className="text-gray-400 uppercase tracking-[0.2em] text-xs font-bold font-heading">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section className="py-32 bg-background relative z-10">
                <div className="container mx-auto px-6">
                    <div className="mb-20 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
                        >
                            The RForce Engine.
                        </motion.h2>
                        <p className="text-gray-500 text-xl font-medium tracking-tight">Industrial-grade emergency architecture.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 md:row-span-2 glass-card bg-emerald-500/5 flex flex-col justify-end p-10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <svg className="w-64 h-64 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h3 className="text-4xl font-bold mb-4 tracking-tight">AI Matching.</h3>
                            <p className="text-gray-400 font-medium text-lg leading-relaxed">
                                Our proprietary ranking system evaluates responder capability, real-time location, and emergency urgency to deploy perfect-fit teams in seconds.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-2 glass-card flex items-center justify-between group"
                        >
                            <div>
                                <h3 className="text-3xl font-bold mb-2">Live Comms.</h3>
                                <p className="text-gray-400">Direct-action updates from the field.</p>
                            </div>
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card flex flex-col justify-center"
                        >
                            <h3 className="text-2xl font-bold mb-2">Secure Ops.</h3>
                            <p className="text-gray-500 text-sm">Military-grade profile verification and secure data encryption protocols.</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card flex flex-col justify-center border-emerald-500/40 bg-emerald-500/10"
                        >
                            <h3 className="text-2xl font-bold mb-2 text-emerald-400">Zero Lag.</h3>
                            <p className="text-emerald-500/60 text-sm italic">Edge-optimized distribution for disaster zones with low connectivity.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Premium CTA */}
            <section className="py-40 bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/[0.02] -skew-y-6"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-10">
                            Answer the call <br />
                            <span className="text-emerald-500">of duty.</span>
                        </h2>
                        <Link to="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(16, 185, 129, 0.3)" }}
                                className="px-16 py-6 bg-white text-black rounded-3xl font-black text-2xl tracking-tighter uppercase"
                            >
                                Initiate Profile
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer Minimal */}
            <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm font-medium">
                <p>© 2026 RFORCE COMMAND. ALL RIGHTS RESERVED. SECURE END-TO-END RECOVERY SYSTEM.</p>
            </footer>
        </div>
    );
};

export default Landing;
