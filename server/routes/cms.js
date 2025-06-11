const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Middleware to check admin authentication
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE token = $1 AND token_expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Content Management Routes
router.get('/content', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM content ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/content', authenticateAdmin, async (req, res) => {
  const { type, title, content, metadata } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO content (id, type, title, content, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), type, title, content, metadata]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Team Management Routes
router.get('/team', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM team_members ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/team', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { name, role, bio } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await db.query(
      'INSERT INTO team_members (id, name, role, bio, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), name, role, bio, imageUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gallery Management Routes
router.get('/gallery', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM gallery_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/gallery', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { title, description, category } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await db.query(
      'INSERT INTO gallery_items (id, title, description, image_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), title, description, imageUrl, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Services Management Routes
router.get('/services', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/services', authenticateAdmin, async (req, res) => {
  const { title, description, price, duration } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO services (id, title, description, price, duration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), title, description, price, duration]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Authentication Routes
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      'UPDATE admins SET token = $1, token_expires_at = $2 WHERE id = $3',
      [token, tokenExpiresAt, admin.id]
    );

    // Remove sensitive data before sending response
    const { password_hash, ...adminData } = admin;

    res.json({ 
      token, 
      admin: adminData 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/logout', authenticateAdmin, async (req, res) => {
  try {
    await db.query(
      'UPDATE admins SET token = NULL, token_expires_at = NULL WHERE id = $1',
      [req.admin.id]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 