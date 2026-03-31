import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// GET /api/alerts — list all alerts
router.get('/', (req, res) => {
    const { type, resolved } = req.query;

    let query = 'SELECT * FROM alerts';
    const conditions = [];
    const params = [];

    if (type) {
        conditions.push('type = ?');
        params.push(type);
    }
    if (resolved !== undefined) {
        conditions.push('resolved = ?');
        params.push(resolved === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json({ alerts: rows });
});

// POST /api/alerts — create alert (protected)
router.post('/', authMiddleware, (req, res) => {
    const { type, severity, message, lat, lng } = req.body;

    if (!type || !message) {
        return res.status(400).json({ error: 'Type and message are required' });
    }

    const result = db.prepare(
        'INSERT INTO alerts (type, severity, message, lat, lng) VALUES (?, ?, ?, ?, ?)'
    ).run(type, severity || 'warning', message, lat ?? null, lng ?? null);

    res.status(201).json({ id: result.lastInsertRowid });
});

// PATCH /api/alerts/:id/resolve — mark as resolved (protected)
router.patch('/:id/resolve', authMiddleware, (req, res) => {
    const result = db.prepare('UPDATE alerts SET resolved = 1 WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true });
});

export default router;
