import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authMiddleware } from '../auth.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client('414730021498-invo88mfak0fcriogq0r75u9q3cbmd1f.apps.googleusercontent.com');

const router = Router();

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential is required' });

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: '414730021498-invo88mfak0fcriogq0r75u9q3cbmd1f.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        const email = payload.email.toLowerCase();
        const name = payload.name;

        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            const hash = bcrypt.hashSync(Math.random().toString(36), 10);
            const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
            user = { id: result.lastInsertRowid, name, email, role: 'operator' };
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email.toLowerCase(), hash);

    const user = { id: result.lastInsertRowid, name, email: email.toLowerCase(), role: 'operator' };
    const token = generateToken(user);

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
});

export default router;
