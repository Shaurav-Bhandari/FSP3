const express = require('express');
const router = express.Router();
const pool = require('../config/database');
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
            SELECT * FROM bookings 
            ORDER BY appointment_date DESC, appointment_time DESC
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

// Book an appointment from the frontend form
router.post('/book', async (req, res) => {
    try {
        const {
            playerName,
            age,
            parentName,
            phone,
            email,
            service,
            date,
            time,
            message
        } = req.body;

        // Validate required fields
        if (!playerName || !age || !parentName || !phone || !email || !service || !date || !time) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate age
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 18) {
            return res.status(400).json({ error: 'Age must be between 5 and 18' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Create a new booking
        const result = await pool.query(
            `INSERT INTO bookings (
                player_name, age, parent_name, phone, email, 
                service_type, appointment_date, appointment_time, 
                message, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *`,
            [
                playerName,
                ageNum,
                parentName,
                phone,
                email,
                service,
                date,
                time,
                message || '',
                'pending'
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Booking error:', err);
        if (err.code === '23505') { // Unique violation
            res.status(400).json({ error: 'A booking already exists for this time slot' });
        } else {
            res.status(500).json({ error: 'Failed to create booking. Please try again later.' });
        }
    }
});

// Update booking status (admin only)
router.put('/:bookingId/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { bookingId } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 