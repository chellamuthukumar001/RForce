import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import verifyToken from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

dotenv.config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/tasks
 * Create a new task (Admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            disaster_id,
            title,
            description,
            required_skills,
            priority = 'medium',
            status = 'open',
            latitude,
            longitude,
            address
        } = req.body;

        if (!disaster_id || !title) {
            return res.status(400).json({ error: 'Disaster ID and title are required' });
        }

        // Get disaster details for the update
        const { data: disaster, error: disasterError } = await supabase
            .from('disasters')
            .select('name, disaster_type, urgency')
            .eq('id', disaster_id)
            .single();

        if (disasterError) {
            console.error('Disaster lookup error:', disasterError);
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                disaster_id,
                title,
                description,
                required_skills: required_skills || [],
                priority,
                status,
                created_by: req.user.id,
                latitude,
                longitude,
                address
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Automatically create an update for this new task
        try {
            const updateTitle = `New Task Created: ${title}`;
            const updateMessage = `A new ${priority} priority task has been created${disaster ? ` for ${disaster.name}` : ''}: ${description || title}`;

            await supabase
                .from('updates')
                .insert({
                    title: updateTitle,
                    message: updateMessage,
                    priority: priority,
                    category: 'Task Assignment',
                    disaster_id: disaster_id,
                    created_by: req.user.id
                });

            console.log('Auto-created update for new task:', title);
        } catch (updateError) {
            console.error('Failed to create automatic update:', updateError);
            // Don't fail the task creation if update fails
        }

        res.status(201).json({
            message: 'Task created successfully',
            task: data
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

/**
 * GET /api/tasks
 * Get all tasks or tasks by disaster
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { disaster_id, status } = req.query;

        let query = supabase
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
      `);

        if (disaster_id) {
            query = query.eq('disaster_id', disaster_id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ tasks: data });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

/**
 * GET /api/tasks/my-tasks
 * Get tasks assigned to current volunteer
 */
router.get('/my-tasks', verifyToken, async (req, res) => {
    try {
        console.log(`[my-tasks] Fetching tasks for user: ${req.user.id}`);

        // First get volunteer profile
        const { data: volunteer, error: volunteerError } = await supabase
            .from('volunteers')
            .select('id, name, email')
            .eq('profile_id', req.user.id)
            .single();

        if (volunteerError) {
            console.error('[my-tasks] Volunteer lookup error:', volunteerError);
        }

        if (!volunteer) {
            console.log('[my-tasks] No volunteer profile found for user');
            return res.json({ assignments: [] });
        }

        console.log(`[my-tasks] Found volunteer: ${volunteer.id} (${volunteer.name})`);

        // Get assigned tasks with full details
        const { data, error } = await supabase
            .from('task_assignments')
            .select(`
                *,
                tasks (
                    *,
                    disasters (
                        id,
                        name,
                        urgency,
                        city,
                        state,
                        country,
                        latitude,
                        longitude
                    )
                )
            `)
            .eq('volunteer_id', volunteer.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[my-tasks] Task assignments query error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`[my-tasks] Found ${data?.length || 0} assignments`);
        res.json({ assignments: data || [] });
    } catch (error) {
        console.error('[my-tasks] Unexpected error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

/**
 * GET /api/tasks/:id
 * Get task by ID
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        disasters (
          id,
          name,
          urgency,
          latitude,
          longitude,
          city,
          state,
          country
        )
      `)
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task: data });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

/**
 * POST /api/tasks/:id/assign
 * Assign volunteers to a task (Admin only)
 */
router.post('/:id/assign', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { volunteer_ids } = req.body;
        const taskId = req.params.id;

        console.log(`[assign-task] Admin ${req.user.id} assigning task ${taskId} to volunteers:`, volunteer_ids);

        if (!volunteer_ids || !Array.isArray(volunteer_ids)) {
            return res.status(400).json({ error: 'volunteer_ids array is required' });
        }

        // Verify task exists
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('id', taskId)
            .single();

        if (taskError || !task) {
            console.error('[assign-task] Task not found:', taskId);
            return res.status(404).json({ error: 'Task not found' });
        }

        const assignments = volunteer_ids.map(volunteer_id => ({
            task_id: taskId,
            volunteer_id,
            status: 'pending'
        }));

        const { data, error } = await supabase
            .from('task_assignments')
            .insert(assignments)
            .select();

        if (error) {
            console.error('[assign-task] Assignment insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`[assign-task] Successfully created ${data.length} assignments`);

        // Update volunteer's total assigned tasks count (optional, may fail if RPC doesn't exist)
        for (const volunteer_id of volunteer_ids) {
            await supabase.rpc('increment_assigned_tasks', { volunteer_id }).catch(err => {
                console.warn('[assign-task] RPC increment_assigned_tasks failed (non-critical):', err.message);
            });
        }

        res.json({
            message: 'Volunteers assigned successfully',
            assignments: data
        });
    } catch (error) {
        console.error('[assign-task] Unexpected error:', error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
});

/**
 * PATCH /api/tasks/:id/status
 * Update task status (Admin only)
 */
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('tasks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Task status updated',
            task: data
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

/**
 * PATCH /api/tasks/assignments/:assignment_id
 * Accept or decline task assignment (Volunteer)
 */
router.patch('/assignments/:assignment_id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'declined', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get volunteer profile
        const { data: volunteer } = await supabase
            .from('volunteers')
            .select('id')
            .eq('profile_id', req.user.id)
            .single();

        if (!volunteer) {
            return res.status(404).json({ error: 'Volunteer profile not found' });
        }

        const { data, error } = await supabase
            .from('task_assignments')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.assignment_id)
            .eq('volunteer_id', volunteer.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // If completed, increment completed tasks count and reliability score
        if (status === 'completed') {
            // Increment completed tasks
            const { error: rpcError } = await supabase.rpc('increment_completed_tasks', { volunteer_id: volunteer.id });

            // Fallback if RPC doesn't exist or fails (manual update)
            if (rpcError) {
                await supabase.auth.rpc('update_volunteer_reliability', { volunteer_uuid: volunteer.id, score_change: 5 })
                    .catch(async () => {
                        // Fallback to direct update if RPC fails
                        const { data: vData } = await supabase.from('volunteers').select('reliability_score').eq('id', volunteer.id).single();
                        await supabase.from('volunteers').update({ reliability_score: (vData?.reliability_score || 100) + 5 }).eq('id', volunteer.id);
                    });
            } else {
                // Try updating reliability via RPC
                await supabase.rpc('update_volunteer_reliability', { volunteer_uuid: volunteer.id, score_change: 5 })
                    .catch(async () => {
                        // Fallback to direct update
                        const { data: vData } = await supabase.from('volunteers').select('reliability_score').eq('id', volunteer.id).single();
                        await supabase.from('volunteers').update({ reliability_score: (vData?.reliability_score || 100) + 5 }).eq('id', volunteer.id);
                    });
            }
        }

        res.json({
            message: 'Assignment updated',
            assignment: data
        });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
});

export default router;
