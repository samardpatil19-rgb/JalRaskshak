import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// POST /api/complaints — submit anonymously (public)
router.post('/', (req, res) => {
    const { category, lat, lng, description } = req.body;

    if (!category || !description) {
        return res.status(400).json({ error: 'Category and description are required' });
    }

    const ticket_id = 'JR-' + Date.now().toString(36).toUpperCase();

    const result = db.prepare(
        'INSERT INTO complaints (category, lat, lng, description, ticket_id) VALUES (?, ?, ?, ?, ?)'
    ).run(category, lat ?? null, lng ?? null, description, ticket_id);

    res.status(201).json({ id: result.lastInsertRowid, ticket_id });
});

// GET /api/complaints — list all (protected)
router.get('/', authMiddleware, (req, res) => {
    const { status, limit } = req.query;

    let query = 'SELECT * FROM complaints';
    const params = [];

    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
    }

    const rows = db.prepare(query).all(...params);
    res.json({ complaints: rows });
});

// GET /api/complaints/:ticketId — lookup by ticket (public)
router.get('/:ticketId', (req, res) => {
    const row = db.prepare('SELECT id, category, status, ticket_id, created_at FROM complaints WHERE ticket_id = ?').get(req.params.ticketId);

    if (!row) {
        return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ complaint: row });
});

// PATCH /api/complaints/:id/status — update status (protected)
router.patch('/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const result = db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ success: true });
});

export default router;
