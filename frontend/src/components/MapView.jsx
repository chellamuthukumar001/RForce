import React, { useState, useEffect } from 'react';
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

// Premium Marker Icons with Glowing Effects
const createPremiumIcon = (color, isDisaster = false) => {
    const size = isDisaster ? 32 : 24;
    const pulseClass = isDisaster ? 'animate-ping' : '';

    return L.divIcon({
        className: 'premium-marker',
        html: `
            <div class="relative flex items-center justify-center">
                ${isDisaster ? `<div class="absolute w-full h-full rounded-full bg-${color}-500 opacity-20 animate-ping"></div>` : ''}
                <div class="relative z-10 w-[${size}px] h-[${size}px] rounded-full bg-white flex items-center justify-center border-4 border-${color}-500 shadow-xl shadow-${color}-500/40 transition-transform active:scale-90">
                    <div class="w-full h-full rounded-full bg-${color}-500 opacity-80"></div>
                </div>
                ${isDisaster ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>` : ''}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
};

// Simplified icon generator because tailwind classes in innerHTML are tricky
const iconHtml = (color, size, isPing = false) => {
    return `
        <div style="position: relative; display: flex; align-items: center; justify-center: center; width: ${size}px; height: ${size}px;">
            ${isPing ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="position: relative; z-index: 10; width: 100%; height: 100%; border-radius: 50%; background-color: white; border: 3.5px solid ${color}; box-shadow: 0 10px 15px -3px ${color}44; display: flex; align-items: center; justify-content: center;">
                <div style="width: 60%; height: 60%; border-radius: 50%; background-color: ${color}; opacity: 0.8;"></div>
            </div>
        </div>
        <style>
            @keyframes ping {
                75%, 100% { transform: scale(2.5); opacity: 0; }
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

const MapView = ({
    center = [37.7749, -122.4194],
    zoom = 10,
    volunteers = [],
    disasters = [],
    onLocationSelect = null,
    selectedLocation = null
}) => {

    const MapBounds = () => {
        const map = useMap();
        useEffect(() => {
            if (!map) return;
            if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
                map.setView([selectedLocation.lat, selectedLocation.lng], 13);
                return;
            }
            const points = [
                ...volunteers.filter(v => v.latitude && v.longitude).map(v => [v.latitude, v.longitude]),
                ...disasters.filter(d => d.latitude && d.longitude).map(d => [d.latitude, d.longitude])
            ];
            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [100, 100] });
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

    return (
        <div className="h-full w-full relative group">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
                className="z-0"
            >
                {/* Premium Dark Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapBounds />
                {onLocationSelect && <LocationSelector />}

                {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
                        <Popup className="premium-popup">Target Entry Point</Popup>
                    </Marker>
                )}

                {volunteers.map((v) => (
                    v.latitude && v.longitude && (
                        <Marker key={`v-${v.id}`} position={[v.latitude, v.longitude]} icon={volunteerIcon}>
                            <Popup className="premium-popup">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                                            {v.name ? v.name[0].toUpperCase() : 'R'}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 leading-tight">{v.name || 'Field Responder'}</h3>
                                            <span className={`text-[10px] uppercase font-black ${v.availability === 'available' ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                ● {v.availability || 'available'}
                                            </span>
                                        </div>
                                    </div>
                                    {v.phone && <p className="text-xs text-gray-600">📞 {v.phone}</p>}
                                    {v.city && <p className="text-xs text-gray-500">📍 {v.city}{v.state ? `, ${v.state}` : ''}</p>}
                                    <p className="text-xs text-violet-600 font-bold mt-1">⭐ {v.reliability_score || 100}% Reliability</p>
                                    {v.skills && v.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {v.skills.slice(0, 3).map(s => (
                                                <span key={s} className="px-1.5 py-0.5 rounded bg-gray-100 text-[9px] font-bold text-gray-600">{s}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}


                {disasters.map((d) => (
                    d.latitude && d.longitude && (
                        <Marker key={`d-${d.id}`} position={[d.latitude, d.longitude]} icon={disasterIcons[d.urgency] || disasterIcons.medium}>
                            <Popup className="premium-popup">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-gray-900 leading-none">{d.name}</h3>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-red-100 text-red-600`}>
                                            {d.urgency}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 mb-2">{d.city}, {d.state}</p>
                                    <div className="h-px bg-gray-100 w-full mb-3" />
                                    <p className="text-sm text-gray-600 leading-relaxed truncate-2-lines">{d.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
