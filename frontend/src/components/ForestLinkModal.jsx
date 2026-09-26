import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gatewayAPI } from '../services/api';
import toast from 'react-hot-toast';

const PRESETS = [
    {
        id: 'wildfire',
        name: '🔥 Wildfire SOS (Node 001)',
        node_id: 'FOREST_NODE_001',
        message: 'Wildfire spotted rapidly spreading across Ridge Sector 4 [9.8692, 77.4223]',
        lat: 9.8692558,
        lng: 77.4222974,
        urgency: 'critical',
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
        desc: 'Madurai Sector (Evacuation & heavy lifting required)'
    },
    {
        id: 'hex_tlm',
        name: '📦 18-Byte Packed Binary Hex (Node 001)',
        node_id: 'FOREST_NODE_001',
        message: 'TLM|01000200B0100A84551205EE0219006801CC [9.8692, 77.4223]',
        lat: 9.8692558,
        lng: 77.4222974,
        urgency: 'critical',
        desc: 'ForestLink Compact Telemetry wire protocol with CRC-8 checksum'
    }
];

const ForestLinkModal = ({ isOpen, onClose, onSignalProcessed }) => {
    const [selectedPreset, setSelectedPreset] = useState('wildfire');
    const [nodeId, setNodeId] = useState('FOREST_NODE_001');
    const [message, setMessage] = useState(PRESETS[0].message);
    const [latitude, setLatitude] = useState(PRESETS[0].lat);
    const [longitude, setLongitude] = useState(PRESETS[0].lng);
    const [urgency, setUrgency] = useState('critical');
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const handleSelectPreset = (p) => {
        setSelectedPreset(p.id);
        setNodeId(p.node_id);
        setMessage(p.message);
        setLatitude(p.lat);
        setLongitude(p.lng);
        setUrgency(p.urgency);
    };

    const handleTransmit = async (e) => {
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

            setLastResult(data);
            toast.success(`LoRa Signal Processed! AI auto-assigned ${data.ai_dispatch?.auto_assigned_volunteers?.length || 0} volunteers.`);

            if (onSignalProcessed) {
                onSignalProcessed(data);
            }
        } catch (err) {
            console.error('LoRa Transmission Error:', err);
            toast.error(err.response?.data?.error || 'Failed to process LoRa signal');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-4xl bg-slate-950 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-8"
            >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            📡
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-white tracking-tight">ForestLink LoRa Gateway</h2>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    SX1278 433MHz LIVE
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Autonomous LoRa packet decoder & AI volunteer GPS auto-assignment engine
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
                    {/* Left: LoRa Signal Transmitter / Ingest Form */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                        <div>
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-2">
                                Quick LoRa Presets (Tamil Nadu Reserve Nodes)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectPreset(p)}
                                        className={`p-2.5 rounded-xl text-left border transition-all text-xs font-bold ${
                                            selectedPreset === p.id
                                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <div className="truncate">{p.name}</div>
                                        <div className="text-[9px] text-gray-400 truncate mt-0.5">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleTransmit} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Node Identifier</label>
                                    <input
                                        type="text"
                                        value={nodeId}
                                        onChange={(e) => setNodeId(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Urgency Level</label>
                                    <select
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                                    >
                                        <option value="critical">CRITICAL (SOS / Wildfire)</option>
                                        <option value="high">HIGH (Urgent Rescue)</option>
                                        <option value="medium">MEDIUM (Standard Task)</option>
                                        <option value="low">LOW (Telemetry Only)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                                    LoRa Air Packet / Hex / Text Payload
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500 resize-none"
                                    placeholder="Enter LoRa raw message, e.g. SOS|Wildfire [9.8692, 77.4223] or 18-byte hex"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">GPS Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">GPS Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Decoding & AI Ranking...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📡</span>
                                        <span>Transmit LoRa Signal & Auto-Assign</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right: Decoded JSON & AI Auto-Assignment Results */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                Live Gateway Output & AI Dispatch
                            </span>
                            {lastResult && (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    DISPATCHED
                                </span>
                            )}
                        </div>

                        {lastResult ? (
                            <div className="space-y-4">
                                {/* AI Auto-Assigned Volunteers Highlight */}
                                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>🤖</span> AI Auto-Assigned Responders
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            Target: {lastResult.ai_dispatch?.target_gps?.latitude?.toFixed(4)}N, {lastResult.ai_dispatch?.target_gps?.longitude?.toFixed(4)}E
                                        </span>
                                    </div>

                                    <div className="space-y-2 mt-3">
                                        {(lastResult.ai_dispatch?.auto_assigned_volunteers || []).map((v, i) => (
                                            <div
                                                key={v.volunteer_id || i}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-white"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                                                        #{i + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold leading-tight">{v.volunteer_name}</h4>
                                                        <p className="text-[10px] text-gray-400">
                                                            📍 {v.distance} km from LoRa Beacon | Score: {v.scores?.final}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                                                    ASSIGNED
                                                </span>
                                            </div>
                                        ))}

                                        {(!lastResult.ai_dispatch?.auto_assigned_volunteers || lastResult.ai_dispatch.auto_assigned_volunteers.length === 0) && (
                                            <p className="text-xs text-gray-500 italic py-2">
                                                No immediate emergency dispatch required for standard telemetry beacon.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Decoded JSON Response Viewer */}
                                <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                            Converted LoRa JSON Response
                                        </span>
                                        <span className="text-[9px] font-mono text-cyan-400">application/json</span>
                                    </div>
                                    <pre className="text-[10px] font-mono text-emerald-300 bg-slate-950 p-3 rounded-xl overflow-x-auto max-h-52 border border-white/5 custom-scrollbar">
                                        {JSON.stringify(lastResult.lora_data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-500">
                                <span className="text-3xl mb-2">📡</span>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Gateway Standby</p>
                                <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                                    Transmit a LoRa packet or select a preset on the left to see real-time JSON conversion and autonomous AI volunteer assignment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForestLinkModal;
