import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// GET /api/devices — list all devices
router.get('/', (req, res) => {
    try {
        const devices = db.prepare('SELECT * FROM devices ORDER BY type, id').all();
        res.json({ devices });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// POST /api/devices — create a new device (UAV/UFV/CCV)
router.post('/', authMiddleware, (req, res) => {
    const { type, lat, lng } = req.body;

    if (!type || lat == null || lng == null) {
        return res.status(400).json({ error: 'type, lat, and lng are required' });
    }

    if (!['uav', 'ufv', 'ccv'].includes(type)) {
        return res.status(400).json({ error: 'type must be uav, ufv, or ccv' });
    }

    try {
        // Auto-generate ID based on type + count
        const prefix = type.toUpperCase();
        const existing = db.prepare("SELECT id FROM devices WHERE type = ? ORDER BY id DESC").all(type);
        let nextNum = 1;
        if (existing.length > 0) {
            // Extract the number from the last ID (e.g., "UAV-03" → 3)
            const lastId = existing[0].id;
            const match = lastId.match(/(\d+)$/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }
        const id = `${prefix}-${String(nextNum).padStart(2, '0')}`;

        db.prepare(
            'INSERT INTO devices (id, type, lat, lng, battery, trash_collected, status) VALUES (?, ?, ?, ?, 100, 0, ?)'
        ).run(id, type, lat, lng, type === 'ccv' ? 'active' : 'idle');

        // Broadcast immediately via socket
        const io = req.app.get('io');
        if (io) {
            const devices = db.prepare('SELECT * FROM devices').all();
            io.emit('fleet_update', devices);
        }

        res.status(201).json({ id, type, lat, lng, status: type === 'ccv' ? 'active' : 'idle', battery: 100 });
    } catch (e) {
        console.error('Create device error:', e);
        res.status(500).json({ error: 'Failed to create device' });
    }
});

// DELETE /api/devices/:id — remove a device
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        // Don't allow deleting devices on active missions
        const activeMission = db.prepare("SELECT id FROM missions WHERE device_id = ? AND status = 'active'").get(req.params.id);
        if (activeMission) {
            return res.status(400).json({ error: 'Cannot delete device with active mission' });
        }

        const result = db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Broadcast immediately
        const io = req.app.get('io');
        if (io) {
            const devices = db.prepare('SELECT * FROM devices').all();
            io.emit('fleet_update', devices);
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

export default router;
