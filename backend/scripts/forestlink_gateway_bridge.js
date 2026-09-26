/**
 * ForestLink to RForce LoRa Gateway Serial Bridge
 * 
 * Reads raw LoRa packets (TLM|..., SOS|..., or ASCII) from an ESP32-S3 Gateway
 * connected over USB Serial Port, converts and forwards them directly to the
 * RForce backend endpoint: /api/gateway/lora/ingest.
 * 
 * Usage:
 *   node forestlink_gateway_bridge.js COM3 http://localhost:5000
 */

import fetch from 'node-fetch';

const SERIAL_PORT = process.argv[2] || process.env.SERIAL_PORT || 'COM3';
const RFORCE_API_URL = process.argv[3] || process.env.RFORCE_API_URL || 'http://localhost:5000/api/gateway/lora/ingest';

console.log('🌲 ForestLink <-> RForce LoRa Gateway Bridge');
console.log(`📡 Serial Port Target: ${SERIAL_PORT}`);
console.log(`🌐 RForce Ingest Endpoint: ${RFORCE_API_URL}\n`);

async function forwardLoraPacket(rawPacket) {
    try {
        console.log(`[LoRa RX] Incoming: ${rawPacket}`);

        const response = await fetch(RFORCE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'esp32_serial_gateway',
                raw_payload: rawPacket,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('✅ [RForce Forwarded Successfully]');
            console.log('   Decoded Node:', data.lora_data?.node_id);
            console.log('   GPS Location:', data.lora_data?.gps?.latitude, data.lora_data?.gps?.longitude);
            if (data.ai_dispatch?.triggered) {
                console.log(`🚨 [AI Auto-Assigned] ${data.ai_dispatch.auto_assigned_volunteers?.length || 0} volunteers`);
                for (const v of (data.ai_dispatch.auto_assigned_volunteers || [])) {
                    console.log(`   - ${v.volunteer_name} (${v.distance} km away, Score: ${v.scores?.final}%)`);
                }
            }
        } else {
            console.error('❌ [Forwarding Error]:', data.error || data);
        }
    } catch (err) {
        console.error('❌ [Connection Error to RForce API]:', err.message);
    }
}

// Optional SerialPort integration
async function startSerialListener() {
    try {
        const { SerialPort, ReadlineParser } = await import('serialport');
        const port = new SerialPort({ path: SERIAL_PORT, baudRate: 115200 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        console.log(`Connected to Serial Port: ${SERIAL_PORT} @ 115200 baud`);

        parser.on('data', (line) => {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
                forwardLoraPacket(trimmed);
            }
        });

        port.on('error', (err) => {
            console.error('Serial Port Error:', err.message);
        });
    } catch (e) {
        console.log('\n💡 Note: "serialport" package not detected or running in test mode.');
        console.log('To run live hardware bridge: npm install serialport');
        console.log('\nRunning simulated test packet to verify bridge...');
        
        // Run test transmission
        await forwardLoraPacket('FOREST_NODE_001|SOS|Wildfire spotted near Ridge Sector 4 [9.8692, 77.4223]');
    }
}

startSerialListener();
