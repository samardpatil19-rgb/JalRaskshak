import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { runSimulator } from './simulator.js';

// Initialize database (creates tables on import)
import './db.js';

import authRoutes from './routes/auth.js';
import sensorRoutes from './routes/sensors.js';
import routeDataRoutes from './routes/routeData.js';
import complaintRoutes from './routes/complaints.js';
import alertRoutes from './routes/alerts.js';
import deviceRoutes from './routes/devices.js';
import telemetryRoutes from './routes/telemetry.js';

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set('io', io);

// Start SITL Simulator
runSimulator(io);

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/routes', routeDataRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
    console.log(`\n  Jal Rakshak API Server & WebSockets`);
    console.log(`  ─────────────────────`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/api/health`);
    console.log(`  Status:  Ready\n`);
});
