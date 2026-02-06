import express from 'express';
import dotenv from 'dotenv';
import verifyToken from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import supabase from '../config/supabase.js';

dotenv.config();

const router = express.Router();

/**
 * POST /api/updates
 * Create a new update (Admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            message,
            priority,
            category,
            disaster_id
        } = req.body;

        if (!title || !message || !priority) {
            return res.status(400).json({ error: 'Title, message, and priority are required' });
        }

        const { data, error } = await supabase
            .from('updates')
            .insert({
                title,
                message,
                priority,
                category: category || 'General',
                disaster_id,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: 'Update published successfully',
            update: data
        });
    } catch (error) {
        console.error('Create update error:', error);
        res.status(500).json({ error: 'Failed to publish update' });
    }
});

/**
 * GET /api/updates
 * Get all updates
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { priority, category } = req.query;

        let query = supabase
            .from('updates')
            .select(`
                *,
                disasters (
                    id,
                    name,
                    disaster_type,
                    urgency,
                    status,
                    city,
                    state,
                    country,
                    latitude,
                    longitude
                )
            `);

        if (priority) {
            query = query.eq('priority', priority);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ updates: data });
    } catch (error) {
        console.error('Get updates error:', error);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

/**
 * DELETE /api/updates/:id
 * Delete update (Admin only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('updates')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Update deleted successfully' });
    } catch (error) {
        console.error('Delete update error:', error);
        res.status(500).json({ error: 'Failed to delete update' });
    }
});

export default router;
