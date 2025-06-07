const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get all available sessions
router.get('/available', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sessions WHERE is_available = true ORDER BY date, start_time'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new session (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const { date, start_time, end_time } = req.body;
        
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await pool.query(
            'INSERT INTO sessions (date, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
            [date, start_time, end_time]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Book a session
router.post('/:sessionId/book', auth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // Check if session exists and is available
        const sessionCheck = await pool.query(
            'SELECT * FROM sessions WHERE id = $1 AND is_available = true',
            [sessionId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Session not available' });
        }

        // Create booking
        const booking = await pool.query(
            'INSERT INTO bookings (session_id, user_id) VALUES ($1, $2) RETURNING *',
            [sessionId, userId]
        );

        // Update session availability
        await pool.query(
            'UPDATE sessions SET is_available = false WHERE id = $1',
            [sessionId]
        );

        res.json(booking.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all bookings (admin only)
router.get('/bookings', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await pool.query(`
            SELECT b.*, u.username, s.date, s.start_time, s.end_time 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN sessions s ON b.session_id = s.id 
            ORDER BY s.date, s.start_time
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, s.date, s.start_time, s.end_time 
            FROM bookings b 
            JOIN sessions s ON b.session_id = s.id 
            WHERE b.user_id = $1 
            ORDER BY s.date, s.start_time
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 