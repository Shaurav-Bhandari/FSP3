const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Admin login
router.post('/login', async (req, res) => {
  console.log('Admin login attempt received.');
  const { username, password } = req.body;
  console.log('Attempting login for username:', username);
  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log('Admin not found for username:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    console.log('Admin found in DB. Comparing passwords...');
    // console.log('Provided password:', password); // DO NOT log passwords in production
    // console.log('Stored hash:', admin.password); // DO NOT log hashes in production
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      console.log('Invalid password for admin:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password valid for admin:', username);
    const token = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      'UPDATE admins SET token = $1, token_expires_at = $2 WHERE id = $3',
      [token, tokenExpiresAt, admin.id]
    );

    // Remove sensitive data before sending response
    const { password: adminPasswordHash, ...adminData } = admin; // Destructure and rename password to avoid sending

    res.json({ 
      token, 
      admin: adminData 
    });
  } catch (error) {
    console.error('Login error in try-catch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    await db.query(
      'UPDATE admins SET token = NULL, token_expires_at = NULL WHERE token = $1',
      [token]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 