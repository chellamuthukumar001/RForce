import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Supported Map Tile Providers with OpenStreetMap as primary
export const MAP_LAYERS = {
    osm: {
        id: 'osm',
        name: 'OpenStreetMap Standard',
        shortName: 'OSM Standard',
        badge: 'OSM',
        icon: '🗺️',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        description: 'Standard OpenStreetMap cartography with clear streets, landmarks & labels'
    },
    humanitarian: {
        id: 'humanitarian',
        name: 'OpenStreetMap Relief (HOT)',
        shortName: 'OSM Humanitarian',
        badge: 'HOT',
        icon: '🚑',
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noreferrer">Humanitarian OSM Team</a>',
        maxZoom: 19,
        description: 'Specialized OSM humanitarian style for crisis & disaster relief operations'
    },
    dark: {
        id: 'dark',
        name: 'Tactical Dark (Carto OSM)',
        shortName: 'Tactical Dark',
        badge: 'Dark',
        icon: '🌙',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
        maxZoom: 19,
        description: 'High-contrast dark mode for low-light command tactical operations'
    },
    topo: {
        id: 'topo',
        name: 'OpenTopoMap (Topographic)',
        shortName: 'OSM Topo',
        badge: 'Topo',
        icon: '⛰️',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; <a href="https://openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="http://opentopomap.org" target="_blank" rel="noreferrer">OpenTopoMap</a>',
        maxZoom: 17,
        description: 'Topographic terrain view with contour lines and elevation profiles'
    },
    satellite: {
        id: 'satellite',
        name: 'Esri Satellite Imagery',
        shortName: 'Satellite',
        badge: 'Aero',
        icon: '🛰️',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
        description: 'High-resolution aerial satellite imagery for geographical inspection'
    }
};

// Simplified icon generator
const iconHtml = (color, size, isPing = false) => {
    return `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px;">
            ${isPing ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.45; animation: rforce-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="position: relative; z-index: 10; width: 100%; height: 100%; border-radius: 50%; background-color: white; border: 3.5px solid ${color}; box-shadow: 0 10px 15px -3px ${color}66; display: flex; align-items: center; justify-content: center;">
                <div style="width: 55%; height: 55%; border-radius: 50%; background-color: ${color}; opacity: 0.9;"></div>
            </div>
        </div>
        <style>
            @keyframes rforce-ping {
                75%, 100% { transform: scale(2.4); opacity: 0; }
            }
        </style>
    `;
};

const volunteerIcon = L.divIcon({
    html: iconHtml('#10b981', 24),
    className: 'v-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const disasterIcons = {
    critical: L.divIcon({ html: iconHtml('#ef4444', 32, true), className: 'd-icon-c', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] }),
    high: L.divIcon({ html: iconHtml('#f59e0b', 28, true), className: 'd-icon-h', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] }),
    medium: L.divIcon({ html: iconHtml('#3b82f6', 24, true), className: 'd-icon-m', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] }),
    low: L.divIcon({ html: iconHtml('#6b7280', 20), className: 'd-icon-l', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] }),
};

