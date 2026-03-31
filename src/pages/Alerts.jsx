import { AlertTriangle, Waves, Clock, MapPin, Phone, Shield, LifeBuoy, CheckCircle } from 'lucide-react';
import { alerts, emergencyContacts } from '../data/mockData';
import StatCard from '../components/StatCard';
import './Alerts.css';

function getAlertIcon(type, severity) {
    if (severity === 'resolved') return <CheckCircle size={20} strokeWidth={1.5} />;
    if (type === 'drowning') return <LifeBuoy size={20} strokeWidth={1.5} />;
    if (type === 'flood') return <Waves size={20} strokeWidth={1.5} />;
    return <AlertTriangle size={20} strokeWidth={1.5} />;
}

export default function Alerts() {
    const active = alerts.filter(a => !a.resolved);
    const drowning = alerts.filter(a => a.type === 'drowning' && !a.resolved);
    const flood = alerts.filter(a => a.type === 'flood' && !a.resolved);

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Alerts & Emergency</h1>
                <p>Real-time drowning detection, flood monitoring, and emergency contacts</p>
            </div>

            <div className="grid-4 animate-in" style={{ marginBottom: 20 }}>
                <StatCard label="Active Alerts" value={active.length} sub="Requires attention" icon={<AlertTriangle size={18} strokeWidth={1.5} />} />
                <StatCard label="Drowning Alerts" value={drowning.length} sub="AI-detected incidents" icon={<LifeBuoy size={18} strokeWidth={1.5} />} />
                <StatCard label="Flood Warnings" value={flood.length} sub="Water level anomalies" icon={<Waves size={18} strokeWidth={1.5} />} />
                <StatCard label="Resolved Today" value={alerts.filter(a => a.resolved).length} sub="Successfully handled" icon={<CheckCircle size={18} strokeWidth={1.5} />} />
            </div>

            <div className="alerts-layout animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="alert-list">
                    {alerts.map(a => (
                        <div key={a.id} className={`alert-item ${a.severity}`}>
                            <div className="alert-icon">{getAlertIcon(a.type, a.severity)}</div>
                            <div className="alert-body">
                                <h4>{a.type === 'drowning' ? 'Drowning Alert' : 'Flood Warning'}</h4>
                                <p>{a.message}</p>
                                <div className="alert-meta">
                                    <span><Clock size={10} /> {a.time}</span>
                                    <span><MapPin size={10} /> {a.lat.toFixed(4)}, {a.lng.toFixed(4)}</span>
                                    <span className={`badge ${a.severity === 'critical' ? 'badge-danger' : a.severity === 'warning' ? 'badge-warning' : a.severity === 'resolved' ? 'badge-success' : 'badge-neutral'}`}>
                                        {a.severity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="contacts-panel">
                    <div className="contacts-title">Emergency Contacts</div>
                    {emergencyContacts.map((c, i) => (
                        <div key={i} className="contact-card">
                            <div className="contact-role">{c.role}</div>
                            <div className="contact-name">{c.name}</div>
                            <div className="contact-phone"><Phone size={11} strokeWidth={2} style={{ marginRight: 4 }} />{c.phone}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
