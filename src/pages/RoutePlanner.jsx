import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Plane, Bot, Link2, Upload, Plus, X, Navigation, Save, FolderOpen, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import 'leaflet/dist/leaflet.css';
import './RoutePlanner.css';

const wpIcon = L.divIcon({ className: 'custom-marker', html: '<div style="background:#fff;color:#000;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;box-shadow:0 0 6px rgba(255,255,255,0.3)">◆</div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function ClickHandler({ onAdd }) {
    useMapEvents({ click: (e) => onAdd([e.latlng.lat, e.latlng.lng]) });
    return null;
}

export default function RoutePlanner() {
    const { user } = useAuth();
    const [deviceType, setDeviceType] = useState('uav');
    const [waypoints, setWaypoints] = useState([]);
    const [searchLat, setSearchLat] = useState('');
    const [searchLng, setSearchLng] = useState('');
    const [payload, setPayload] = useState('0.5');
    const [speed, setSpeed] = useState('12');
    const [rpm, setRpm] = useState('5400');
    const [altitude, setAltitude] = useState('45');
    const [routeName, setRouteName] = useState('');
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [showSaved, setShowSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deployingRouteId, setDeployingRouteId] = useState(null);
    const { fleet } = useSocket();

    // Load saved routes
    useEffect(() => {
        if (user) {
            api.getRoutes()
                .then(data => setSavedRoutes(data.routes || []))
                .catch(() => { });
        }
    }, [user]);

    const addWaypoint = useCallback((coords) => {
        setWaypoints(prev => [...prev, coords]);
    }, []);

    const removeWaypoint = (idx) => {
        setWaypoints(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSearch = () => {
        const lat = parseFloat(searchLat);
        const lng = parseFloat(searchLng);
        if (!isNaN(lat) && !isNaN(lng)) {
            addWaypoint([lat, lng]);
            setSearchLat('');
            setSearchLng('');
        }
    };

    const saveRoute = async () => {
        if (!routeName.trim() || waypoints.length < 2) return;
        setSaving(true);
        try {
            await api.saveRoute({
                device_type: deviceType,
                name: routeName,
                waypoints,
                params: { payload: parseFloat(payload), speed: parseFloat(speed), rpm: parseInt(rpm), altitude: deviceType === 'uav' ? parseInt(altitude) : undefined },
            });
            setRouteName('');
            // Refresh saved routes
            const data = await api.getRoutes();
            setSavedRoutes(data.routes || []);
        } catch (err) {
            console.error('Failed to save route:', err);
        } finally {
            setSaving(false);
        }
    };

    const loadRoute = (route) => {
        setDeviceType(route.device_type);
        setWaypoints(route.waypoints);
        if (route.params) {
            if (route.params.payload !== undefined) setPayload(String(route.params.payload));
            if (route.params.speed !== undefined) setSpeed(String(route.params.speed));
            if (route.params.rpm !== undefined) setRpm(String(route.params.rpm));
            if (route.params.altitude !== undefined) setAltitude(String(route.params.altitude));
        }
        setShowSaved(false);
    };

    const deleteRoute = async (id) => {
        try {
            await api.deleteRoute(id);
            setSavedRoutes(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Failed to delete route:', err);
        }
    };

    const handleDeploy = async (routeId, deviceId) => {
        if (!deviceId) return;
        try {
            await api.deployRoute(routeId, deviceId);
            setDeployingRouteId(null);
            alert(`Mission deployed successfully to ${deviceId}! Go to the Command Center to track it live.`);
        } catch (err) {
            console.error(err);
            alert('Failed to deploy mission.');
        }
    };

    const totalDist = waypoints.reduce((sum, wp, i) => {
        if (i === 0) return 0;
        const [lat1, lng1] = waypoints[i - 1];
        const [lat2, lng2] = wp;
        const dist = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2) * 111139;
        return sum + dist;
    }, 0);
    const speedVal = parseFloat(speed) || 1;
    const estTime = totalDist / speedVal;
    const payloadVal = parseFloat(payload) || 0;
    const drainRate = deviceType === 'uav' ? 0.8 + payloadVal * 0.4 : 0.3 + payloadVal * 0.02;
    const estBattery = Math.min(100, Math.max(0, 100 - (estTime / 60) * drainRate));

    const switchDevice = (type) => {
        setDeviceType(type);
        setPayload(type === 'uav' ? '0.5' : '15');
        setSpeed(type === 'uav' ? '12' : '4');
        setRpm(type === 'uav' ? '5400' : '1200');
        setAltitude('45');
    };

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Autonomous Route Planner</h1>
                        <p>Plan mission routes for UAVs and UFVs — click on the map or enter coordinates</p>
                    </div>
                    {user && (
                        <button className={`btn ${showSaved ? 'btn-accent' : 'btn-outline'}`} onClick={() => setShowSaved(!showSaved)} style={{ fontSize: '0.72rem' }}>
                            <FolderOpen size={12} /> Saved Routes ({savedRoutes.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Saved routes panel */}
            {showSaved && savedRoutes.length > 0 && (
                <div className="rp-saved-list animate-in" style={{ marginBottom: 16 }}>
                    {savedRoutes.map(r => (
                        <div key={r.id} className="rp-saved-item">
                            <div>
                                <strong style={{ fontSize: '0.82rem' }}>{r.name}</strong>
                                <span style={{ fontSize: '0.7rem', color: '#555', marginLeft: 8 }}>{r.device_type.toUpperCase()} · {r.waypoints.length} waypoints</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {deployingRouteId === r.id ? (
                                    <>
                                        <select onChange={(e) => handleDeploy(r.id, e.target.value)} defaultValue="" style={{ fontSize: '0.7rem', padding: '4px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: 4, width: '120px' }}>
                                            <option value="" disabled>Select {r.device_type.toUpperCase()}...</option>
                                            {fleet.filter(d => d.type === r.device_type && d.status === 'idle').map(d => (
                                                <option key={d.id} value={d.id}>{d.id} ({d.battery.toFixed(0)}%)</option>
                                            ))}
                                            {fleet.filter(d => d.type === r.device_type && d.status === 'idle').length === 0 && <option disabled>No idle devices</option>}
                                        </select>
                                        <button className="btn" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => setDeployingRouteId(null)}><X size={11} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn btn-accent" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => setDeployingRouteId(r.id)}>Deploy</button>
                                        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => loadRoute(r)}>Load</button>
                                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#ff4444', borderColor: '#442222' }} onClick={() => deleteRoute(r.id)}><Trash2 size={11} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="rp-device-toggle animate-in">
                <button className={`rp-device-btn ${deviceType === 'uav' ? 'active' : ''}`} onClick={() => switchDevice('uav')}>
                    <Plane size={14} strokeWidth={1.8} /> UAV (Drone)
                </button>
                <button className={`rp-device-btn ${deviceType === 'ufv' ? 'active' : ''}`} onClick={() => switchDevice('ufv')}>
                    <Bot size={14} strokeWidth={1.8} /> UFV (Cleaning Robot)
                </button>
            </div>

            <div className="rp-layout animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="rp-map">
                    <MapContainer center={[23.035, 72.578]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                        <ClickHandler onAdd={addWaypoint} />
                        {waypoints.map((wp, i) => (
                            <Marker key={i} position={wp} icon={wpIcon}>
                                <Popup>Waypoint {i + 1}<br />{wp[0].toFixed(5)}, {wp[1].toFixed(5)}</Popup>
                            </Marker>
                        ))}
                        {waypoints.length > 1 && (
                            <Polyline positions={waypoints} pathOptions={{ color: '#888', weight: 1.5, dashArray: '8 6', opacity: 0.7 }} />
                        )}
                    </MapContainer>
                </div>

                <div className="rp-panel">
                    {/* Coordinate Search */}
                    <div className="rp-section">
                        <h3>Add Waypoint</h3>
                        <div className="rp-field-group">
                            <div className="rp-field">
                                <label>Latitude</label>
                                <input type="number" step="any" placeholder="23.0350" value={searchLat} onChange={e => setSearchLat(e.target.value)} />
                            </div>
                            <div className="rp-field">
                                <label>Longitude</label>
                                <input type="number" step="any" placeholder="72.5780" value={searchLng} onChange={e => setSearchLng(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn btn-accent" style={{ width: '100%', marginTop: 10 }} onClick={handleSearch}><Plus size={14} /> Add Coordinate</button>
                    </div>

                    {/* Mission Parameters */}
                    <div className="rp-section">
                        <h3>{deviceType === 'uav' ? 'UAV' : 'UFV'} Parameters</h3>
                        <div className="rp-field-group">
                            <div className="rp-field">
                                <label>Payload (kg)</label>
                                <input type="number" step="0.1" value={payload} onChange={e => setPayload(e.target.value)} />
                            </div>
                            <div className="rp-field">
                                <label>Speed (m/s)</label>
                                <input type="number" step="0.5" value={speed} onChange={e => setSpeed(e.target.value)} />
                            </div>
                            <div className="rp-field">
                                <label>{deviceType === 'uav' ? 'Motor RPM' : 'Propeller RPM'}</label>
                                <input type="number" step="100" value={rpm} onChange={e => setRpm(e.target.value)} />
                            </div>
                            {deviceType === 'uav' && (
                                <div className="rp-field">
                                    <label>Altitude (m)</label>
                                    <input type="number" step="1" value={altitude} onChange={e => setAltitude(e.target.value)} />
                                </div>
                            )}
                        </div>

                        <div className="rp-battery-est">
                            <div className="rp-battery-row"><span>Distance</span><span>{totalDist.toFixed(0)} m</span></div>
                            <div className="rp-battery-row"><span>Est. Time</span><span>{(estTime / 60).toFixed(1)} min</span></div>
                            <div className="rp-battery-row"><span>Est. Battery Used</span><span style={{ color: estBattery > 40 ? '#ccc' : estBattery > 20 ? '#888' : '#fff' }}>{(100 - estBattery).toFixed(0)}%</span></div>
                            <div className="rp-battery-row"><span>Battery Remaining</span><span style={{ color: estBattery > 40 ? '#ccc' : estBattery > 20 ? '#888' : '#fff' }}>{estBattery.toFixed(0)}%</span></div>
                        </div>
                    </div>

                    {/* Waypoints List */}
                    <div className="rp-section">
                        <h3>Waypoints ({waypoints.length})</h3>
                        <div className="rp-waypoints">
                            {waypoints.length === 0 && <div className="rp-empty">Click on map to add waypoints</div>}
                            {waypoints.map((wp, i) => (
                                <div key={i} className="rp-waypoint">
                                    <div className="rp-wp-num">{i + 1}</div>
                                    <div className="rp-wp-coords">{wp[0].toFixed(5)}, {wp[1].toFixed(5)}</div>
                                    <button className="rp-wp-remove" onClick={() => removeWaypoint(i)}><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                        {waypoints.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button className="btn btn-accent" style={{ flex: 1 }}><Navigation size={13} /> Generate Route</button>
                                <button className="btn btn-outline" onClick={() => setWaypoints([])}>Clear</button>
                            </div>
                        )}
                    </div>

                    {/* Save Route */}
                    {user && waypoints.length >= 2 && (
                        <div className="rp-section">
                            <h3>Save Route</h3>
                            <div className="rp-field">
                                <input type="text" placeholder="Route name…" value={routeName} onChange={e => setRouteName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                            </div>
                            <button className="btn btn-accent" style={{ width: '100%' }} onClick={saveRoute} disabled={saving || !routeName.trim()}>
                                <Save size={13} /> {saving ? 'Saving…' : 'Save to Database'}
                            </button>
                        </div>
                    )}

                    {/* Mission Planner Integration */}
                    <div className="rp-section">
                        <h3>External Integration</h3>
                        <a href="https://firmware.ardupilot.org/Tools/MissionPlanner/" target="_blank" rel="noopener noreferrer" className="rp-mission-link">
                            <span className="rp-mission-icon"><Link2 size={18} strokeWidth={1.5} /></span>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.82rem' }}>Connect Mission Planner</strong>
                                <span style={{ fontSize: '0.7rem', color: '#555' }}>ArduPilot Mission Planner for advanced autonomous flight</span>
                            </div>
                        </a>
                        <div className="rp-mission-link" style={{ marginTop: 8 }}>
                            <span className="rp-mission-icon"><Upload size={18} strokeWidth={1.5} /></span>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.82rem' }}>Export to MAVLink</strong>
                                <span style={{ fontSize: '0.7rem', color: '#555' }}>Export waypoints as MAVLink-compatible mission file</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
