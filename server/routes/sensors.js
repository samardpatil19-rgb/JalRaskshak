import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// POST /api/sensors — log a reading (protected)
router.post('/', authMiddleware, (req, res) => {
    const { ccv_id, temp, ph, tds, do_val, bod, turbidity } = req.body;

    if (!ccv_id) {
        return res.status(400).json({ error: 'ccv_id is required' });
    }

    const result = db.prepare(
        'INSERT INTO sensor_readings (ccv_id, temp, ph, tds, do_val, bod, turbidity) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(ccv_id, temp ?? null, ph ?? null, tds ?? null, do_val ?? null, bod ?? null, turbidity ?? null);

    res.status(201).json({ id: result.lastInsertRowid });
});

// GET /api/sensors/:ccvId — get readings with optional date range
router.get('/:ccvId', (req, res) => {
    const { ccvId } = req.params;
    const { from, to, limit } = req.query;

    let query = 'SELECT * FROM sensor_readings WHERE ccv_id = ?';
    const params = [ccvId];

    if (from) {
        query += ' AND timestamp >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND timestamp <= ?';
        params.push(to);
    }

    query += ' ORDER BY timestamp DESC';

    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
    } else {
        query += ' LIMIT 500';
    }

    const rows = db.prepare(query).all(...params);
    res.json({ readings: rows });
});

// GET /api/sensors/:ccvId/latest — latest reading
router.get('/:ccvId/latest', (req, res) => {
    const row = db.prepare(
        'SELECT * FROM sensor_readings WHERE ccv_id = ? ORDER BY timestamp DESC LIMIT 1'
    ).get(req.params.ccvId);

    if (!row) {
        return res.status(404).json({ error: 'No readings found' });
    }

    res.json({ reading: row });
});

export default router;
