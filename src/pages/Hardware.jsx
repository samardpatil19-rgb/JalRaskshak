import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Copy, Check, Terminal, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Hardware.css';

const API_KEY = 'jalrakshak-drone-secret-2026';

export default function Hardware() {
    const { fleet } = useSocket();
    const { user } = useAuth();
    const [copied, setCopied] = useState(null);
    const [serverUrl, setServerUrl] = useState('http://localhost:3001');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    // Separate hardware devices (UAV/UFV) from CCVs
    const hardwareDevices = fleet.filter(d => d.type !== 'ccv');
    const activeDevices = hardwareDevices.filter(d => d.status === 'active');
    const idleDevices = hardwareDevices.filter(d => d.status === 'idle');

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const data = await api.health();
            setTestResult({ success: true, message: `Server online — uptime: ${Math.floor(data.uptime)}s` });
        } catch (err) {
            setTestResult({ success: false, message: 'Server unreachable' });
        }
        setTesting(false);
    };

    // Build the full bridge command
    const bridgeCommand = `python jalrakshak_bridge.py --server ${serverUrl} --device-id UAV-01`;
    const simulateCommand = `python jalrakshak_bridge.py --simulate --server ${serverUrl}`;

    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Hardware Integration</h1>
                <p>Connect Raspberry Pi drones and ground vehicles to the JalRakshak command center</p>
            </div>

            {/* Connection Status Overview */}
            <div className="hw-status-bar animate-in">
                <div className="hw-status-item">
                    <Wifi size={16} />
                    <span><strong>{activeDevices.length}</strong> device{activeDevices.length !== 1 ? 's' : ''} online</span>
                </div>
                <div className="hw-status-item">
                    <WifiOff size={16} style={{ opacity: 0.4 }} />
                    <span>{idleDevices.length} idle</span>
                </div>
                <div className="hw-status-item">
                    <Cpu size={16} />
                    <span>{hardwareDevices.length} total registered</span>
                </div>
                <button className="btn btn-outline" style={{ marginLeft: 'auto', fontSize: '0.75rem' }} onClick={testConnection} disabled={testing}>
                    <RefreshCw size={12} className={testing ? 'spin' : ''} /> {testing ? 'Testing...' : 'Test Connection'}
                </button>
            </div>

            {testResult && (
                <div className={`hw-test-result ${testResult.success ? 'success' : 'error'} animate-in`}>
                    {testResult.success ? '✓' : '✕'} {testResult.message}
                </div>
            )}

            <div className="hw-grid animate-in" style={{ animationDelay: '0.1s' }}>
                {/* Left: Connected Devices */}
                <div className="hw-panel">
                    <div className="hw-panel-header">
                        <h3><Cpu size={14} /> Registered Devices</h3>
                    </div>
                    <div className="hw-device-list">
                        {hardwareDevices.length === 0 && (
                            <div className="hw-empty">
                                No devices registered yet. Place devices on the Command Center map or connect a Raspberry Pi using the instructions below.
                            </div>
                        )}
                        {hardwareDevices.map(d => (
                            <div key={d.id} className="hw-device-row">
                                <div className={`hw-device-indicator ${d.status === 'active' ? 'online' : 'offline'}`} />
                                <div className="hw-device-info">
                                    <strong>{d.id}</strong>
                                    <span className="hw-device-type">{d.type.toUpperCase()}</span>
                                </div>
                                <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                    {d.status}
                                </span>
                                <span className="hw-device-meta">
                                    {d.battery != null ? `${Number(d.battery).toFixed(0)}%` : '—'}
                                </span>
                                {d.sector && <span className="hw-device-sector">{d.sector}</span>}
                                {d.last_updated && (
                                    <span className="hw-device-meta" style={{ fontSize: '0.65rem' }}>
                                        {new Date(d.last_updated).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Connection Setup */}
                <div className="hw-panel">
                    <div className="hw-panel-header">
                        <h3><Terminal size={14} /> Connect Raspberry Pi</h3>
                    </div>
                    <div className="hw-setup-content">
                        <div className="hw-step">
                            <div className="hw-step-num">1</div>
                            <div className="hw-step-content">
                                <h4>Server URL</h4>
                                <p>Set this to your JalRakshak server address. For local testing use localhost, for AWS use your EC2 public IP.</p>
                                <input
                                    type="text"
                                    className="hw-input"
                                    value={serverUrl}
                                    onChange={e => setServerUrl(e.target.value)}
                                    placeholder="http://your-server:3001"
                                />
                            </div>
                        </div>

                        <div className="hw-step">
                            <div className="hw-step-num">2</div>
                            <div className="hw-step-content">
                                <h4>API Key</h4>
                                <p>Use this key in your bridge script or set as environment variable.</p>
                                <div className="hw-code-block">
                                    <code>{API_KEY}</code>
                                    <button className="hw-copy-btn" onClick={() => copyToClipboard(API_KEY, 'api-key')}>
                                        {copied === 'api-key' ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="hw-step">
                            <div className="hw-step-num">3</div>
                            <div className="hw-step-content">
                                <h4>Copy bridge script to Pi</h4>
                                <p>Copy <code>pi_bridge/jalrakshak_bridge.py</code> to your Raspberry Pi's deployment folder.</p>
                                <div className="hw-code-block">
                                    <code>scp pi_bridge/jalrakshak_bridge.py pi@&lt;pi-ip&gt;:~/</code>
                                    <button className="hw-copy-btn" onClick={() => copyToClipboard('scp pi_bridge/jalrakshak_bridge.py pi@<pi-ip>:~/', 'scp')}>
                                        {copied === 'scp' ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="hw-step">
                            <div className="hw-step-num">4</div>
                            <div className="hw-step-content">
                                <h4>Run on Raspberry Pi</h4>
                                <p>SSH into your Pi and run the bridge. It will connect to this server and start streaming telemetry.</p>
                                <div className="hw-code-block">
                                    <code>{bridgeCommand}</code>
                                    <button className="hw-copy-btn" onClick={() => copyToClipboard(bridgeCommand, 'run')}>
                                        {copied === 'run' ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                                <p style={{ marginTop: 8, fontSize: '0.72rem', color: '#888' }}>Or test without hardware:</p>
                                <div className="hw-code-block">
                                    <code>{simulateCommand}</code>
                                    <button className="hw-copy-btn" onClick={() => copyToClipboard(simulateCommand, 'sim')}>
                                        {copied === 'sim' ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="hw-step">
                            <div className="hw-step-num">5</div>
                            <div className="hw-step-content">
                                <h4>Verify on Dashboard</h4>
                                <p>Once the bridge is running, your device will appear in the Command Center map and the device list above will show it as <strong>online</strong>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Info */}
            <div className="hw-panel animate-in" style={{ animationDelay: '0.2s', marginTop: 20 }}>
                <div className="hw-panel-header">
                    <h3>How It Works</h3>
                </div>
                <div className="hw-arch-grid">
                    <div className="hw-arch-card">
                        <div className="hw-arch-icon">📡</div>
                        <h4>Pixhawk → RPi</h4>
                        <p>GPS, battery, altitude, speed, heading via MAVLink serial connection</p>
                    </div>
                    <div className="hw-arch-arrow">→</div>
                    <div className="hw-arch-card">
                        <div className="hw-arch-icon">🤖</div>
                        <h4>RPi Bridge</h4>
                        <p>Combines Pixhawk telemetry + YOLOv8 detections into one data stream</p>
                    </div>
                    <div className="hw-arch-arrow">→</div>
                    <div className="hw-arch-card">
                        <div className="hw-arch-icon">📶</div>
                        <h4>4G / WiFi</h4>
                        <p>Sends data via HTTP/WebSocket over 4G LTE dongle — no range limit</p>
                    </div>
                    <div className="hw-arch-arrow">→</div>
                    <div className="hw-arch-card">
                        <div className="hw-arch-icon">🖥️</div>
                        <h4>JalRakshak Server</h4>
                        <p>Stores in DB, broadcasts via Socket.io to all connected dashboards</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
