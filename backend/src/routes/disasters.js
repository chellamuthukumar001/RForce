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
 * POST /api/disasters
 * Create a new disaster event (Admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            urgency,
            city,
            state,
            country,
            disaster_type,
            status = 'active'
        } = req.body;

        // Support both 'type' and 'disaster_type' from frontend for backward compatibility
        const dType = disaster_type || req.body.type;

        if (!name || !urgency || !dType) {
            return res.status(400).json({ error: 'Name, urgency, and disaster_type are required' });
        }

        if (!['critical', 'high', 'medium', 'low'].includes(urgency)) {
            return res.status(400).json({ error: 'Invalid urgency level' });
        }

        // Geocode location
        let coordinates = { lat: 0, lng: 0 };
        if (city || state || country) {
            try {
                coordinates = await geocodeLocation(city, state, country);
            } catch (error) {
                console.error('Geocoding failed:', error);
            }
        }

        const { data, error } = await supabase
            .from('disasters')
            .insert({
                name,
                description,
                urgency,
                disaster_type: dType,
                city,
                state,
                country,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                status,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: 'Disaster created successfully',
            disaster: data
        });
    } catch (error) {
        console.error('Create disaster error:', error);
        res.status(500).json({ error: 'Failed to create disaster' });
    }
});

/**
 * GET /api/disasters
 * Get all disasters
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('disasters')
            .select('*');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ disasters: data });
    } catch (error) {
        console.error('Get disasters error:', error);
        res.status(500).json({ error: 'Failed to fetch disasters' });
    }
});

/**
 * GET /api/disasters/:id
 * Get disaster by ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('disasters')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Disaster not found' });
        }

        res.json({ disaster: data });
    } catch (error) {
        console.error('Get disaster error:', error);
        res.status(500).json({ error: 'Failed to fetch disaster' });
    }
});

/**
 * PATCH /api/disasters/:id
 * Update disaster status (Admin only)
 */
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'resolved', 'monitoring'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('disasters')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Disaster updated',
            disaster: data
        });
    } catch (error) {
        console.error('Update disaster error:', error);
        res.status(500).json({ error: 'Failed to update disaster' });
    }
});

/**
 * DELETE /api/disasters/:id
 * Delete disaster (Admin only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('disasters')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Disaster deleted successfully' });
    } catch (error) {
        console.error('Delete disaster error:', error);
        res.status(500).json({ error: 'Failed to delete disaster' });
    }
});

export default router;
