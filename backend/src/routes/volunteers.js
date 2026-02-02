import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import verifyToken from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import { geocodeLocation } from '../services/geocoding.js';

dotenv.config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/volunteers
 * Create or update volunteer profile
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            skills,
            availability,
            city,
            state,
            country
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Geocode location
        let coordinates = { lat: 0, lng: 0 };
        if (city || state || country) {
            try {
                coordinates = await geocodeLocation(city, state, country);
            } catch (error) {
                console.error('Geocoding failed:', error);
                // Continue with default coordinates
            }
        }

        // Check if volunteer profile exists
        const { data: existing } = await supabase
            .from('volunteers')
            .select('*')
            .eq('profile_id', req.user.id)
            .single();

        let result;
        if (existing) {
            // Update existing profile
            result = await supabase
                .from('volunteers')
                .update({
                    name,
                    email,
                    phone,
                    skills: skills || [],
                    availability: availability || 'available',
                    city,
                    state,
                    country,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng,
                    updated_at: new Date().toISOString()
                })
                .eq('profile_id', req.user.id)
                .select()
                .single();
        } else {
            // Create new profile
            result = await supabase
                .from('volunteers')
                .insert({
                    profile_id: req.user.id,
                    name,
                    email,
                    phone,
                    skills: skills || [],
                    availability: availability || 'available',
                    city,
                    state,
                    country,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng,
                    completed_tasks: 0,
                    total_assigned_tasks: 0,
                    reliability_score: 100
                })
                .select()
                .single();
        }

        if (result.error) {
            return res.status(400).json({ error: result.error.message });
        }

        res.json({
            message: existing ? 'Profile updated' : 'Profile created',
            volunteer: result.data
        });
    } catch (error) {
        console.error('Volunteer profile error:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

/**
 * GET /api/volunteers
 * Get all volunteers (Admin only)
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { data: volunteers, error } = await supabase
            .from('volunteers')
            .select(`
                *,
                profiles (
                    full_name,
                    email,
                    phone,
                    role,
                    last_login
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Transform data to flatten structure
        const transformedVolunteers = volunteers.map(v => ({
            ...v,
            name: v.profiles?.full_name || 'Unknown',
            email: v.profiles?.email || 'N/A',
            phone: v.profiles?.phone || v.phone, // Fallback to volunteer phone if profile phone missing
            last_login: v.profiles?.last_login || null
        }));

        res.json({ volunteers: transformedVolunteers });
    } catch (error) {
        console.error('Get volunteers error:', error);
        res.status(500).json({ error: 'Failed to fetch volunteers' });
    }
});

/**
 * GET /api/volunteers/me
 * Get current user's volunteer profile
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('volunteers')
            .select('*')
            .eq('profile_id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ volunteer: data });
    } catch (error) {
        console.error('Get volunteer error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * GET /api/volunteers/:id
 * Get volunteer by ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('volunteers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }

        res.json({ volunteer: data });
    } catch (error) {
        console.error('Get volunteer error:', error);
        res.status(500).json({ error: 'Failed to fetch volunteer' });
    }
});

/**
 * PATCH /api/volunteers/availability
 * Update volunteer availability
 */
router.patch('/availability', verifyToken, async (req, res) => {
    try {
        const { availability } = req.body;

        if (!['available', 'busy', 'offline'].includes(availability)) {
            return res.status(400).json({ error: 'Invalid availability status' });
        }

        const { data, error } = await supabase
            .from('volunteers')
            .update({ availability })
            .eq('profile_id', req.user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Availability updated',
            volunteer: data
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

export default router;
