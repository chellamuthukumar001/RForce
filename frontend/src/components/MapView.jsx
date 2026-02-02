import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const volunteerIcon = createCustomIcon('#3b82f6'); // Blue for volunteers
const disasterCriticalIcon = createCustomIcon('#dc2626'); // Red for critical
const disasterHighIcon = createCustomIcon('#f59e0b'); // Orange for high
const disasterMediumIcon = createCustomIcon('#3b82f6'); // Blue for medium
const disasterLowIcon = createCustomIcon('#6b7280'); // Gray for low
const selectedLocationIcon = createCustomIcon('#8b5cf6'); // Purple for selected location

const MapView = ({
    center = [37.7749, -122.4194],
    zoom = 10,
    volunteers = [],
    disasters = [],
    onLocationSelect = null,
    selectedLocation = null
}) => {

    // Component to handle map bounds updates
    const MapBounds = () => {
        const map = useMap();

        useEffect(() => {
            if (!map) return;

            // If selecting location and have one, focus on it
            if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
                map.setView([selectedLocation.lat, selectedLocation.lng], 13);
                return;
            }

            const points = [
                ...volunteers.filter(v => v.latitude && v.longitude && (v.latitude !== 0 || v.longitude !== 0)).map(v => [v.latitude, v.longitude]),
                ...disasters.filter(d => d.latitude && d.longitude && (d.latitude !== 0 || d.longitude !== 0)).map(d => [d.latitude, d.longitude])
            ];

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }, [map, selectedLocation, volunteers, disasters]);

        return null;
    };

    // Handle map clicks for location selection
    const LocationSelector = () => {
        useMapEvents({
            click(e) {
                if (onLocationSelect) {
                    onLocationSelect({
                        lat: e.latlng.lat,
                        lng: e.latlng.lng
                    });
                }
            },
        });
        return null;
    };

    const getDisasterIcon = (urgency) => {
        const icons = {
            critical: disasterCriticalIcon,
            high: disasterHighIcon,
            medium: disasterMediumIcon,
            low: disasterLowIcon
        };
        return icons[urgency] || disasterMediumIcon;
    };

    return (
        <div className="h-full w-full rounded-lg overflow-hidden shadow-lg">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBounds />
                {onLocationSelect && <LocationSelector />}

                {/* Selected Location Marker */}
                {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
                    <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                        icon={selectedLocationIcon}
                    >
                        <Popup>Selected Task Location</Popup>
                    </Marker>
                )}

                {/* Volunteer markers */}
                {volunteers.map((volunteer) => (
                    volunteer.latitude && volunteer.longitude && (
                        <Marker
                            key={`volunteer-${volunteer.id}`}
                            position={[volunteer.latitude, volunteer.longitude]}
                            icon={volunteerIcon}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                                    <p className="text-sm text-gray-600">Volunteer</p>
                                    <p className="text-sm mt-1">
                                        <span className={`inline-block px-2 py-1 rounded text-xs ${volunteer.availability === 'available' ? 'bg-green-100 text-green-800' :
                                            volunteer.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {volunteer.availability}
                                        </span>
                                    </p>
                                    {volunteer.skills && volunteer.skills.length > 0 && (
                                        <p className="text-xs mt-1 text-gray-600">
                                            Skills: {volunteer.skills.slice(0, 2).join(', ')}
                                            {volunteer.skills.length > 2 && '...'}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Disaster markers */}
                {disasters.map((disaster) => (
                    disaster.latitude && disaster.longitude && (
                        <Marker
                            key={`disaster-${disaster.id}`}
                            position={[disaster.latitude, disaster.longitude]}
                            icon={getDisasterIcon(disaster.urgency)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-semibold text-lg">{disaster.name}</h3>
                                    <p className="text-sm text-gray-600">{disaster.city}, {disaster.state}</p>
                                    <p className="text-sm mt-1">
                                        <span className={`badge-${disaster.urgency}`}>
                                            {disaster.urgency} urgency
                                        </span>
                                    </p>
                                    {disaster.description && (
                                        <p className="text-xs mt-2 text-gray-600">{disaster.description}</p>
                                    )}
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
