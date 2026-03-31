import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plane, Bot, AlertTriangle } from 'lucide-react';
import './Navbar.css';

const pageTitles = {
    '/': 'Home',
    '/dashboard': 'Command Center',
    '/route-planner': 'Route Planner',
    '/ai-vision': 'AI Vision Lab',
    '/sensors': 'Sensor Data',
    '/alerts': 'Alerts & Emergency',
    '/community': 'Community Hub',
    '/complaints': 'Report Issue',
    '/about': 'About Us',
};

export default function Navbar() {
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const title = pageTitles[location.pathname] || 'Jal Rakshak';

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="navbar-breadcrumb">
                    Jal Rakshak / <strong>{title}</strong>
                </div>
            </div>
            <div className="navbar-right">
                <div className="navbar-indicator">
                    <Plane size={11} strokeWidth={2} />
                    3 UAVs
                </div>
                <div className="navbar-indicator">
                    <Bot size={11} strokeWidth={2} />
                    6 UFVs
                </div>
                <div className="navbar-indicator">
                    <AlertTriangle size={11} strokeWidth={2} />
                    2 Alerts
                </div>
                <div className="navbar-time">
                    {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
            </div>
        </header>
    );
}
