import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Trash2, Recycle, Radio, MapPin, Battery } from 'lucide-react';
import { uavs, ufvs, ccvs, sectors, garbageStats } from '../data/mockData';
import StatCard from '../components/StatCard';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

const iconUAV = L.divIcon({ className: 'custom-marker', html: '<div style="background:#fff;color:#000;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 0 8px rgba(255,255,255,0.3)">✈</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
const iconUFV = L.divIcon({ className: 'custom-marker', html: '<div style="background:#aaa;color:#000;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 0 8px rgba(255,255,255,0.15)">⚙</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
const iconCCV = L.divIcon({ className: 'custom-marker', html: '<div style="background:#666;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 0 8px rgba(255,255,255,0.1)">◉</div>', iconSize: [24, 24], iconAnchor: [12, 12] });

function getBatteryColor(pct) {
    if (pct > 60) return '#ccc';
    if (pct > 30) return '#888';
    return '#fff';
}

function getStatusBadge(status) {
    const map = { patrolling: 'badge-accent', collecting: 'badge-accent', 'en-route': 'badge-warning', returning: 'badge-warning', charging: 'badge-neutral', idle: 'badge-neutral', active: 'badge-success', maintenance: 'badge-danger' };
    return map[status] || 'badge-neutral';
}

export default function Dashboard() {
    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Command Center</h1>
                <p>Real-time monitoring of all deployed devices and operational metrics</p>
            </div>

            <div className="grid-4 animate-in" style={{ marginBottom: 20 }}>
                <StatCard label="Garbage Today" value={`${garbageStats.todayKg} kg`} sub="↑ 12% vs yesterday" icon={<Trash2 size={18} strokeWidth={1.5} />} />
                <StatCard label="Total Collected" value={`${(garbageStats.totalCollectedKg / 1000).toFixed(1)}t`} sub={`${Math.round(garbageStats.recycledKg / garbageStats.totalCollectedKg * 100)}% recycled`} icon={<Recycle size={18} strokeWidth={1.5} />} />
                <StatCard label="Active Devices" value="9" sub="3 UAVs · 6 UFVs" icon={<Radio size={18} strokeWidth={1.5} />} />
                <StatCard label="Sectors Online" value={sectors.length} sub="All sectors operational" icon={<MapPin size={18} strokeWidth={1.5} />} />
            </div>

            <div className="dashboard-grid animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="dashboard-map">
                    <MapContainer center={[23.035, 72.578]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        {sectors.map(s => (
                            <Circle key={s.id} center={s.center} radius={s.radius} pathOptions={{ color: '#555', fillColor: '#fff', fillOpacity: 0.02, weight: 1, dashArray: '6 4' }} />
                        ))}
                        {uavs.map(d => (
                            <Marker key={d.id} position={[d.lat, d.lng]} icon={iconUAV}>
                                <Popup><strong>{d.id}</strong><br />Status: {d.status}<br />Battery: {d.battery}%<br />Alt: {d.altitude}m</Popup>
                            </Marker>
                        ))}
                        {ufvs.map(d => (
                            <Marker key={d.id} position={[d.lat, d.lng]} icon={iconUFV}>
                                <Popup><strong>{d.id}</strong><br />Status: {d.status}<br />Battery: {d.battery}%<br />Bin: {d.garbageBinPercent}%</Popup>
                            </Marker>
                        ))}
                        {ccvs.map(d => (
                            <Marker key={d.id} position={[d.lat, d.lng]} icon={iconCCV}>
                                <Popup><strong>{d.id}</strong><br />Status: {d.status}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="dashboard-side">
                    <div className="device-panel">
                        <div className="device-panel-header">
                            <h3>UAV Fleet</h3>
                            <span className="badge badge-accent">{uavs.length} units</span>
                        </div>
                        <div className="device-list">
                            {uavs.map(d => (
                                <div key={d.id} className="device-item">
                                    <span className="device-id">{d.id}</span>
                                    <span className="device-status"><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></span>
                                    <div className="device-battery">
                                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${d.battery}%`, background: getBatteryColor(d.battery) }}></div></div>
                                        {d.battery}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="device-panel">
                        <div className="device-panel-header">
                            <h3>UFV Fleet</h3>
                            <span className="badge badge-accent">{ufvs.length} units</span>
                        </div>
                        <div className="device-list">
                            {ufvs.map(d => (
                                <div key={d.id} className="device-item">
                                    <span className="device-id">{d.id}</span>
                                    <span className="device-status"><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></span>
                                    <div className="device-battery">
                                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${d.battery}%`, background: getBatteryColor(d.battery) }}></div></div>
                                        {d.battery}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Garbage Breakdown</h3>
                <div className="garbage-breakdown animate-in" style={{ animationDelay: '0.2s' }}>
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
