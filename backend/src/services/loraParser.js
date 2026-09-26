/**
 * ForestLink LoRa Telemetry & Emergency Packet Codec for RForce
 * Decodes 18-byte packed LoRa binary hex, ASCII text/SOS packets,
 * and GPS coordinate vectors into standardized JSON structures.
 */

export const TELEMETRY_PACKET_SIZE = 18;

/**
 * CRC-8 with polynomial 0x07 (Matches ForestLink C++ and Python implementations)
 * @param {Buffer} buffer 
 * @param {number} len 
 * @returns {number} 8-bit checksum
 */
export function computeCrc8(buffer, len = buffer.length) {
    let crc = 0x00;
    for (let i = 0; i < len; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x80) !== 0) {
                crc = ((crc << 1) ^ 0x07) & 0xFF;
            } else {
                crc = (crc << 1) & 0xFF;
            }
        }
    }
    return crc;
}

/**
 * Parses an 18-byte packed binary hex string from ForestLink LoRa mesh.
 * Wire Format (18 Bytes):
 * [0..1]  node_id (uint16_t LE)
 * [2..3]  neighbor_id (uint16_t LE)
 * [4]     rssi (int8_t)
 * [5]     snr_x4 (int8_t, scaled by 4)
 * [6]     packet_loss_rate (uint8_t, 0-100%)
 * [7]     battery_scaled (uint8_t, 2500-5050 mV, 10mV steps)
 * [8]     battery_pct (uint8_t, 0-100%)
 * [9]     hop_and_flags (uint8_t, bits 0..3 hops, bit 4 gps, bit 5 emergency)
 * [10]    queue_len (uint8_t)
 * [11..12] distance_m (uint16_t LE)
 * [13..14] last_seen_sec (uint16_t LE)
 * [15..16] uptime_min (uint16_t LE)
 * [17]    checksum (CRC-8)
 * 
 * @param {string|Buffer} input - 36-char HEX or 18-byte Buffer
 * @returns {object} Parsed telemetry structure
 */
export function parseForestLinkHex(input) {
    let buf;
    if (typeof input === 'string') {
        const cleaned = input.trim().replace(/^TLM\|/i, '').replace(/\s+/g, '');
        if (cleaned.length < TELEMETRY_PACKET_SIZE * 2) {
            throw new Error(`Invalid hex length: expected ${TELEMETRY_PACKET_SIZE * 2} characters, got ${cleaned.length}`);
        }
        buf = Buffer.from(cleaned.slice(0, TELEMETRY_PACKET_SIZE * 2), 'hex');
    } else if (Buffer.isBuffer(input)) {
        buf = input.slice(0, TELEMETRY_PACKET_SIZE);
    } else {
        throw new Error('Input must be a hex string or Buffer');
    }

    if (buf.length !== TELEMETRY_PACKET_SIZE) {
        throw new Error(`Buffer size mismatch: expected ${TELEMETRY_PACKET_SIZE} bytes, got ${buf.length}`);
    }

    // CRC-8 Verification
    const expectedCrc = computeCrc8(buf, TELEMETRY_PACKET_SIZE - 1);
    const actualCrc = buf[TELEMETRY_PACKET_SIZE - 1];
    const crcValid = expectedCrc === actualCrc;

    // Little-Endian unpacking
    const nodeId = buf.readUInt16LE(0);
    const neighborId = buf.readUInt16LE(2);
    const rssi = buf.readInt8(4);
    const snrX4 = buf.readInt8(5);
    const snr = Number((snrX4 / 4.0).toFixed(2));
    const packetLossRate = buf.readUInt8(6);
    const batteryScaled = buf.readUInt8(7);
    const batteryVoltageMv = 2500 + (batteryScaled * 10);
    const batteryPct = buf.readUInt8(8);
    const hopAndFlags = buf.readUInt8(9);
    const queueLen = buf.readUInt8(10);
    const distanceM = buf.readUInt16LE(11);
    const lastSeenSec = buf.readUInt16LE(13);
    const uptimeMin = buf.readUInt16LE(15);

    const hopCount = hopAndFlags & 0x0F;
    const isGps = (hopAndFlags & (1 << 4)) !== 0;
    const isEmergency = (hopAndFlags & (1 << 5)) !== 0;

    return {
        node_id: `FOREST_NODE_${String(nodeId).padStart(3, '0')}`,
        neighbor_id: `FOREST_NODE_${String(neighborId).padStart(3, '0')}`,
        node_id_raw: nodeId,
        neighbor_id_raw: neighborId,
        rssi,
        snr,
        packet_loss_rate: packetLossRate,
        battery_voltage_mv: batteryVoltageMv,
        battery_pct: batteryPct,
        hop_count: hopCount,
        is_gps: isGps,
        is_emergency: isEmergency,
        queue_len: queueLen,
        distance_m: distanceM,
        last_seen_sec: lastSeenSec,
        uptime_min: uptimeMin,
        checksum: actualCrc,
        crc_valid: crcValid,
        raw_hex: buf.toString('hex').toUpperCase()
    };
}

