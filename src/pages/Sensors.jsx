import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Radio, Thermometer, Droplets, Beaker, Wind, Waves, TestTube, Database } from 'lucide-react';
import { ccvs, sensorReadings as mockReadings, sensorHistory as mockHistory } from '../data/mockData';
import { api } from '../api';
import './Sensors.css';

const sensorMeta = [
    { key: 'temp', label: 'Temperature', unit: '°C', icon: Thermometer, range: '20–35°C', color: '#ffffff' },
    { key: 'ph', label: 'pH Level', unit: '', icon: Beaker, range: '6.5–8.5', color: '#cccccc' },
    { key: 'tds', label: 'TDS', unit: 'ppm', icon: Droplets, range: '<500 ppm', color: '#aaaaaa' },
    { key: 'do_val', label: 'Dissolved Oxygen', unit: 'mg/L', icon: Wind, range: '>5 mg/L', color: '#888888' },
    { key: 'bod', label: 'BOD', unit: 'mg/L', icon: TestTube, range: '<6 mg/L', color: '#666666' },
    { key: 'turbidity', label: 'Turbidity', unit: 'NTU', icon: Waves, range: '<25 NTU', color: '#555555' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
        <div style={{ background: '#131313', border: '1px solid #222', borderRadius: '4px', padding: '10px 14px', fontSize: '0.78rem' }}>
            <div style={{ color: '#555', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span>{p.name}</span><strong>{p.value}</strong>
                </div>
            ))}
        </div>
    );
};

export default function Sensors() {
    const [activeCCV, setActiveCCV] = useState('CCV-01');
    const [readings, setReadings] = useState(mockReadings[activeCCV] || {});
    const [history, setHistory] = useState(mockHistory);
    const [dataSource, setDataSource] = useState('mock'); // 'mock' or 'api'

    useEffect(() => {
        if (dataSource === 'api') {
            // Fetch latest reading from backend
            api.getLatestSensor(activeCCV)
                .then(data => {
                    if (data.reading) {
                        setReadings(data.reading);
                    }
                })
                .catch(() => {
                    // Fallback to mock data
                    setReadings(mockReadings[activeCCV] || {});
                });

            // Fetch history from backend
            api.getSensorReadings(activeCCV, { limit: '48' })
                .then(data => {
                    if (data.readings && data.readings.length > 0) {
                        const mapped = data.readings.reverse().map(r => ({
                            time: r.timestamp.split(' ')[1]?.substring(0, 5) || r.timestamp,
                            temp: r.temp,
                            ph: r.ph,
                            tds: r.tds,
                            do_val: r.do_val,
                            bod: r.bod,
                            turbidity: r.turbidity,
                        }));
                        setHistory(mapped);
                    }
                })
                .catch(() => {
                    setHistory(mockHistory);
                });
        } else {
            setReadings(mockReadings[activeCCV] || {});
            setHistory(mockHistory);
        }
    }, [activeCCV, dataSource]);

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Water Quality Sensors</h1>
                        <p>Real-time environmental data from CCV sensor buoys</p>
                    </div>
                    <button
                        className={`btn ${dataSource === 'api' ? 'btn-accent' : 'btn-outline'}`}
                        onClick={() => setDataSource(prev => prev === 'mock' ? 'api' : 'mock')}
                        style={{ fontSize: '0.72rem' }}
                    >
                        <Database size={12} /> {dataSource === 'api' ? 'Live Data' : 'Mock Data'}
                    </button>
                </div>
            </div>

            <div className="sensors-ccv-select animate-in">
                {ccvs.map(c => (
                    <button key={c.id} className={`ccv-btn ${activeCCV === c.id ? 'active' : ''}`} onClick={() => setActiveCCV(c.id)}>
                        <Radio size={13} strokeWidth={2} /> {c.id}
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{c.status}</span>
                    </button>
                ))}
            </div>

            <div className="sensors-grid animate-in" style={{ animationDelay: '0.1s' }}>
                {sensorMeta.map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.key} className="sensor-card">
                            <div className="sensor-icon"><Icon size={24} strokeWidth={1.5} /></div>
                            <div className="sensor-name">{s.label}</div>
                            <div className="sensor-value" style={{ color: s.color }}>
                                {readings[s.key] ?? '—'}
                                <span className="sensor-unit">{s.unit}</span>
                            </div>
                            <div className="sensor-range">Normal: {s.range}</div>
                        </div>
                    );
                })}
            </div>

            <div className="sensor-chart-section animate-in" style={{ animationDelay: '0.15s' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>
                    {dataSource === 'api' ? '48-Hour History (Database)' : '24-Hour Trends (Mock)'}
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={history} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="time" stroke="#3a3a3a" fontSize={11} />
                        <YAxis stroke="#3a3a3a" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#777' }} />
                        {sensorMeta.map(s => (
                            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={1.5} dot={false} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
