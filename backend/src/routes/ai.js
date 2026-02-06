import express from 'express';
import dotenv from 'dotenv';
import verifyToken from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import { getTopVolunteers } from '../ai/volunteerRanking.js';
import supabase from '../config/supabase.js';

dotenv.config();

const router = express.Router();

/**
 * POST /api/ai/rank-volunteers
 * Get AI-ranked volunteers for a specific task (Admin only)
 */
router.post('/rank-volunteers', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { task_id, top_n = 5 } = req.body;

        if (!task_id) {
            return res.status(400).json({ error: 'task_id is required' });
        }

        // Get task details with disaster information
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select(`
        *,
        disasters (
          id,
          name,
          urgency,
          latitude,
          longitude
        )
      `)
            .eq('id', task_id)
            .single();

        if (taskError || !task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Determine target location (Task location > Disaster location)
        const targetLocation = {
            latitude: task.latitude || task.disasters?.latitude,
            longitude: task.longitude || task.disasters?.longitude
        };

        if (!targetLocation.latitude || !targetLocation.longitude) {
            console.warn(`Task ${task_id} has no location data (neither task nor disaster specific)`);
            // We can still proceed but distance scores will be 0 or invalid
        }

        if (!task.disasters) {
            return res.status(400).json({ error: 'Disaster information not found' });
        }

        // Get all available volunteers with profile info
        const { data: volunteers, error: volunteersError } = await supabase
            .from('volunteers')
            .select(`
                *,
                profiles (
                    full_name,
                    email
                )
            `);

        if (volunteersError) {
            return res.status(400).json({ error: volunteersError.message });
        }

        if (!volunteers || volunteers.length === 0) {
            return res.json({
                message: 'No volunteers available',
                ranked_volunteers: []
            });
        }

        // Transform volunteers to include name/email from profile
        const volunteersWithProfile = volunteers.map(v => ({
            ...v,
            name: v.profiles?.full_name || 'Volunteer',
            email: v.profiles?.email
        }));

        // Run AI ranking algorithm
        const rankedVolunteers = getTopVolunteers(
            volunteersWithProfile,
            task,
            task.disasters,
            parseInt(top_n),
            targetLocation // Pass the specific target location
        );

        res.json({
            message: 'Volunteers ranked successfully',
            task_id: task.id,
            task_title: task.title,
            disaster: {
                name: task.disasters.name,
                urgency: task.disasters.urgency
            },
            ranked_volunteers: rankedVolunteers,
            total_volunteers: volunteers.length
        });
    } catch (error) {
        console.error('Rank volunteers error:', error);
        res.status(500).json({ error: 'Failed to rank volunteers' });
    }
});

/**
 * POST /api/ai/auto-assign
 * Automatically assign top-ranked volunteers to a task (Admin only)
 */
router.post('/auto-assign', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { task_id, number_of_volunteers = 3 } = req.body;

        if (!task_id) {
            return res.status(400).json({ error: 'task_id is required' });
        }

        // Get task details with disaster information
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select(`
        *,
        disasters (
          id,
          name,
          urgency,
          latitude,
          longitude
        )
      `)
            .eq('id', task_id)
            .single();

        if (taskError || !task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Determine target location
        const targetLocation = {
            latitude: task.latitude || task.disasters?.latitude,
            longitude: task.longitude || task.disasters?.longitude
        };

        // Get available volunteers
        const { data: volunteers } = await supabase
            .from('volunteers')
            .select(`
                *,
                profiles (
                    full_name,
                    email
                )
            `)
            .eq('availability', 'available');

        if (!volunteers || volunteers.length === 0) {
            return res.status(404).json({ error: 'No available volunteers found' });
        }

        // Transform volunteers
        const volunteersWithProfile = volunteers.map(v => ({
            ...v,
            name: v.profiles?.full_name || 'Volunteer',
            email: v.profiles?.email
        }));

        // Get top volunteers using AI
        const topVolunteers = getTopVolunteers(
            volunteersWithProfile,
            task,
            task.disasters,
            parseInt(number_of_volunteers),
            targetLocation
        );

        if (topVolunteers.length === 0) {
            return res.status(404).json({ error: 'No suitable volunteers found' });
        }

        // Create assignments
        const assignments = topVolunteers.map(v => ({
            task_id: task.id,
            volunteer_id: v.volunteer_id,
            status: 'pending',
            ai_score: v.scores.final
        }));

        const { data: assignmentData, error: assignError } = await supabase
            .from('task_assignments')
            .insert(assignments)
            .select();

        if (assignError) {
            return res.status(400).json({ error: assignError.message });
        }

        // Update volunteer assigned task counts
        for (const volunteer of topVolunteers) {
            await supabase.rpc('increment_assigned_tasks', {
                volunteer_id: volunteer.volunteer_id
            });
        }

        res.json({
            message: 'Task auto-assigned successfully',
            task_id: task.id,
            assigned_volunteers: topVolunteers,
            assignments: assignmentData
        });
    } catch (error) {
        console.error('Auto-assign error:', error);
        res.status(500).json({ error: 'Failed to auto-assign task' });
    }
});

export default router;
