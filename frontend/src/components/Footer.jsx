import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">RForce</h3>
                        <p className="text-gray-400 text-sm">
                            Connecting volunteers with disaster relief efforts through AI-powered coordination.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/map" className="text-gray-400 hover:text-white transition-colors">Map View</a></li>
                            <li><a href="/updates" className="text-gray-400 hover:text-white transition-colors">Updates & Alerts</a></li>
                            <li><a href="/volunteer/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                        <p className="text-gray-400 text-sm mb-2">For immediate assistance:</p>
                        <p className="text-white font-semibold">911 (Emergency Services)</p>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
                    <p>&copy; 2024 RForce. All rights reserved. Built for humanitarian coordination.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
