import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Trash2, Recycle, Radio, MapPin, Plus, X, Crosshair, Eye } from 'lucide-react';
import { sectors, garbageStats } from '../data/mockData';
import StatCard from '../components/StatCard';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

// ── Map icons ──
const iconUAV = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:linear-gradient(135deg,#00d4ff,#0090ff);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 0 12px rgba(0,144,255,0.5);border:2px solid rgba(255,255,255,0.3)">✈</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const iconUFV = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:linear-gradient(135deg,#00e676,#00c853);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 0 12px rgba(0,200,83,0.5);border:2px solid rgba(255,255,255,0.3)">⚙</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const iconCCV = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:linear-gradient(135deg,#ff9100,#ff6d00);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 0 12px rgba(255,109,0,0.5);border:2px solid rgba(255,255,255,0.3)">◉</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const iconPlacement = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:#fff;color:#000;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;box-shadow:0 0 20px rgba(255,255,255,0.6);border:2px solid #fff;animation:pulse 1.5s ease-in-out infinite">+</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

function getBatteryColor(pct) {
    if (pct > 60) return '#00e676';
    if (pct > 30) return '#ffab00';
    return '#ff1744';
}

function getStatusBadge(status) {
    const map = {
        patrolling: 'badge-accent', collecting: 'badge-accent',
        'en-route': 'badge-warning', returning: 'badge-warning',
        charging: 'badge-neutral', idle: 'badge-neutral',
        active: 'badge-success', maintenance: 'badge-danger'
    };
    return map[status] || 'badge-neutral';
}

function getDeviceIcon(type) {
    if (type === 'uav') return iconUAV;
    if (type === 'ufv') return iconUFV;
    return iconCCV;
}

// ── Map click handler for placing devices ──
function PlacementClickHandler({ active, onPlace }) {
    useMapEvents({
        click: (e) => {
            if (active) {
                onPlace([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null;
}

export default function Dashboard() {
    const { fleet, metrics, trails, detections } = useSocket();
    const { user } = useAuth();
    const [placementMode, setPlacementMode] = useState(false);
    const [placementType, setPlacementType] = useState('uav');
    const [placing, setPlacing] = useState(false);

    const activeUAVs = fleet.filter(d => d.type === 'uav');
    const activeUFVs = fleet.filter(d => d.type === 'ufv');
    const activeCCVs = fleet.filter(d => d.type === 'ccv');

    const totalTrashKg = (garbageStats.totalCollectedKg / 1000) + (metrics.total_trash * 0.05);

    const handlePlaceDevice = useCallback(async (coords) => {
        if (placing) return;
        setPlacing(true);
        try {
            await api.createDevice({ type: placementType, lat: coords[0], lng: coords[1] });
            // Fleet update comes via socket automatically
        } catch (err) {
            console.error('Failed to place device:', err);
            alert('Failed to place device: ' + err.message);
        } finally {
            setPlacing(false);
        }
    }, [placementType, placing]);

    const handleDeleteDevice = useCallback(async (deviceId) => {
        if (!confirm(`Remove device ${deviceId}?`)) return;
        try {
            await api.deleteDevice(deviceId);
        } catch (err) {
            alert('Failed to remove: ' + err.message);
        }
    }, []);

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Command Center</h1>
                <p>Real-time monitoring of all deployed devices and operational metrics</p>
            </div>

            <div className="grid-4 animate-in" style={{ marginBottom: 20 }}>
                <StatCard label="Garbage Session" value={`${(metrics.total_trash * 12).toFixed(1)} kg`} sub="Collected this session" icon={<Trash2 size={18} strokeWidth={1.5} />} />
                <StatCard label="Total Collected" value={`${totalTrashKg.toFixed(1)}t`} sub={`${Math.round(garbageStats.recycledKg / Math.max(1, totalTrashKg * 1000) * 100)}% recycled`} icon={<Recycle size={18} strokeWidth={1.5} />} />
                <StatCard label="Active Missions" value={String(metrics.active_missions)} sub={`${metrics.active_devices || 0} of ${metrics.total_devices || 0} devices active`} icon={<Radio size={18} strokeWidth={1.5} />} />
                <StatCard label="Fleet Size" value={String(metrics.total_devices || fleet.length)} sub={`${activeUAVs.length} UAV · ${activeUFVs.length} UFV · ${activeCCVs.length} CCV`} icon={<MapPin size={18} strokeWidth={1.5} />} />
            </div>

            {/* ── Device Placement Toolbar ── */}
            {user && (
                <div className="placement-toolbar animate-in" style={{ animationDelay: '0.05s' }}>
                    <div className="placement-left">
                        <Crosshair size={14} />
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Place Device</span>
                        <select
                            value={placementType}
                            onChange={e => setPlacementType(e.target.value)}
                            className="placement-select"
                        >
                            <option value="uav">UAV (Drone)</option>
                            <option value="ufv">UFV (Cleaning Robot)</option>
                            <option value="ccv">CCV (Command Vehicle)</option>
                        </select>
                    </div>
                    <button
                        className={`btn ${placementMode ? 'btn-danger' : 'btn-accent'}`}
                        onClick={() => setPlacementMode(!placementMode)}
                        disabled={placing}
                        style={{ fontSize: '0.78rem', padding: '6px 16px' }}
                    >
                        {placementMode ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Click Map to Place</>}
                    </button>
                </div>
            )}

            <div className="dashboard-grid animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="dashboard-map" style={{ position: 'relative' }}>
                    {placementMode && (
                        <div className="placement-overlay">
                            <Crosshair size={16} /> Click anywhere on the map to place a {placementType.toUpperCase()}
                        </div>
                    )}
                    <MapContainer center={[23.035, 72.578]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        <PlacementClickHandler active={placementMode} onPlace={handlePlaceDevice} />

                        {/* Sector circles */}
                        {sectors.map(s => (
                            <Circle key={s.id} center={s.center} radius={s.radius} pathOptions={{ color: '#555', fillColor: '#fff', fillOpacity: 0.02, weight: 1, dashArray: '6 4' }} />
                        ))}

                        {/* Active mission route trails */}
                        {trails.map((trail, i) => (
                            <Polyline
                                key={`trail-${trail.device_id}-${i}`}
                                positions={trail.waypoints}
                                pathOptions={{
                                    color: trail.device_id.startsWith('UAV') ? '#00d4ff' : '#00e676',
                                    weight: 2,
                                    opacity: 0.5,
                                    dashArray: '8 6'
                                }}
                            />
                        ))}

                        {/* All devices from live fleet */}
                        {fleet.map(d => (
                            <Marker key={d.id} position={[d.lat, d.lng]} icon={getDeviceIcon(d.type)}>
                                <Popup>
                                    <strong>{d.id}</strong><br />
                                    Type: {d.type.toUpperCase()}<br />
                                    Status: {d.status}<br />
                                    {d.type !== 'ccv' && <>Battery: {(d.battery || 0).toFixed(1)}%<br /></>}
                                    {d.trash_collected > 0 && <>Collected: {d.trash_collected} items<br /></>}
                                    {d.sector && <>Sector: {d.sector}<br /></>}
                                </Popup>
                            </Marker>
                        ))}

                        {/* ML Detection markers (red pulsing dots) */}
                        {detections.filter(d => d.lat && d.lng).map((det, i) => (
                            <Marker
                                key={`det-${i}`}
                                position={[det.lat, det.lng]}
                                icon={L.divIcon({
                                    className: 'custom-marker',
                                    html: '<div style="background:#ff1744;border-radius:50%;width:14px;height:14px;box-shadow:0 0 16px rgba(255,23,68,0.8);border:2px solid rgba(255,255,255,0.5);animation:pulse 1.5s infinite"></div>',
                                    iconSize: [14, 14],
                                    iconAnchor: [7, 7]
                                })}
                            >
                                <Popup>
                                    <strong>ML Detection</strong><br />
                                    Label: {det.label}<br />
                                    Confidence: {(det.confidence * 100).toFixed(0)}%<br />
                                    From: {det.device_id}<br />
                                    Time: {new Date(det.timestamp).toLocaleTimeString()}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="dashboard-side">
                    {/* UAV Fleet Panel */}
                    <div className="device-panel">
                        <div className="device-panel-header">
                            <h3>UAV Fleet</h3>
                            <span className="badge badge-accent">{activeUAVs.length} units</span>
                        </div>
                        <div className="device-list">
                            {activeUAVs.length === 0 && <div className="device-empty">No UAVs deployed</div>}
                            {activeUAVs.map(d => (
                                <div key={d.id} className="device-item">
                                    <span className="device-id">{d.id}</span>
                                    <span className="device-status"><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></span>
                                    <div className="device-battery">
                                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${d.battery}%`, background: getBatteryColor(d.battery) }}></div></div>
                                        {(d.battery || 0).toFixed(0)}%
                                    </div>
                                    {d.sector && <span className="device-sector">{d.sector}</span>}
                                    {user && d.status === 'idle' && (
                                        <button className="device-remove" onClick={() => handleDeleteDevice(d.id)} title="Remove device">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* UFV Fleet Panel */}
                    <div className="device-panel">
                        <div className="device-panel-header">
                            <h3>UFV Fleet</h3>
                            <span className="badge badge-accent">{activeUFVs.length} units</span>
                        </div>
                        <div className="device-list">
                            {activeUFVs.length === 0 && <div className="device-empty">No UFVs deployed</div>}
                            {activeUFVs.map(d => (
                                <div key={d.id} className="device-item">
                                    <span className="device-id">{d.id}</span>
                                    <span className="device-status"><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></span>
                                    <div className="device-battery">
                                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${d.battery}%`, background: getBatteryColor(d.battery) }}></div></div>
                                        {(d.battery || 0).toFixed(0)}%
                                    </div>
                                    {d.sector && <span className="device-sector">{d.sector}</span>}
                                    {user && d.status === 'idle' && (
                                        <button className="device-remove" onClick={() => handleDeleteDevice(d.id)} title="Remove device">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CCV Panel */}
                    <div className="device-panel">
                        <div className="device-panel-header">
                            <h3>CCV Stations</h3>
                            <span className="badge badge-accent">{activeCCVs.length} units</span>
                        </div>
                        <div className="device-list">
                            {activeCCVs.length === 0 && <div className="device-empty">No CCVs deployed</div>}
                            {activeCCVs.map(d => (
                                <div key={d.id} className="device-item">
                                    <span className="device-id">{d.id}</span>
                                    <span className="device-status"><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></span>
                                    {user && (
                                        <button className="device-remove" onClick={() => handleDeleteDevice(d.id)} title="Remove CCV">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detection Feed */}
            {detections.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Eye size={14} /> ML Detection Feed
                        <span className="badge badge-accent" style={{ marginLeft: 8 }}>{detections.length}</span>
                    </h3>
                    <div className="detection-feed animate-in" style={{ animationDelay: '0.25s' }}>
                        {detections.slice(0, 10).map((det, i) => (
                            <div key={i} className="detection-item">
                                <div className="detection-dot" />
                                <div className="detection-info">
                                    <strong>{det.label}</strong>
                                    <span className="detection-confidence">{(det.confidence * 100).toFixed(0)}%</span>
                                </div>
                                <span className="detection-device">{det.device_id}</span>
                                <span className="detection-time">{new Date(det.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Garbage Breakdown</h3>
                <div className="garbage-breakdown animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="garbage-type">
                        <div className="garbage-type-value">{(garbageStats.plasticKg / 1000).toFixed(1)}t</div>
                        <div className="garbage-type-label">Plastic</div>
                    </div>
                    <div className="garbage-type">
                        <div className="garbage-type-value">{(garbageStats.organicKg / 1000).toFixed(1)}t</div>
                        <div className="garbage-type-label">Organic</div>
                    </div>
                    <div className="garbage-type">
                        <div className="garbage-type-value">{(garbageStats.debrisKg / 1000).toFixed(1)}t</div>
                        <div className="garbage-type-label">Debris</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
