import { Link } from 'react-router-dom';
import { Plane, Bot, Radio, Brain, Map, Waves, ArrowRight, Activity } from 'lucide-react';
import { garbageStats } from '../data/mockData';
import './Landing.css';

const features = [
    { icon: Plane, title: 'UAV Aerial Surveillance', desc: 'AI-powered drones patrol rivers, detecting and mapping garbage hotspots and monitoring for drowning incidents in real-time.' },
    { icon: Bot, title: 'UFV River Cleaning', desc: 'Autonomous floating robots equipped with conveyor belt systems collect plastic waste, organic residues, and small debris.' },
    { icon: Radio, title: 'CCV Sensor Buoy', desc: 'Anchored buoys with temperature, BOD, TDS, pH, DO, and turbidity sensors for real-time water quality monitoring.' },
    { icon: Brain, title: 'AI Vision Verification', desc: 'Machine learning models process drone imagery to verify waste detection, cross-checked with command center to eliminate false positives.' },
    { icon: Map, title: 'Autonomous Route Planning', desc: 'Plan mission routes for drones and cleaning robots with payload, battery estimation, speed controls, and Mission Planner integration.' },
    { icon: Waves, title: 'Flood & Drowning Alerts', desc: 'Real-time safety monitoring with instant alerts to authorities when dangerous conditions are detected.' },
];

export default function Landing() {
    return (
        <div className="landing">
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-grid"></div>
                </div>
                <div className="hero-content animate-in">
                    <div className="hero-badge">
                        <Activity size={12} strokeWidth={2.5} />
                        System Active — Monitoring Live
                    </div>
                    <h1>
                        AI-Powered<br />
                        <span className="highlight">River Cleaning</span><br />
                        Ecosystem
                    </h1>
                    <p className="hero-sub">
                        Jal Rakshak deploys an integrated fleet of drones, autonomous cleaning robots,
                        and sensor buoys to locate, identify, and efficiently clean rivers using
                        artificial intelligence.
                    </p>
                    <div className="hero-actions">
                        <Link to="/dashboard" className="btn btn-accent">
                            Open Command Center <ArrowRight size={14} />
                        </Link>
                        <Link to="/about" className="btn btn-outline">
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stat">
                    <div className="landing-stat-value">{(garbageStats.totalCollectedKg / 1000).toFixed(1)}<span className="accent">t</span></div>
                    <div className="landing-stat-label">Garbage Collected</div>
                </div>
                <div className="landing-stat">
                    <div className="landing-stat-value">3</div>
                    <div className="landing-stat-label">Active Sectors</div>
                </div>
                <div className="landing-stat">
                    <div className="landing-stat-value">9</div>
                    <div className="landing-stat-label">Devices Deployed</div>
                </div>
                <div className="landing-stat">
                    <div className="landing-stat-value">{Math.round(garbageStats.recycledKg / garbageStats.totalCollectedKg * 100)}<span className="accent">%</span></div>
                    <div className="landing-stat-label">Recycled</div>
                </div>
            </section>

            <section className="landing-features">
                <h2>How It Works</h2>
                <p>A three-tier autonomous system for comprehensive river monitoring and cleaning.</p>
                <div className="feature-grid">
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div key={i} className="feature-card animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="feature-card-icon"><Icon size={28} strokeWidth={1.5} /></div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
