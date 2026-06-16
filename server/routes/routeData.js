import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// POST /api/routes — save a route (protected)
router.post('/', authMiddleware, (req, res) => {
    const { device_type, name, waypoints, params } = req.body;

    if (!device_type || !name || !waypoints) {
        return res.status(400).json({ error: 'device_type, name, and waypoints are required' });
    }

    try {
        const result = db.prepare(
            'INSERT INTO routes (user_id, device_type, name, waypoints, params) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, device_type, name, JSON.stringify(waypoints), JSON.stringify(params || {}));

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (e) {
        res.status(500).json({ error: 'Failed to insert route' });
    }
});

// POST /api/routes/deploy — Start a mission mapping a route to a drone
router.post('/deploy', authMiddleware, (req, res) => {
    const { route_id, device_id } = req.body;
    if (!route_id || !device_id) return res.status(400).json({ error: 'route_id and device_id are required' });

    const device = db.prepare('SELECT status FROM devices WHERE id = ?').get(device_id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (device.status !== 'idle') return res.status(400).json({ error: 'Device is currently active.' });

    const result = db.prepare('INSERT INTO missions (device_id, route_id) VALUES (?, ?)').run(device_id, route_id);
    db.prepare("UPDATE devices SET status = 'active' WHERE id = ?").run(device_id);

    res.json({ success: true, mission_id: result.lastInsertRowid });
});

// GET /api/routes — list saved routes (protected)
router.get('/', authMiddleware, (req, res) => {
    const rows = db.prepare(
        'SELECT * FROM routes WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const routes = rows.map(r => ({
        ...r,
        waypoints: JSON.parse(r.waypoints),
        params: JSON.parse(r.params || '{}'),
    }));

    res.json({ routes });
});

// GET /api/routes/:id — get single route
router.get('/:id', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT * FROM routes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!row) {
        return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
        route: {
            ...row,
            waypoints: JSON.parse(row.waypoints),
            params: JSON.parse(row.params || '{}'),
        }
    });
});

// DELETE /api/routes/:id — delete a route (protected)
router.delete('/:id', authMiddleware, (req, res) => {
    const result = db.prepare('DELETE FROM routes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ success: true });
});

export default router;
