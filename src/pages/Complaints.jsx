import { useState } from 'react';
import { Upload, CheckCircle, ArrowRight, Shield, Eye, Send } from 'lucide-react';
import { api } from '../api';
import './Complaints.css';

const categories = ['Water Pollution', 'Illegal Dumping', 'Dead Fish/Wildlife', 'Sewage Discharge', 'Industrial Waste', 'Other'];

export default function Complaints() {
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [form, setForm] = useState({ category: '', lat: '', lng: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.submitComplaint({
                category: form.category,
                lat: form.lat ? parseFloat(form.lat) : null,
                lng: form.lng ? parseFloat(form.lng) : null,
                description: form.description,
            });
            setTicketId(data.ticket_id);
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSubmitted(false);
        setError('');
        setForm({ category: '', lat: '', lng: '', description: '' });
    };

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Report an Issue</h1>
                <p>Submit an anonymous complaint about environmental concerns — no login required</p>
            </div>

            <div className="complaint-layout animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="complaint-form">
                    {submitted ? (
                        <div className="cf-success">
                            <div className="cf-success-icon"><CheckCircle size={48} strokeWidth={1.2} /></div>
                            <h3>Complaint Submitted</h3>
                            <p>Your report has been logged anonymously and saved to the database.</p>
                            <div className="cf-ticket">{ticketId}</div>
                            <p style={{ fontSize: '0.72rem', color: '#3a3a3a' }}>Save this ticket ID for reference</p>
                            <button className="btn btn-outline" style={{ marginTop: 14 }} onClick={reset}>Submit Another</button>
                        </div>
                    ) : (
                        <>
                            <h2>Anonymous Complaint Form</h2>
                            <p>All submissions are anonymous and forwarded to the relevant authorities.</p>

                            {error && <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '8px 12px', fontSize: '0.78rem', color: '#ccc', marginBottom: 16 }}>{error}</div>}

                            <form className="cf-fields" onSubmit={handleSubmit}>
                                <div className="cf-field">
                                    <label>Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                                        <option value="">Select category…</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="cf-row">
                                    <div className="cf-field">
                                        <label>Latitude</label>
                                        <input type="number" step="any" placeholder="23.0350" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
                                    </div>
                                    <div className="cf-field">
                                        <label>Longitude</label>
                                        <input type="number" step="any" placeholder="72.5780" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
                                    </div>
                                </div>

                                <div className="cf-field">
                                    <label>Description</label>
                                    <textarea placeholder="Describe the issue in detail…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required></textarea>
                                </div>

                                <div className="cf-field">
                                    <label>Photo Evidence (optional)</label>
                                    <div className="cf-upload">
                                        <Upload size={18} strokeWidth={1.5} style={{ marginBottom: 6 }} />
                                        <br />Click or drag to upload images
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-accent cf-submit" style={{ width: '100%' }} disabled={loading}>
                                    <Send size={14} /> {loading ? 'Submitting…' : 'Submit Report'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="complaint-info">
                    <div className="ci-card">
                        <h4><ArrowRight size={13} style={{ marginRight: 4 }} /> What Happens Next?</h4>
                        <ul>
                            <li>Your report is logged in our database</li>
                            <li>AI verifies the location via satellite</li>
                            <li>Nearest UAV dispatched for inspection</li>
                            <li>Authorities are notified if confirmed</li>
                            <li>Track status with your ticket ID</li>
                        </ul>
                    </div>
                    <div className="ci-card">
                        <h4><Eye size={13} style={{ marginRight: 4 }} /> Categories We Handle</h4>
                        <p>Water pollution, illegal dumping, sewage discharge, industrial waste, wildlife distress, and other environmental concerns along river systems.</p>
                    </div>
                    <div className="ci-card">
                        <h4><Shield size={13} style={{ marginRight: 4 }} /> Privacy</h4>
                        <p>All complaints are <strong>completely anonymous</strong>. We do not collect IP addresses, cookies, or any identifying information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
