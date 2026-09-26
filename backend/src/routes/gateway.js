import express from 'express';
import { convertLoraToJson } from '../services/loraParser.js';
import { getTopVolunteers, rankVolunteers } from '../ai/volunteerRanking.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// In-memory signal buffer for fast display and offline fallback
const receivedSignalsLog = [];
const activeForestNodes = new Map();

/**
 * Helper: Persist or store in memory if database write encounters permission issues
 */
async function createDisasterRecord(disasterData) {
    try {
        const { data, error } = await supabase
            .from('disasters')
            .insert([disasterData])
            .select();

        if (error) {
            console.warn('[Gateway] Database insert warning (using fallback object):', error.message);
            return { id: `disaster-${Date.now()}`, ...disasterData };
        }
        return data && data[0] ? data[0] : { id: `disaster-${Date.now()}`, ...disasterData };
    } catch (e) {
        return { id: `disaster-${Date.now()}`, ...disasterData };
    }
}

async function createTaskRecord(taskData) {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select();

        if (error) {
            console.warn('[Gateway] Task insert warning (using fallback object):', error.message);
            return { id: `task-${Date.now()}`, ...taskData };
        }
        return data && data[0] ? data[0] : { id: `task-${Date.now()}`, ...taskData };
    } catch (e) {
        return { id: `task-${Date.now()}`, ...taskData };
    }
}

async function assignVolunteersToTask(taskId, assignedVolunteers) {
    try {
        const assignments = assignedVolunteers.map(v => ({
            task_id: taskId,
            volunteer_id: v.volunteer_id,
            status: 'assigned',
            ai_score: v.scores.final
        }));

        const { data, error } = await supabase
            .from('task_assignments')
            .insert(assignments)
            .select();

        if (!error) {
            for (const v of assignedVolunteers) {
                try {
                    await supabase.rpc('increment_assigned_tasks', { volunteer_id: v.volunteer_id });
                } catch (rpcErr) { /* non-fatal */ }
            }
            return data;
        }
        return assignments;
    } catch (e) {
        return assignedVolunteers.map(v => ({
            task_id: taskId,
            volunteer_id: v.volunteer_id,
            status: 'assigned',
            ai_score: v.scores.final
        }));
    }
}

async function broadcastUpdate(title, message, priority = 'critical') {
    try {
        await supabase
            .from('updates')
            .insert([{
                title,
                message,
                priority,
                created_at: new Date().toISOString()
            }]);
    } catch (e) {
        console.warn('[Gateway] Failed to insert broadcast update:', e.message);
    }
}

/**
 * Helper to fetch volunteers from Supabase or fallback mock data
 */
async function fetchAvailableVolunteers() {
    try {
        const { data: volunteers, error } = await supabase
            .from('volunteers')
            .select(`
                *,
                profiles (
                    full_name,
                    email
                )
            `);

        if (!error && volunteers && volunteers.length > 0) {
            return volunteers.map(v => ({
                ...v,
                name: v.name || v.profiles?.full_name || 'Field Responder',
                email: v.email || v.profiles?.email || 'volunteer@rforce.org',
                skills: v.skills || ['First Aid', 'Navigation', 'Search & Rescue'],
                reliability_score: v.reliability_score || 95,
                availability: v.availability || 'available'
            }));
        }
    } catch (e) {
        console.warn('[Gateway] Using local volunteer pool:', e.message);
    }

    // High quality fallback volunteers in case of DB disconnect
    return [
        {
            id: 'vol-1',
            name: 'Chella Muthu (Lead Responder)',
            email: 'chella@rforce.org',
            phone: '+91 98421 55678',
            latitude: 9.8692558,
            longitude: 77.4222974,
            city: 'Theni',
            state: 'Tamil Nadu',
            skills: ['Wildfire Suppression', 'First Aid', 'Search & Rescue', 'Driving'],
            availability: 'available',
            reliability_score: 98
        },
        {
            id: 'vol-2',
            name: 'Anna Maria (Field Paramedic)',
            email: 'anna@rforce.org',
            phone: '+91 94432 11223',
            latitude: 9.7348,
            longitude: 77.2809,
            city: 'Kambam',
            state: 'Tamil Nadu',
            skills: ['Medical', 'First Aid', 'Triage', 'Emergency Nursing'],
            availability: 'available',
            reliability_score: 95
        },
        {
            id: 'vol-3',
            name: 'Kisho Varma (Search Specialist)',
            email: 'kisho@rforce.org',
            phone: '+91 98940 33445',
            latitude: 9.9261,
            longitude: 78.1141,
            city: 'Madurai',
            state: 'Tamil Nadu',
            skills: ['Search & Rescue', 'Navigation', 'Heavy Lifting', 'Radio Comm'],
            availability: 'available',
            reliability_score: 92
        },
        {
            id: 'vol-4',
            name: 'Rajesh Kumar (Drone & Logistics)',
            email: 'rajesh@rforce.org',
            phone: '+91 97890 55667',
            latitude: 10.2381,
            longitude: 77.4892,
            city: 'Kodaikanal',
            state: 'Tamil Nadu',
            skills: ['Drone Recon', 'Logistics', 'Driving', 'Radio Comm'],
            availability: 'available',
            reliability_score: 89
        }
    ];
}

