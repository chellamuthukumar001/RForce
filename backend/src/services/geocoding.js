/**
 * Geocoding service to convert city/state/country to latitude/longitude
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

/**
 * Convert location string to coordinates
 * @param {string} city - City name
 * @param {string} state - State name
 * @param {string} country - Country name
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
export async function geocodeLocation(city, state, country) {
    try {
        // Build query string
        let query = [];
        if (city) query.push(city);
        if (state) query.push(state);
        if (country) query.push(country);

        const locationString = query.join(', ');

        if (!locationString) {
            throw new Error('Location information is required');
        }

        // Use Nominatim API (OpenStreetMap)
        const encodedLocation = encodeURIComponent(locationString);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DisasterVolunteerApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('Location not found');
        }

        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export default { geocodeLocation, calculateDistance };
