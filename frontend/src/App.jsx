import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VolunteerRegistration from './pages/VolunteerRegistration';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateDisaster from './pages/CreateDisaster';
import CreateTask from './pages/CreateTask';
import MapViewPage from './pages/MapViewPage';
import Updates from './pages/Updates';

import { Toaster } from 'react-hot-toast';

// Page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeIn"
        }
    }
};

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/" element={
                    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                        <Landing />
                    </motion.div>
                } />
                <Route path="/login" element={
                    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                        <Login />
                    </motion.div>
                } />
                <Route path="/signup" element={
                    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                        <Signup />
                    </motion.div>
                } />

                {/* Volunteer Routes */}
                <Route
                    path="/volunteer/register"
                    element={
                        <ProtectedRoute>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <VolunteerRegistration />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/volunteer/dashboard"
                    element={
                        <ProtectedRoute>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <VolunteerDashboard />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <AdminDashboard />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/create-disaster"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <CreateDisaster />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/create-task"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <CreateTask />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />

                {/* Shared Routes */}
                <Route
                    path="/map"
                    element={
                        <ProtectedRoute>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <MapViewPage />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/updates"
                    element={
                        <ProtectedRoute>
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                <Updates />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route
                    path="*"
                    element={
                        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                                    <p className="text-xl text-gray-600 mb-6">Page not found</p>
                                    <a href="/" className="btn-primary">
                                        Go Home
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    }
                />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="flex flex-col min-h-screen">
                    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
                    <Header />
                    <main className="flex-grow">
                        <AnimatedRoutes />
                    </main>
                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
