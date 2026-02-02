import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import disasterRescue1 from '../assets/disaster-rescue-1.png';
import disasterRescue2 from '../assets/disaster-rescue-2.png';

const Landing = () => {
    const [stats, setStats] = useState({ volunteers: 0, events: 0, helped: 0 });
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const backgroundImages = [disasterRescue1, disasterRescue2];

    useEffect(() => {
        // Simple counting animation effect
        const timer = setInterval(() => {
            setStats(prev => ({
                volunteers: Math.min(prev.volunteers + 50, 1500),
                events: Math.min(prev.events + 2, 50),
                helped: Math.min(prev.helped + 300, 10000)
            }));
        }, 50);

        return () => clearInterval(timer);
    }, []);

    // Background image slideshow effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen font-sans overflow-x-hidden" ref={containerRef}>
            {/* Hero Section with Parallax */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Animated Background Images with Crossfade */}
                <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
                    {backgroundImages.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-2000 ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ transitionDuration: '2000ms' }}
                        >
                            <img
                                src={image}
                                alt="Disaster Relief Team"
                                className="w-full h-full object-cover scale-110"
                            />
                        </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />
                </motion.div>

                <div className="container mx-auto px-4 relative z-10 text-white">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-5xl mx-auto text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            transition={{ duration: 0.8 }}
                            className="inline-block mb-4 px-4 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 backdrop-blur-sm text-primary-300 font-semibold tracking-wide text-sm uppercase"
                        >
                            Rapid Response Network
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            transition={{ duration: 0.8 }}
                            className="text-6xl md:text-8xl font-bold mb-6 leading-tight tracking-tight drop-shadow-lg"
                        >
                            Orchestrating Hope <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">When It Matters Most</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed font-light"
                        >
                            AI-powered coordination for rapid disaster response. Connecting volunteers, NGOs, and resources in real-time to save lives.
                        </motion.p>

                        <motion.div
                            variants={fadeInUp}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                        >
                            <Link to="/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(220, 38, 38, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-primary-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-500 transition-all shadow-xl shadow-primary-900/50 min-w-[200px]"
                                >
                                    Join the Mission
                                </motion.button>
                            </Link>

                            <div className="flex gap-4">
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/30 min-w-[160px]"
                                    >
                                        Volunteer Login
                                    </motion.button>
                                </Link>
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 58, 138, 0.8)" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-gray-900/40 backdrop-blur-md text-gray-100 px-6 py-4 rounded-full font-bold text-lg hover:bg-gray-900/60 transition-all border border-gray-500/30 min-w-[160px]"
                                    >
                                        Admin Login
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 1, repeat: Infinity, duration: 1.5 }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/50"
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-32 bg-gray-50 relative z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">How We Orchestrate Aid</h2>
                        <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full mb-6"></div>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Seamlessly connecting those who can help with those who need it most.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                ),
                                title: "Register & Verify",
                                desc: "Join our network of verified volunteers. Create your profile with specialized skills and location."
                            },
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                ),
                                title: "Smart Matching",
                                desc: "Our AI instantly matches your skills and location with urgent needs in disaster zones."
                            },
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                ),
                                title: "Save Lives",
                                desc: "Coordinate effectively with teams on the ground to provide rapid relief and support."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                                className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100 group cursor-pointer"
                            >
                                <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {feature.icon}
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">{feature.title}</h3>
                                <p className="text-gray-600 text-center text-lg leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section with Parallax feel */}
            <section className="py-28 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-6xl mx-auto">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-white">
                                {stats.volunteers.toLocaleString()}+
                            </div>
                            <div className="text-xl text-gray-300 font-medium uppercase tracking-widest">Volunteers Mobilized</div>
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-white">
                                {stats.events}+
                            </div>
                            <div className="text-xl text-gray-300 font-medium uppercase tracking-widest">Operations Managed</div>
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
                        >
                            <div className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-white">
                                {stats.helped.toLocaleString()}+
                            </div>
                            <div className="text-xl text-gray-300 font-medium uppercase tracking-widest">Lives Impacted</div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-white relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-12 md:p-24 text-center text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-600 opacity-20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-600 opacity-20 rounded-full blur-3xl"></div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10 leading-tight">
                            Ready to Make a Difference?
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto relative z-10 font-light">
                            Your skills can save lives. Join thousands of volunteers making a real impact in disaster zones today.
                        </p>
                        <Link to="/signup" className="relative z-10 inline-block">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-gray-900 px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition-all shadow-xl"
                            >
                                Get Started Now
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
