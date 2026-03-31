import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Home, Monitor, Map, Microscope, BarChart3, AlertTriangle,
    Leaf, FileText, Users, Menu, LogIn, LogOut
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { section: 'Overview' },
    { path: '/', label: 'Landing', icon: Home },
    { path: '/dashboard', label: 'Command Center', icon: Monitor },

    { section: 'Operations' },
    { path: '/route-planner', label: 'Route Planner', icon: Map },
    { path: '/ai-vision', label: 'AI Vision Lab', icon: Microscope },
    { path: '/sensors', label: 'Sensor Data', icon: BarChart3 },

    { section: 'Safety' },
    { path: '/alerts', label: 'Alerts & Emergency', icon: AlertTriangle },

    { section: 'Community' },
    { path: '/community', label: 'Community Hub', icon: Leaf },
    { path: '/complaints', label: 'Report Issue', icon: FileText },

    { section: 'Info' },
    { path: '/about', label: 'About Us', icon: Users },
];

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
                <Menu size={18} />
            </button>
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">JR</div>
                    <div>
                        <h2>Jal Rakshak</h2>
                        <span>River Cleaning AI</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="sidebar-section-title">{item.section}</div>;
                        }
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                end={item.path === '/'}
                                onClick={() => setOpen(false)}
                            >
                                <span className="sidebar-link-icon"><Icon size={16} strokeWidth={1.8} /></span>
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <div className="sidebar-user">
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{user.name || user.email}</span>
                                <span className="sidebar-user-role">{user.role}</span>
                            </div>
                            <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
                                <LogOut size={14} strokeWidth={2} />
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/login" className="sidebar-link" onClick={() => setOpen(false)}>
                            <span className="sidebar-link-icon"><LogIn size={16} strokeWidth={1.8} /></span>
                            Sign In
                        </NavLink>
                    )}
                </div>
            </aside>
        </>
    );
}