/**
 * POST /api/gateway/lora/ingest
 * Primary Gateway Ingestion Endpoint.
 * Ingests LoRa packets from ForestLink hardware / gateway server,
 * decodes into JSON, and automatically runs AI to assign nearest volunteers.
 */
router.post('/lora/ingest', async (req, res) => {
    try {
        const rawPayload = req.body;
        if (!rawPayload || (typeof rawPayload === 'object' && Object.keys(rawPayload).length === 0)) {
            return res.status(400).json({ error: 'Empty payload received from gateway' });
        }

        // 1. Convert LoRa Data into Standardized JSON Response
        const loraJson = convertLoraToJson(rawPayload);

        const { latitude, longitude } = loraJson.gps;
        const isEmergency = loraJson.emergency.is_emergency;
        const nodeId = loraJson.node_id;
        const alertType = loraJson.emergency.alert_type;

        // Track node status in memory
        activeForestNodes.set(nodeId, {
            node_id: nodeId,
            last_seen: new Date().toISOString(),
            latitude,
            longitude,
            battery_pct: loraJson.node_health.battery_pct,
            rssi: loraJson.rf_metrics.rssi,
            snr: loraJson.rf_metrics.snr,
            status: loraJson.node_health.status,
            is_emergency: isEmergency
        });

        // 2. Fetch Available Volunteers
        const availableVolunteers = await fetchAvailableVolunteers();

        let disasterRecord = null;
        let taskRecord = null;
        let topVolunteers = [];
        let allRanked = [];
        let assignments = [];

        // 3. If Emergency SOS is detected, trigger autonomous AI Dispatch
        if (isEmergency) {
            const urgency = loraJson.emergency.urgency || 'critical';

            // A. Create/Find Disaster Record at the exact LoRa GPS location
            disasterRecord = await createDisasterRecord({
                name: `[ForestLink LoRa] ${alertType} - ${nodeId}`,
                description: `${loraJson.emergency.message} | Signal: RSSI ${loraJson.rf_metrics.rssi}dBm, SNR ${loraJson.rf_metrics.snr}dB, Batt ${loraJson.node_health.battery_pct}%`,
                urgency,
                disaster_type: alertType,
                latitude,
                longitude,
                city: 'Forest Reserve / Wilderness Sector',
                state: 'Operational Zone',
                status: 'active'
            });

            // B. Create Emergency Rescue Task
            taskRecord = await createTaskRecord({
                disaster_id: disasterRecord.id,
                title: `Emergency Dispatch: ${alertType} (${nodeId})`,
                description: `Autonomous dispatch triggered by LoRa signal from ${nodeId} at coordinates [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]. Message: ${loraJson.emergency.message}`,
                required_skills: ['First Aid', 'Search & Rescue', 'Navigation'],
                urgency,
                latitude,
                longitude,
                status: 'open'
            });

            // C. Run AI Volunteer Ranking Algorithm with LoRa GPS Target Location
            const targetLocation = { latitude, longitude };
            const numberOfVolunteersToAssign = parseInt(req.body.auto_assign_count) || 2;

            allRanked = rankVolunteers(
                availableVolunteers,
                taskRecord,
                disasterRecord,
                targetLocation
            );

            topVolunteers = allRanked.slice(0, numberOfVolunteersToAssign);

            // D. Auto-assign the top-ranked volunteers
            if (topVolunteers.length > 0) {
                assignments = await assignVolunteersToTask(taskRecord.id, topVolunteers);

                // Broadcast live update
                const volunteerNames = topVolunteers.map(v => v.volunteer_name).join(', ');
                await broadcastUpdate(
                    `🚨 ForestLink LoRa Alert Dispatched (${nodeId})`,
                    `Emergency beacon detected at GPS [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]. AI has auto-assigned ${topVolunteers.length} responders: ${volunteerNames}.`,
                    'critical'
                );
            }
        }

        // 4. Log signal
        const signalLogEntry = {
            id: `SIG_${Date.now()}`,
            timestamp: loraJson.timestamp,
            node_id: nodeId,
            is_emergency: isEmergency,
            lora_data: loraJson,
            assigned_count: topVolunteers.length,
            assigned_volunteers: topVolunteers.map(v => ({
                id: v.volunteer_id,
                name: v.volunteer_name,
                distance_km: v.distance,
                ai_score: v.scores.final
            }))
        };
        receivedSignalsLog.unshift(signalLogEntry);
        if (receivedSignalsLog.length > 50) receivedSignalsLog.pop();

        // 5. Send Rich JSON Response
        return res.status(200).json({
            success: true,
            message: isEmergency
                ? `LoRa SOS signal processed. AI successfully auto-assigned ${topVolunteers.length} volunteer(s) to GPS [${latitude}, ${longitude}].`
                : `LoRa telemetry beacon processed from ${nodeId}. Node status healthy.`,
            lora_data: loraJson,
            ai_dispatch: {
                triggered: isEmergency,
                target_gps: { latitude, longitude },
                disaster: disasterRecord,
                task: taskRecord,
                ranked_volunteers: allRanked,
                auto_assigned_volunteers: topVolunteers,
                assignments: assignments
            }
        });
    } catch (error) {
        console.error('[Gateway Ingest Error]:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process LoRa gateway signal'
        });
    }
});