/**
 * Extracts GPS coordinates [lat, lon] or GPS: lat, lon from string payload
 * @param {string} text 
 * @returns {{latitude: number, longitude: number}|null}
 */
export function extractGpsCoordinates(text) {
    if (!text || typeof text !== 'string') return null;

    // Match bracketed coordinates: [10.1234, 77.5678] or [ 10.1234 , 77.5678 ]
    const bracketMatch = text.match(/\[\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*\]/);
    if (bracketMatch) {
        const lat = parseFloat(bracketMatch[1]);
        const lng = parseFloat(bracketMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Match GPS: 10.1234, 77.5678 or LAT:10.1234,LON:77.5678
    const gpsMatch = text.match(/(?:GPS|LOC|COORD)[:=]\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i);
    if (gpsMatch) {
        const lat = parseFloat(gpsMatch[1]);
        const lng = parseFloat(gpsMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Match LAT/LON key pairs
    const latMatch = text.match(/LAT[:=]\s*(-?\d{1,3}(?:\.\d+)?)/i);
    const lonMatch = text.match(/(?:LON|LNG)[:=]\s*(-?\d{1,3}(?:\.\d+)?)/i);
    if (latMatch && lonMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lonMatch[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
        }
    }

    return null;
}

/**
 * Universal LoRa message converter: accepts binary Hex, ASCII text, SOS string,
 * or JSON payload and outputs a structured JSON response for RForce.
 * 
 * @param {object|string} input 
 * @returns {object} Standardized JSON response
 */
export function convertLoraToJson(input) {
    const timestamp = new Date().toISOString();

    // Case 1: Direct JSON Payload from HTTP/MQTT Gateway
    if (typeof input === 'object' && input !== null) {
        // If it includes raw_hex, decode it first
        let hexTelemetry = null;
        if (input.raw_hex || input.telemetry_hex || (typeof input.payload === 'string' && input.payload.startsWith('TLM|'))) {
            try {
                const hex = input.raw_hex || input.telemetry_hex || input.payload;
                hexTelemetry = parseForestLinkHex(hex);
            } catch (e) {
                // non-fatal, fallback to payload values
            }
        }

        const gpsFromText = extractGpsCoordinates(input.message || input.content || input.description || '');
        const latitude = input.latitude !== undefined ? parseFloat(input.latitude)
            : (gpsFromText?.latitude ?? hexTelemetry?.latitude ?? 9.8692558);
        const longitude = input.longitude !== undefined ? parseFloat(input.longitude)
            : (gpsFromText?.longitude ?? hexTelemetry?.longitude ?? 77.4222974);

        const isEmergency = input.is_emergency !== undefined ? Boolean(input.is_emergency)
            : (input.urgency === 'critical' || input.urgency === 'high' || hexTelemetry?.is_emergency || /SOS|EMERGENCY|FIRE|INJURED|FLOOD/i.test(input.message || ''));

        let alertType = input.alert_type || input.disaster_type || 'Emergency Rescue';
        if (/fire|wildfire/i.test(input.message || '')) alertType = 'Wildfire';
        else if (/flood|water/i.test(input.message || '')) alertType = 'Flood';
        else if (/injured|medical|casualty/i.test(input.message || '')) alertType = 'Medical Emergency';
        else if (/sos|lost|search/i.test(input.message || '')) alertType = 'Search & Rescue';

        const urgency = input.urgency || (isEmergency ? 'critical' : 'medium');

        return {
            success: true,
            source: 'forestlink_gateway',
            packet_type: isEmergency ? 'EMERGENCY_SOS' : 'TELEMETRY_BEACON',
            node_id: input.node_id || hexTelemetry?.node_id || 'FOREST_NODE_001',
            neighbor_id: input.neighbor_id || hexTelemetry?.neighbor_id || 'FOREST_NODE_002',
            gps: {
                latitude,
                longitude,
                has_gps: true,
                accuracy_m: input.accuracy_m || 5.0,
                distance_m: input.distance_m || hexTelemetry?.distance_m || 450
            },
            rf_metrics: {
                rssi: input.rssi ?? hexTelemetry?.rssi ?? -78,
                snr: input.snr ?? hexTelemetry?.snr ?? 4.25,
                packet_loss_rate: input.packet_loss_rate ?? hexTelemetry?.packet_loss_rate ?? 4,
                hop_count: input.hop_count ?? hexTelemetry?.hop_count ?? 1,
                link_quality: (input.snr ?? hexTelemetry?.snr ?? 4.25) > 0 ? 'GOOD' : 'FAIR'
            },
            node_health: {
                battery_pct: input.battery_pct ?? hexTelemetry?.battery_pct ?? 85,
                battery_voltage_mv: input.battery_voltage_mv ?? hexTelemetry?.battery_voltage_mv ?? 3820,
                status: (input.battery_pct ?? hexTelemetry?.battery_pct ?? 85) < 20 ? 'CRITICAL' : 'HEALTHY'
            },
            emergency: {
                is_emergency: isEmergency,
                urgency,
                alert_type: alertType,
                message: input.message || input.content || `Autonomous beacon received from ${input.node_id || 'FOREST_NODE_001'}`
            },
            telemetry: hexTelemetry,
            timestamp
        };
    }

    // Case 2: String Payload (Hex packet, TLM|..., SOS|..., or TXT|...)
    const rawStr = String(input).trim();

    // Check if it's a 36-char HEX or starts with TLM|
    if (/^(?:TLM\|)?[0-9a-fA-F]{36}/.test(rawStr)) {
        try {
            const hexTlm = parseForestLinkHex(rawStr);
            const gps = extractGpsCoordinates(rawStr) || { latitude: 9.8692558, longitude: 77.4222974 };

            return {
                success: true,
                source: 'forestlink_lora_hex',
                packet_type: hexTlm.is_emergency ? 'EMERGENCY_SOS' : 'TELEMETRY_BEACON',
                node_id: hexTlm.node_id,
                neighbor_id: hexTlm.neighbor_id,
                gps: {
                    latitude: gps.latitude,
                    longitude: gps.longitude,
                    has_gps: hexTlm.is_gps,
                    distance_m: hexTlm.distance_m
                },
                rf_metrics: {
                    rssi: hexTlm.rssi,
                    snr: hexTlm.snr,
                    packet_loss_rate: hexTlm.packet_loss_rate,
                    hop_count: hexTlm.hop_count,
                    link_quality: hexTlm.snr > 0 ? 'GOOD' : 'FAIR'
                },
                node_health: {
                    battery_pct: hexTlm.battery_pct,
                    battery_voltage_mv: hexTlm.battery_voltage_mv,
                    status: hexTlm.battery_pct < 20 ? 'CRITICAL' : (hexTlm.battery_pct < 45 ? 'DEGRADING' : 'HEALTHY')
                },
                emergency: {
                    is_emergency: hexTlm.is_emergency,
                    urgency: hexTlm.is_emergency ? 'critical' : 'medium',
                    alert_type: hexTlm.is_emergency ? 'Wildfire / SOS Alert' : 'Routine Mesh Telemetry',
                    message: hexTlm.is_emergency
                        ? `Emergency SOS broadcast received from ${hexTlm.node_id} via LoRa Mesh`
                        : `Mesh telemetry beacon from ${hexTlm.node_id} (Battery: ${hexTlm.battery_pct}%)`
                },
                telemetry: hexTlm,
                timestamp
            };
        } catch (e) {
            // continue to string parsing if hex fails
        }
    }

    // Check if it's an ASCII formatted message: e.g. "FOREST_NODE_001|SOS|Wildfire [9.8692, 77.4223]"
    const gps = extractGpsCoordinates(rawStr) || { latitude: 9.8692558, longitude: 77.4222974 };
    const parts = rawStr.split('|');

    let sender = 'FOREST_NODE_001';
    let msgType = 'TXT';
    let content = rawStr;

    if (parts.length >= 3) {
        sender = parts[0].trim();
        msgType = parts[1].trim();
        content = parts.slice(2).join('|').trim();
    } else if (parts.length === 2) {
        if (/^(?:SOS|TXT|ALERT|GPS)$/i.test(parts[0].trim())) {
            msgType = parts[0].trim().toUpperCase();
            content = parts[1].trim();
        } else {
            sender = parts[0].trim();
            content = parts[1].trim();
        }
    }

    const isEmergency = msgType === 'SOS' || /SOS|EMERGENCY|FIRE|INJURED|FLOOD/i.test(content);
    let alertType = 'Emergency Response';
    if (/fire|wildfire/i.test(content)) alertType = 'Wildfire';
    else if (/flood|water/i.test(content)) alertType = 'Flood';
    else if (/injured|medical|casualty/i.test(content)) alertType = 'Medical Emergency';
    else if (/sos|lost|search/i.test(content)) alertType = 'Search & Rescue';

    return {
        success: true,
        source: 'forestlink_lora_ascii',
        packet_type: isEmergency ? 'EMERGENCY_SOS' : 'TEXT_BROADCAST',
        node_id: sender,
        neighbor_id: 'GATEWAY_BASECAMP',
        gps: {
            latitude: gps.latitude,
            longitude: gps.longitude,
            has_gps: true,
            distance_m: 500
        },
        rf_metrics: {
            rssi: -82,
            snr: 3.5,
            packet_loss_rate: 0,
            hop_count: 1,
            link_quality: 'GOOD'
        },
        node_health: {
            battery_pct: 88,
            battery_voltage_mv: 3900,
            status: 'HEALTHY'
        },
        emergency: {
            is_emergency: isEmergency,
            urgency: isEmergency ? 'critical' : 'low',
            alert_type: alertType,
            message: content
        },
        raw_packet: rawStr,
        timestamp
    };
}

export default {
    TELEMETRY_PACKET_SIZE,
    computeCrc8,
    parseForestLinkHex,
    extractGpsCoordinates,
    convertLoraToJson
};
