import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(name, email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card animate-in">
                <div className="login-brand">
                    <div className="login-brand-icon">JR</div>
                    <h1>Jal Rakshak</h1>
                    <p>AI River Cleaning Command Center</p>
                </div>

                <div className="login-tabs">
                    <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
                        <LogIn size={12} style={{ marginRight: 4 }} /> Sign In
                    </button>
                    <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
                        <UserPlus size={12} style={{ marginRight: 4 }} /> Register
                    </button>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="login-field">
                            <label><User size={11} style={{ marginRight: 4 }} /> Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="login-field">
                        <label><Mail size={11} style={{ marginRight: 4 }} /> Email Address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="login-field">
                        <label><Lock size={11} style={{ marginRight: 4 }} /> Password</label>
                        <input
                            type="password"
                            placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={mode === 'register' ? 6 : 1}
                        />
                    </div>

                    <button type="submit" className="btn btn-accent login-submit" disabled={loading}>
                        {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} />
                    </button>
                </form>

                <div className="login-footer">
                    Secure access · All sessions encrypted
                </div>
            </div>
        </div>
    );
}
