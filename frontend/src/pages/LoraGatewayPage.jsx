import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/MapView';
import { gatewayAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const PRESETS = [
    {
        id: 'wildfire',
        name: '🔥 Wildfire SOS (Node 001)',
        node_id: 'FOREST_NODE_001',
        message: 'Wildfire spotted spreading across Ridge Sector 4 [9.8692, 77.4223]',
        lat: 9.8692558,
        lng: 77.4222974,
        urgency: 'critical',
        raw: 'FOREST_NODE_001|SOS|Wildfire spotted spreading across Ridge Sector 4 [9.8692, 77.4223]',
        desc: 'Theni Reserve Forest (Immediate wildfire suppression required)'
    },
    {
        id: 'injured_ranger',
        name: '🚑 Injured Ranger SOS (Node 003)',
        node_id: 'FOREST_NODE_003',
        message: 'Injured Ranger with fracture near Kodaikanal Pine Forest [10.2381, 77.4892]',
        lat: 10.2381,
        lng: 77.4892,
        urgency: 'critical',
        raw: 'FOREST_NODE_003|SOS|Injured Ranger near Kodaikanal Pine Forest [10.2381, 77.4892]',
        desc: 'Kodaikanal Valley (Medical triage and evacuation team needed)'
    },
    {
        id: 'flash_flood',
        name: '🌊 Flash Flood Beacon (Node 004)',
        node_id: 'FOREST_NODE_004',
        message: 'Flash flood surging down Madurai river canyon [9.9261, 78.1141]',
        lat: 9.9261,
        lng: 78.1141,
        urgency: 'high',
        raw: 'FOREST_NODE_004|SOS|Flash flood surging down Madurai river canyon [9.9261, 78.1141]',
        desc: 'Madurai Sector (Evacuation & heavy lifting required)'
    },
    {
        id: 'hex_tlm',
        name: '📦 18-Byte Binary LoRa Hex',
        node_id: 'FOREST_NODE_001',
        message: 'TLM|01000200B0100A84551205EE0219006801CC [9.8692, 77.4223]',
        lat: 9.8692558,
        lng: 77.4222974,
        urgency: 'critical',
        raw: 'TLM|01000200B0100A84551205EE0219006801CC',
        desc: 'Compact wire protocol with CRC-8 checksum verification'
    }
];

const LoraGatewayPage = () => {
    const [selectedPreset, setSelectedPreset] = useState('wildfire');
    const [nodeId, setNodeId] = useState('FOREST_NODE_001');
    const [message, setMessage] = useState(PRESETS[0].message);
    const [latitude, setLatitude] = useState(PRESETS[0].lat);
    const [longitude, setLongitude] = useState(PRESETS[0].lng);
    const [urgency, setUrgency] = useState('critical');
    const [loading, setLoading] = useState(false);

    // Live state
    const [loraResult, setLoraResult] = useState(null);
    const [loraNodes, setLoraNodes] = useState([]);
    const [assignedVolunteers, setAssignedVolunteers] = useState([]);
    const [recentSignals, setRecentSignals] = useState([]);

    // Web Serial Hardware Connection
    const [serialConnected, setSerialConnected] = useState(false);
    const [serialPortInfo, setSerialPortInfo] = useState('');

    useEffect(() => {
        // Load initial simulation on mount to showcase immediately
        triggerSimulation(PRESETS[0]);
    }, []);

    const triggerSimulation = async (preset) => {
        setLoading(true);
        try {
            const payload = {
                node_id: preset.node_id,
                message: preset.message,
                latitude: preset.lat,
                longitude: preset.lng,
                urgency: preset.urgency,
                is_emergency: true,
                auto_assign_count: 2
            };

            const response = await gatewayAPI.ingestLoRa(payload);
            const data = response.data;
            handleSuccessfulSignal(data);
        } catch (err) {
            console.error('Simulation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulSignal = (data) => {
        setLoraResult(data);

        if (data.lora_data && data.lora_data.gps) {
            const newNode = {
                node_id: data.lora_data.node_id,
                latitude: data.lora_data.gps.latitude,
                longitude: data.lora_data.gps.longitude,
                battery_pct: data.lora_data.node_health?.battery_pct || 85,
                rssi: data.lora_data.rf_metrics?.rssi || -78,
                snr: data.lora_data.rf_metrics?.snr || 4.25,
                is_emergency: data.lora_data.emergency?.is_emergency
            };
            setLoraNodes([newNode]);
        }

        if (data.ai_dispatch?.auto_assigned_volunteers) {
            setAssignedVolunteers(data.ai_dispatch.auto_assigned_volunteers);
        }

        setRecentSignals(prev => [data, ...prev.slice(0, 9)]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                node_id: nodeId,
                message: message,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                urgency: urgency,
                is_emergency: urgency === 'critical' || urgency === 'high',
                auto_assign_count: 2
            };

            const response = await gatewayAPI.ingestLoRa(payload);
            const data = response.data;

            handleSuccessfulSignal(data);
            toast.success(`LoRa Signal Processed! AI auto-assigned ${data.ai_dispatch?.auto_assigned_volunteers?.length || 0} volunteers.`);
        } catch (err) {
            console.error('LoRa Transmission Error:', err);
            toast.error(err.response?.data?.error || 'Failed to process LoRa signal');
        } finally {
            setLoading(false);
        }
    };

    // Web Serial API - Connect directly to ESP32 USB COM Port from browser!
    const handleConnectSerial = async () => {
        if (!('serial' in navigator)) {
            toast.error('Web Serial API is not supported in this browser. Use Google Chrome or MS Edge, or use the HTTP API.');
            return;
        }

        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });

            setSerialConnected(true);
            setSerialPortInfo('ESP32 USB Connected @ 115200 baud');
            toast.success('Connected to ESP32 Gateway via USB Serial!');

            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();

            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += value;
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.length > 0) {
                        toast(`LoRa Serial Packet: ${trimmed.slice(0, 35)}...`, { icon: '📡' });
                        // Ingest through API
                        try {
                            const resp = await gatewayAPI.ingestLoRa({
                                source: 'web_serial_esp32',
                                message: trimmed
                            });
                            handleSuccessfulSignal(resp.data);
                        } catch (e) {
                            console.error('Serial packet ingest error:', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Serial connection error:', err);
            toast.error('Serial port closed or connection failed');
            setSerialConnected(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-12 selection:bg-emerald-500/30">
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

            <div className="container mx-auto max-w-[1600px] space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.3em] text-emerald-400">
                                ForestLink LoRa Gateway Protocol v4.2
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
                            LoRa Mesh <span className="text-emerald-400">& AI Dispatch</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                            Converts raw ESP32 LoRa wireless signals into structured JSON responses in real-time, extracts GPS coordinates, and autonomously triggers AI nearest-volunteer ranking and dispatch.
                        </p>
                    </div>

                    {/* Hardware & API Status Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-2.5 shadow-xl">
                            <span className="text-base">📡</span>
                            <div>
                                <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">Radio Interface</span>
                                <span className="text-xs font-mono font-bold text-cyan-400">SX1278 433MHz Mesh</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleConnectSerial}
                            className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2.5 shadow-xl ${
                                serialConnected
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-white/5 border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-white'
                            }`}
                            title="Directly read packets from ESP32 via USB Serial in Chrome/Edge"
                        >
                            <span className="text-base">🔌</span>
                            <div className="text-left">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">
                                    {serialConnected ? 'Serial Connected' : 'USB Serial Bridge'}
                                </span>
                                <span className="text-xs font-mono font-bold">
                                    {serialConnected ? 'COM Port Active' : 'Connect ESP32 USB'}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Workstation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: LoRa Signal Ingest & Transmitter Simulator */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Simulation Presets Card */}
                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                    <span>📡</span> Select Forest Node LoRa Signal
                                </h3>
                                <span className="text-[9px] font-mono text-gray-400">Tamil Nadu Forest Grid</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPreset(p.id);
                                            setNodeId(p.node_id);
                                            setMessage(p.message);
                                            setLatitude(p.lat);
                                            setLongitude(p.lng);
                                            setUrgency(p.urgency);
                                        }}
                                        className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                                            selectedPreset === p.id
                                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-xs font-bold leading-snug">{p.name}</span>
                                        <span className="text-[9px] text-gray-400 mt-1 line-clamp-1">{p.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Signal Configuration Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">LoRa Node ID</label>
                                        <input
                                            type="text"
                                            value={nodeId}
                                            onChange={(e) => setNodeId(e.target.value)}
                                            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Urgency</label>
                                        <select
                                            value={urgency}
                                            onChange={(e) => setUrgency(e.target.value)}
                                            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                                        >
                                            <option value="critical">CRITICAL (Wildfire / SOS)</option>
                                            <option value="high">HIGH (Urgent Rescue)</option>
                                            <option value="medium">MEDIUM (Standard)</option>
                                            <option value="low">LOW (Telemetry Only)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                        Raw LoRa Packet / Hex Payload
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500 resize-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">GPS Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">GPS Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing Signal & Auto-Assigning...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📡</span>
                                            <span>Transmit Signal & Auto-Assign Responders</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Recent LoRa Signals Feed */}
                        <div className="glass-card p-5 border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                    Recent Ingested LoRa Packets
                                </h4>
                                <span className="text-[9px] font-mono text-emerald-400">{recentSignals.length} Buffered</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {recentSignals.map((sig, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSuccessfulSignal(sig)}
                                        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xs">
                                                {sig.lora_data?.emergency?.is_emergency ? '🚨' : '📡'}
                                            </span>
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-white leading-tight truncate">
                                                    {sig.lora_data?.node_id || 'NODE'} - {sig.lora_data?.emergency?.alert_type || 'Telemetry'}
                                                </p>
                                                <p className="text-[9px] font-mono text-gray-400">
                                                    [{sig.lora_data?.gps?.latitude?.toFixed(4)}, {sig.lora_data?.gps?.longitude?.toFixed(4)}]
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {sig.ai_dispatch?.auto_assigned_volunteers?.length || 0} ASSIGNED
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live JSON Response Viewer & AI Auto-Assignment Breakdown */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {/* Step 1: Converted JSON Response Card */}
                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                                        Converted LoRa JSON Response
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (loraResult) {
                                            navigator.clipboard.writeText(JSON.stringify(loraResult.lora_data, null, 2));
                                            toast.success('JSON response copied to clipboard!');
                                        }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-300 transition-colors"
                                >
                                    Copy JSON
                                </button>
                            </div>

                            {loraResult ? (
                                <div>
                                    {/* Highlighted GPS Pill */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                                            <span className="text-[9px] uppercase font-bold text-gray-400 block">GPS Latitude</span>
                                            <span className="text-xs font-mono font-bold text-cyan-300">
                                                {loraResult.lora_data?.gps?.latitude}° N
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                                            <span className="text-[9px] uppercase font-bold text-gray-400 block">GPS Longitude</span>
                                            <span className="text-xs font-mono font-bold text-cyan-300">
                                                {loraResult.lora_data?.gps?.longitude}° E
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                                            <span className="text-[9px] uppercase font-bold text-gray-400 block">LoRa RSSI / SNR</span>
                                            <span className="text-xs font-mono font-bold text-white">
                                                {loraResult.lora_data?.rf_metrics?.rssi} dBm / {loraResult.lora_data?.rf_metrics?.snr} dB
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Node Health</span>
                                            <span className="text-xs font-mono font-bold text-emerald-400">
                                                ⚡ {loraResult.lora_data?.node_health?.battery_pct}% Battery
                                            </span>
                                        </div>
                                    </div>

                                    {/* Syntax-Colored JSON Terminal */}
                                    <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950/95 p-4 rounded-2xl overflow-x-auto max-h-56 border border-white/10 custom-scrollbar shadow-inner leading-relaxed">
                                        {JSON.stringify(loraResult.lora_data, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 font-mono text-xs">
                                    Waiting for LoRa signal...
                                </div>
                            )}
                        </div>

                        {/* Step 2: AI Auto-Assignment Results from LoRa GPS */}
                        <div className="glass-card p-6 border-emerald-500/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🤖</span>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                                            Autonomous AI Volunteer Auto-Assignment
                                        </h3>
                                        <p className="text-[9px] text-gray-400 font-medium">
                                            Calculated using Haversine GPS proximity to LoRa beacon [{loraResult?.lora_data?.gps?.latitude?.toFixed(4)}, {loraResult?.lora_data?.gps?.longitude?.toFixed(4)}]
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                                    {assignedVolunteers.length} RESPONDERS DISPATCHED
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assignedVolunteers.map((v, i) => (
                                    <motion.div
                                        key={v.volunteer_id || i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col justify-between shadow-xl"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30 shrink-0">
                                                    #{i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white leading-tight">{v.volunteer_name}</h4>
                                                    <span className="text-[10px] text-emerald-400 font-bold">
                                                        📍 {v.distance} km from LoRa Beacon
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                                SCORE {v.scores?.final}%
                                            </span>
                                        </div>

                                        {/* Score Metric Breakdown */}
                                        <div className="grid grid-cols-3 gap-1.5 my-2 pt-2 border-t border-white/5 text-[9px] text-gray-400 font-mono">
                                            <div>
                                                <span>Distance:</span> <b className="text-white">{v.scores?.distance}%</b>
                                            </div>
                                            <div>
                                                <span>Skills:</span> <b className="text-white">{v.scores?.skill}%</b>
                                            </div>
                                            <div>
                                                <span>Reliability:</span> <b className="text-white">{v.scores?.reliability}%</b>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                                            <span className="text-gray-400">{v.volunteer_data?.phone || '📞 +91 98421 XXXXX'}</span>
                                            <span className="text-emerald-400 font-bold">● ASSIGNED</span>
                                        </div>
                                    </motion.div>
                                ))}

                                {assignedVolunteers.length === 0 && (
                                    <div className="col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-gray-500 text-xs">
                                        No active emergency SOS signal. Standard telemetry beacon received.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Embedded OpenStreetMap View of LoRa Node and Dispatched Responders */}
                        <div className="glass-card p-4 border-white/10 overflow-hidden flex flex-col h-[340px]">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                    <span>🗺️</span> OpenStreetMap Live Coordinate Visualization
                                </h4>
                                <span className="text-[9px] font-mono text-emerald-400">
                                    Centered on LoRa GPS: {latitude?.toFixed ? latitude.toFixed(4) : latitude}N, {longitude?.toFixed ? longitude.toFixed(4) : longitude}E
                                </span>
                            </div>

                            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 relative">
                                <MapView
                                    center={[parseFloat(latitude) || 9.8692, parseFloat(longitude) || 77.4223]}
                                    zoom={10}
                                    volunteers={assignedVolunteers.map(v => v.volunteer_data).filter(Boolean)}
                                    disasters={[]}
                                    loraNodes={loraNodes}
                                    mapLayer="osm"
                                    showLayerSelector={true}
                                    showControls={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoraGatewayPage;
