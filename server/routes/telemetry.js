import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

// ── API Key Authentication for drone-to-server communication ──
const DRONE_API_KEY = process.env.DRONE_API_KEY || 'jalrakshak-drone-secret-2026';

function droneAuth(req, res, next) {
    const key = req.headers['x-drone-api-key'] || req.body?.api_key;
    if (key !== DRONE_API_KEY) {
        return res.status(401).json({ error: 'Invalid drone API key' });
    }
    next();
}

// ── POST /api/telemetry — Receive telemetry from Raspberry Pi ──
// This is the main endpoint the drone_bridge.py calls every 1-2 seconds
router.post('/', droneAuth, (req, res) => {
    const {
        device_id,
        lat, lng, altitude,
        battery, speed, heading,
        mode, armed
    } = req.body;

    if (!device_id || lat == null || lng == null) {
        return res.status(400).json({ error: 'device_id, lat, and lng are required' });
    }

    try {
        // Check if device exists, if not create it as a real hardware device
        const existing = db.prepare('SELECT id FROM devices WHERE id = ?').get(device_id);
        if (!existing) {
            // Auto-register the drone when it first connects
            const type = device_id.toLowerCase().startsWith('uav') ? 'uav' :
                         device_id.toLowerCase().startsWith('ufv') ? 'ufv' : 'uav';
            db.prepare(
                "INSERT INTO devices (id, type, lat, lng, battery, status) VALUES (?, ?, ?, ?, ?, 'active')"
            ).run(device_id, type, lat, lng, battery || 100);
        }

        // Detect nearest CCV sector
        let sector = null;
        try {
            const ccvs = db.prepare("SELECT id, lat, lng FROM devices WHERE type = 'ccv'").all();
            let minDist = Infinity;
            for (const ccv of ccvs) {
                const dist = Math.sqrt((lat - ccv.lat) ** 2 + (lng - ccv.lng) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    sector = ccv.id;
                }
            }
        } catch { /* ignore */ }

        // Update device position and telemetry
        db.prepare(`
            UPDATE devices 
            SET lat = ?, lng = ?, battery = ?, status = 'active', sector = ?, 
                last_updated = datetime('now')
            WHERE id = ?
        `).run(lat, lng, battery || 100, sector, device_id);

        // Broadcast fleet update via Socket.io
        const io = req.app.get('io');
        if (io) {
            const devices = db.prepare('SELECT * FROM devices').all();
            io.emit('fleet_update', devices);
        }

        res.json({ status: 'ok', sector });
    } catch (e) {
        console.error('Telemetry error:', e.message);
        res.status(500).json({ error: 'Failed to process telemetry' });
    }
});

// ── POST /api/telemetry/detection — Receive ML detections from RPi YOLOv8 ──
router.post('/detection', droneAuth, (req, res) => {
    const {
        device_id,
        label, confidence,
        lat, lng,
        bbox,
        image_base64
    } = req.body;

    if (!device_id || !label) {
        return res.status(400).json({ error: 'device_id and label are required' });
    }

    try {
        // Save the image to disk if provided
        let imagePath = null;
        if (image_base64) {
            const dir = path.join(__dirname, '..', 'detection_images');
            fs.mkdirSync(dir, { recursive: true });
            const filename = `det_${device_id}_${Date.now()}.jpg`;
            const filepath = path.join(dir, filename);
            fs.writeFileSync(filepath, Buffer.from(image_base64, 'base64'));
            imagePath = `/detection_images/${filename}`;
        }

        // Store detection in database
        db.prepare(`
            INSERT INTO detections (device_id, label, confidence, lat, lng, bbox, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(device_id, label, confidence || 0, lat || null, lng || null,
               bbox ? JSON.stringify(bbox) : null, imagePath);

        // Broadcast detection event via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('new_detection', {
                device_id,
                label,
                confidence,
                lat: lat || null,
                lng: lng || null,
                bbox,
                image_path: imagePath,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ status: 'ok' });
    } catch (e) {
        console.error('Detection storage error:', e.message);
        res.status(500).json({ error: 'Failed to store detection' });
    }
});

// ── GET /api/telemetry/detections — Fetch recent detections for the dashboard ──
router.get('/detections', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    try {
        const detections = db.prepare(
            'SELECT * FROM detections ORDER BY timestamp DESC LIMIT ?'
        ).all(limit);
        res.json({ detections });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch detections' });
    }
});

// ── GET /api/telemetry/missions/pending — RPi polls for new missions to upload ──
router.get('/missions/pending', droneAuth, (req, res) => {
    const { device_id } = req.query;
    if (!device_id) return res.status(400).json({ error: 'device_id is required' });

    try {
        const missions = db.prepare(`
            SELECT m.id as mission_id, m.route_id, m.status, r.waypoints, r.params
            FROM missions m
            JOIN routes r ON m.route_id = r.id
            WHERE m.device_id = ? AND m.status = 'active'
            ORDER BY m.start_time DESC
            LIMIT 1
        `).all(device_id);

        const parsed = missions.map(m => ({
            ...m,
            waypoints: JSON.parse(m.waypoints),
            params: JSON.parse(m.params || '{}')
        }));

        res.json({ missions: parsed });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch missions' });
    }
});

// ── PATCH /api/telemetry/missions/:id/confirm — RPi confirms upload to Pixhawk ──
router.patch('/missions/:id/confirm', droneAuth, (req, res) => {
    try {
        db.prepare("UPDATE missions SET status = 'in_flight' WHERE id = ?")
            .run(req.params.id);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to confirm mission' });
    }
});

// ── PATCH /api/telemetry/missions/:id/complete — RPi signals mission complete ──
router.patch('/missions/:id/complete', droneAuth, (req, res) => {
    try {
        db.prepare("UPDATE missions SET status = 'completed', end_time = datetime('now') WHERE id = ?")
            .run(req.params.id);
        
        // Also set device back to idle
        const mission = db.prepare('SELECT device_id FROM missions WHERE id = ?').get(req.params.id);
        if (mission) {
            db.prepare("UPDATE devices SET status = 'idle' WHERE id = ?").run(mission.device_id);
        }

        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to complete mission' });
    }
});

export default router;
