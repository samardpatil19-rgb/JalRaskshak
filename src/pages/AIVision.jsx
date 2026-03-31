import { useState } from 'react';
import { Eye, ScanSearch, CheckCircle, XCircle, Filter, MapPin } from 'lucide-react';
import { aiDetections } from '../data/mockData';
import './AIVision.css';

export default function AIVision() {
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);

    const filtered = filter === 'all' ? aiDetections
        : filter === 'match' ? aiDetections.filter(d => d.match)
            : aiDetections.filter(d => !d.match);

    const totalDetections = aiDetections.length;
    const matches = aiDetections.filter(d => d.match).length;
    const mismatches = aiDetections.filter(d => !d.match).length;
    const avgConfidence = (aiDetections.reduce((s, d) => s + d.droneConfidence, 0) / totalDetections * 100).toFixed(1);

    const detail = selected ? aiDetections.find(d => d.id === selected) : null;

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>AI Vision Verification Lab</h1>
                <p>Compare drone on-board ML detections with command center analysis to verify accuracy and eliminate false calls</p>
            </div>

            <div className="av-stats animate-in">
                <div className="av-stat">
                    <div className="av-stat-val">{totalDetections}</div>
                    <div className="av-stat-label">Total Detections</div>
                </div>
                <div className="av-stat">
                    <div className="av-stat-val" style={{ color: '#ccc' }}>{matches}</div>
                    <div className="av-stat-label">Verified Matches</div>
                </div>
                <div className="av-stat">
                    <div className="av-stat-val" style={{ color: '#fff' }}>{mismatches}</div>
                    <div className="av-stat-label">Mismatches</div>
                </div>
                <div className="av-stat">
                    <div className="av-stat-val">{avgConfidence}%</div>
                    <div className="av-stat-label">Avg Confidence</div>
                </div>
            </div>

            <div className="av-filter-row animate-in" style={{ animationDelay: '0.1s' }}>
                {['all', 'match', 'mismatch'].map(f => (
                    <button key={f} className={`av-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? <><Filter size={11} /> All</> : f === 'match' ? <><CheckCircle size={11} /> Matches</> : <><XCircle size={11} /> Mismatches</>}
                    </button>
                ))}
            </div>

            <div className="av-layout animate-in" style={{ animationDelay: '0.12s' }}>
                <div className="av-table-wrap">
                    <table className="av-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Drone</th>
                                <th>Drone Label</th>
                                <th>Drone Conf.</th>
                                <th>Center Label</th>
                                <th>Center Conf.</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => (
                                <tr key={d.id} onClick={() => setSelected(d.id)} style={{ cursor: 'pointer', background: selected === d.id ? 'rgba(255,255,255,0.03)' : undefined }}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>{d.timestamp}</td>
                                    <td><span className="badge badge-accent">{d.droneId}</span></td>
                                    <td>{d.droneLabel}</td>
                                    <td>
                                        <div className="av-confidence">
                                            <div className="av-conf-bar"><div className="av-conf-fill" style={{ width: `${d.droneConfidence * 100}%`, background: d.droneConfidence > 0.8 ? '#ccc' : '#666' }}></div></div>
                                            {(d.droneConfidence * 100).toFixed(0)}%
                                        </div>
                                    </td>
                                    <td>{d.commandLabel}</td>
                                    <td>
                                        <div className="av-confidence">
                                            <div className="av-conf-bar"><div className="av-conf-fill" style={{ width: `${d.commandConfidence * 100}%`, background: d.commandConfidence > 0.8 ? '#ccc' : '#666' }}></div></div>
                                            {(d.commandConfidence * 100).toFixed(0)}%
                                        </div>
                                    </td>
                                    <td>
                                        {d.match
                                            ? <span className="badge badge-success"><CheckCircle size={10} style={{ marginRight: 3 }} /> Verified</span>
                                            : <span className="badge badge-danger"><XCircle size={10} style={{ marginRight: 3 }} /> Mismatch</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="av-sidebar">
                    <div className="av-image-preview">
                        <h3 style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>
                            <Eye size={12} style={{ marginRight: 4 }} /> Detection Preview
                        </h3>
                        <div className="av-preview-placeholder">
                            {detail ? <><ScanSearch size={20} strokeWidth={1.2} style={{ marginBottom: 6 }} /><br />{detail.droneId} — {detail.timestamp}</> : <><ScanSearch size={20} strokeWidth={1.2} style={{ marginBottom: 6 }} /><br />Select a detection to preview</>}
                        </div>
                        {detail && (
                            <>
                                <div className="av-result-compare">
                                    <div className="av-result-box">
                                        <h4>Drone ML</h4>
                                        <p>{detail.droneLabel}</p>
                                        <span style={{ fontSize: '0.7rem', color: '#777' }}>{(detail.droneConfidence * 100).toFixed(0)}% confidence</span>
                                    </div>
                                    <div className="av-result-box">
                                        <h4>Command Center</h4>
                                        <p>{detail.commandLabel}</p>
                                        <span style={{ fontSize: '0.7rem', color: '#777' }}>{(detail.commandConfidence * 100).toFixed(0)}% confidence</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                    {detail.match
                                        ? <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '5px 14px' }}><CheckCircle size={11} style={{ marginRight: 4 }} /> Results Match — UFV Dispatch Approved</span>
                                        : <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '5px 14px' }}><XCircle size={11} style={{ marginRight: 4 }} /> Mismatch — Manual Review Required</span>
                                    }
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#555' }}>
                                    <MapPin size={11} style={{ marginRight: 3 }} /> {detail.lat.toFixed(5)}, {detail.lng.toFixed(5)}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="av-image-preview">
                        <h3 style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>
                            Verification Impact
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#999', lineHeight: 1.8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>False calls prevented</span>
                                <strong style={{ color: '#ccc' }}>{mismatches}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>UFV battery saved</span>
                                <strong style={{ color: '#aaa' }}>~{mismatches * 12}%</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Verification accuracy</span>
                                <strong>{(matches / totalDetections * 100).toFixed(0)}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
