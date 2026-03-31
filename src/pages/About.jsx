import { Plane, Bot, Radio } from 'lucide-react';
import { founders } from '../data/mockData';
import './About.css';

const initials = (name) => name.split(' ').map(w => w[0]).join('');

export default function About() {
    return (
        <div className="page-container">
            <div className="about-hero animate-in">
                <h1>About Jal Rakshak</h1>
                <p>
                    We are a team of engineers and innovators building an AI-powered autonomous ecosystem
                    to clean and monitor India's rivers. Using drones, cleaning robots, and sensor buoys,
                    we aim to restore aquatic health sector by sector.
                </p>
            </div>

            <div className="founders-grid animate-in" style={{ animationDelay: '0.1s' }}>
                {founders.map((f, i) => (
                    <div key={i} className="founder-card">
                        <div className="founder-avatar">
                            {f.avatar ? <img src={f.avatar} alt={f.name} /> : initials(f.name)}
                        </div>
                        <h3>{f.name}</h3>
                        <div className="role">{f.role}</div>
                        <div className="bio">{f.bio}</div>
                    </div>
                ))}
            </div>

            <div className="about-tech animate-in" style={{ animationDelay: '0.15s' }}>
                <div className="about-tech-title">Our Technology Stack</div>
                <div className="tech-grid">
                    <div className="tech-card">
                        <div className="tech-card-icon"><Plane size={30} strokeWidth={1.3} /></div>
                        <h4>UAV System</h4>
                        <p>Custom-built drones with AI vision for aerial surveillance, garbage hotspot detection, and drowning/flood monitoring.</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-card-icon"><Bot size={30} strokeWidth={1.3} /></div>
                        <h4>UFV System</h4>
                        <p>Autonomous floating cleaning robots with conveyor belt mechanisms for efficient waste collection in river sectors.</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-card-icon"><Radio size={30} strokeWidth={1.3} /></div>
                        <h4>CCV Sensor Buoy</h4>
                        <p>Anchored sensor buoys monitoring temperature, BOD, TDS, pH, dissolved oxygen, and turbidity in real-time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