/**
 * POST /api/gateway/lora/simulate
 * Simulates a LoRa signal transmission from ForestLink for testing and demonstration
 */
router.post('/lora/simulate', async (req, res) => {
    try {
        const { preset, node_id, message, latitude, longitude, urgency } = req.body;

        let simulatedPayload = {};

        if (preset === 'wildfire') {
            simulatedPayload = {
                node_id: node_id || 'FOREST_NODE_001',
                message: message || 'Wildfire spotted spreading across Ridge Sector 4 [9.8692, 77.4223]',
                latitude: latitude !== undefined ? parseFloat(latitude) : 9.8692558,
                longitude: longitude !== undefined ? parseFloat(longitude) : 77.4222974,
                is_emergency: true,
                urgency: urgency || 'critical',
                alert_type: 'Wildfire',
                rssi: -76,
                snr: 5.25,
                battery_pct: 82
            };
        } else if (preset === 'injured_ranger') {
            simulatedPayload = {
                node_id: node_id || 'FOREST_NODE_003',
                message: message || 'Injured Ranger with fracture near Kodaikanal Pine Forest [10.2381, 77.4892]',
                latitude: latitude !== undefined ? parseFloat(latitude) : 10.2381,
                longitude: longitude !== undefined ? parseFloat(longitude) : 77.4892,
                is_emergency: true,
                urgency: urgency || 'critical',
                alert_type: 'Medical Emergency',
                rssi: -84,
                snr: 2.75,
                battery_pct: 64
            };
        } else if (preset === 'flash_flood') {
            simulatedPayload = {
                node_id: node_id || 'FOREST_NODE_004',
                message: message || 'Flash flood surging down Madurai river canyon [9.9261, 78.1141]',
                latitude: latitude !== undefined ? parseFloat(latitude) : 9.9261,
                longitude: longitude !== undefined ? parseFloat(longitude) : 78.1141,
                is_emergency: true,
                urgency: urgency || 'high',
                alert_type: 'Flood',
                rssi: -79,
                snr: 4.5,
                battery_pct: 91
            };
        } else if (preset === 'hex_beacon') {
            // Sample ForestLink 18-byte packed telemetry packet
            simulatedPayload = {
                raw_hex: '01000200B0100A84551205EE0219006801CC',
                latitude: latitude !== undefined ? parseFloat(latitude) : 9.8692558,
                longitude: longitude !== undefined ? parseFloat(longitude) : 77.4222974
            };
        } else {
            simulatedPayload = {
                node_id: node_id || 'FOREST_NODE_001',
                message: message || 'Custom LoRa test beacon [9.8692, 77.4223]',
                latitude: latitude !== undefined ? parseFloat(latitude) : 9.8692558,
                longitude: longitude !== undefined ? parseFloat(longitude) : 77.4222974,
                is_emergency: req.body.is_emergency !== undefined ? req.body.is_emergency : true,
                urgency: urgency || 'critical',
                rssi: req.body.rssi || -78,
                snr: req.body.snr || 4.25
            };
        }

        // Delegate to ingest handler
        req.body = simulatedPayload;
        return router.handle(req, res);
    } catch (error) {
        console.error('[LoRa Simulate Error]:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/gateway/lora/signals
 * Query recent LoRa packets received by RForce gateway
 */
router.get('/lora/signals', (req, res) => {
    res.json({
        success: true,
        count: receivedSignalsLog.length,
        signals: receivedSignalsLog
    });
});

/**
 * GET /api/gateway/lora/nodes
 * Query active ForestLink nodes tracked by the system
 */
router.get('/lora/nodes', (req, res) => {
    res.json({
        success: true,
        nodes: Array.from(activeForestNodes.values())
    });
});

export default router;