const selectedIcon = L.divIcon({
    html: iconHtml('#a855f7', 30, true),
    className: 's-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

// Custom map controls component
const MapControls = ({ onRecenter, hasPoints }) => {
    const map = useMap();

    return (
        <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2 pointer-events-auto">
            <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/15 overflow-hidden shadow-2xl">
                <button
                    type="button"
                    onClick={() => map.zoomIn()}
                    title="Zoom in"
                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/10 text-lg font-bold"
                >
                    +
                </button>
                <button
                    type="button"
                    onClick={() => map.zoomOut()}
                    title="Zoom out"
                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors text-lg font-bold"
                >
                    &minus;
                </button>
            </div>
            {hasPoints && (
                <button
                    type="button"
                    onClick={onRecenter}
                    title="Fit all markers in view"
                    className="w-9 h-9 flex items-center justify-center bg-slate-900/90 backdrop-blur-md text-emerald-400 hover:text-white hover:bg-emerald-600/30 rounded-xl border border-white/15 shadow-2xl transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const MapView = ({
    center = [11.1271, 78.6569], // Centered around region of interest (Tamil Nadu / South Asia) by default
    zoom = 7,
    volunteers = [],
    disasters = [],
    onLocationSelect = null,
    selectedLocation = null,
    mapLayer = 'osm',
    onMapLayerChange = null,
    showLayerSelector = true,
    showControls = true
}) => {
    const [currentLayer, setCurrentLayer] = useState(mapLayer || 'osm');
    const [layerMenuOpen, setLayerMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Sync layer if controlled externally
    useEffect(() => {
        if (mapLayer && MAP_LAYERS[mapLayer]) {
            setCurrentLayer(mapLayer);
        }
    }, [mapLayer]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setLayerMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLayerChange = (layerKey) => {
        setCurrentLayer(layerKey);
        setLayerMenuOpen(false);
        if (onMapLayerChange) {
            onMapLayerChange(layerKey);
        }
    };

    const validVolunteers = volunteers.filter(v => v.latitude && v.longitude && (v.latitude !== 0 || v.longitude !== 0));
    const validDisasters = disasters.filter(d => d.latitude && d.longitude && (d.latitude !== 0 || d.longitude !== 0));
    const hasPoints = validVolunteers.length > 0 || validDisasters.length > 0;

    const MapBounds = () => {
        const map = useMap();

        useEffect(() => {
            if (!map) return;

            if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
                map.setView([selectedLocation.lat, selectedLocation.lng], 13);
                return;
            }

            const points = [
                ...validVolunteers.map(v => [v.latitude, v.longitude]),
                ...validDisasters.map(d => [d.latitude, d.longitude])
            ];

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
            }
        }, [map, selectedLocation, volunteers, disasters]);

        return null;
    };

    const LocationSelector = () => {
        useMapEvents({
            click(e) {
                if (onLocationSelect) {
                    onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
                }
            },
        });
        return null;
    };

    const activeLayerConfig = MAP_LAYERS[currentLayer] || MAP_LAYERS.osm;

    return (
        <div className="h-full w-full relative group overflow-hidden">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
                className="z-0"
            >
                {/* Dynamically active Tile Layer with OpenStreetMap support */}
                <TileLayer
                    key={activeLayerConfig.id}
                    url={activeLayerConfig.url}
                    attribution={activeLayerConfig.attribution}
                    maxZoom={activeLayerConfig.maxZoom || 19}
                />

                <MapBounds />
                {onLocationSelect && <LocationSelector />}

                {/* Selected Location Target */}
                {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
                        <Popup className="premium-popup">
                            <div className="p-1 min-w-[180px]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block mb-1">Target Entry Point</span>
                                <p className="text-xs text-white font-mono font-bold">
                                    {selectedLocation.lat.toFixed(5)}N, {selectedLocation.lng.toFixed(5)}E
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Volunteer Markers */}
                {validVolunteers.map((v) => (
                    <Marker key={`v-${v.id || v.name}-${v.latitude}`} position={[v.latitude, v.longitude]} icon={volunteerIcon}>
                        <Popup className="premium-popup">
                            <div className="p-1 min-w-[220px]">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30 shrink-0">
                                        {v.name ? v.name[0].toUpperCase() : 'R'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold text-white leading-tight truncate">{v.name || 'Field Responder'}</h3>
                                        <span className={`text-[10px] uppercase font-black ${v.availability === 'available' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                            ● {v.availability || 'available'}
                                        </span>
                                    </div>
                                </div>
                                {v.phone && <p className="text-xs text-gray-300 mb-0.5">📞 {v.phone}</p>}
                                {v.city && <p className="text-xs text-gray-400 mb-1">📍 {v.city}{v.state ? `, ${v.state}` : ''}</p>}
                                <p className="text-xs text-violet-400 font-bold mt-1">⭐ {v.reliability_score || 100}% Reliability</p>
                                {v.skills && v.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {v.skills.slice(0, 3).map((s, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-gray-200 border border-white/10">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Disaster Markers */}
                {validDisasters.map((d) => (
                    <Marker
                        key={`d-${d.id || d.name}-${d.latitude}`}
                        position={[d.latitude, d.longitude]}
                        icon={disasterIcons[d.urgency] || disasterIcons.medium}
                    >
                        <Popup className="premium-popup">
                            <div className="p-1 min-w-[220px]">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="text-sm font-black text-white leading-snug">{d.name}</h3>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                                        d.urgency === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                        d.urgency === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {d.urgency}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 mb-2">📍 {d.city || 'Regional Sector'}, {d.state || ''}</p>
                                <div className="h-px bg-white/10 w-full mb-2" />
                                <p className="text-xs text-gray-300 leading-relaxed max-h-24 overflow-y-auto">{d.description || 'Emergency incident recorded in sector.'}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* In-Map Zoom & Recenter Controls */}
                {showControls && (
                    <MapControls
                        hasPoints={hasPoints}
                        onRecenter={() => {
                            const points = [
                                ...validVolunteers.map(v => [v.latitude, v.longitude]),
                                ...validDisasters.map(d => [d.latitude, d.longitude])
                            ];
                            if (points.length > 0) {
                                // Handled via state trigger or map instance
                            }
                        }}
                    />
                )}
            </MapContainer>

            {/* Floating Layer Switcher HUD */}
            {showLayerSelector && (
                <div ref={menuRef} className="absolute top-6 right-6 z-[400] pointer-events-auto">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-white shadow-2xl hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-xs font-bold"
                            title="Switch OpenStreetMap or Basemap Style"
                        >
                            <span className="text-sm">{activeLayerConfig.icon}</span>
                            <span className="hidden sm:inline font-semibold">{activeLayerConfig.shortName}</span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${layerMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {layerMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-white/15 shadow-2xl z-50 flex flex-col gap-1 text-white"
                                >
                                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Map Engine / View</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                            OSM Supported
                                        </span>
                                    </div>

                                    {Object.values(MAP_LAYERS).map((layer) => (
                                        <button
                                            key={layer.id}
                                            type="button"
                                            onClick={() => handleLayerChange(layer.id)}
                                            className={`flex items-start gap-2.5 text-left p-2.5 rounded-xl transition-all ${
                                                currentLayer === layer.id
                                                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                                                    : 'hover:bg-white/5 border border-transparent text-gray-300 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-base mt-0.5">{layer.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold truncate">{layer.name}</span>
                                                    {currentLayer === layer.id && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0 ml-1"></span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">
                                                    {layer.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
